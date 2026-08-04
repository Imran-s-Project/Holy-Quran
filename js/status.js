// ---------- WhatsApp-style Status / Stories (text + আয়াত অডিও) ----------
// A horizontal ring-bar (see #statusBar in index.html, right under the
// রমজান banner) shows every account's current, non-expired status as a
// tappable circle — exactly like WhatsApp Status. Tapping one opens a
// full-screen story viewer that auto-advances between slides.
//
// Two status types, chosen by the poster:
//   'text' — plain typed text, shown full-screen over a picked colour
//            gradient (a "story slide", not an uploaded photo).
//   'ayah' — a picked সূরা:আয়াত, shown as Arabic + বাংলা অনুবাদ with its
//            তিলাওয়াত audio auto-playing, like an audio story.
//
// Anyone can VIEW statuses — signed in or not. Posting a status requires
// being signed in (js/auth.js state.user); guests are sent to the sign-in
// overlay if they tap the "+".  Each status carries its own expiresAt,
// picked by the poster at post time (১/৩/৬/১২/২৪/৪৮ ঘণ্টা), and is
// filtered out client-side once expired.
//
// Firestore doc shape — collection "statuses":
//   { uid, name, avatarColor, avatarIcon,
//     type: 'text' | 'ayah',
//     text, bg,                                              // type:'text'
//     surah, ayah, surahName, arabic, translation,
//     reciter, reciterName, audioUrl,                        // type:'ayah'
//     createdAt (ms epoch, client clock), expiresAt (ms epoch),
//     viewers: { [uid]: { name, avatarColor, avatarIcon, viewedAt } },
//     reactions: { [uid]: { name, avatarColor, avatarIcon, at } } }  // love-only for now
//
// Bottom-left of the full-screen viewer shows the view COUNT (owner only,
// tapping opens the "who has seen it" sheet — names + a heart if they also
// reacted). Bottom-right shows a tappable love (❤) button for everyone
// except the owner — tap to react, tap again to un-react.
//
// Firestore Rules needed (add alongside the ones already documented in
// js/firebase-config.js) — public read, owner-only write, but any signed-in
// user may write ONLY their own key inside `viewers` / `reactions`. Posting
// is also blocked server-side for accounts an admin has marked
// restricted/blocked (see quranadmin-main's firestore.rules — the canonical,
// up-to-date copy of these rules lives there now):
//
//   match /statuses/{id} {
//     allow read: if true;
//     allow create: if request.auth != null
//                    && request.resource.data.uid == request.auth.uid
//                    && !(exists(/databases/$(database)/documents/users/$(request.auth.uid))
//                         && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status in ['restricted', 'blocked']);
//     allow update: if request.auth != null && (
//         resource.data.uid == request.auth.uid ||
//         (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewers']) &&
//          request.resource.data.viewers.diff(resource.data.get('viewers', {})).affectedKeys().hasOnly([request.auth.uid])) ||
//         (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reactions']) &&
//          request.resource.data.reactions.diff(resource.data.get('reactions', {})).affectedKeys().hasOnly([request.auth.uid]))
//     );
//     allow delete: if request.auth != null && (resource.data.uid == request.auth.uid || isAdmin());
//   }

const STATUS_TOTAL_AYAHS = 6236; // মোট আয়াত সংখ্যা — এলোমেলো আয়াত বাছাইয়ের জন্য
const STATUS_DURATIONS = [1, 3, 6, 12, 24, 48]; // ঘণ্টা
const STATUS_TEXT_MS = 6000; // টেক্সট স্ট্যাটাস স্লাইড কতক্ষণ দেখাবে
const STATUS_BG_PRESETS = [
  'linear-gradient(160deg,#0E3B36,#123A34)',
  'linear-gradient(160deg,#7A3B12,#B5581F)',
  'linear-gradient(160deg,#3D2470,#5A3A9E)',
  'linear-gradient(160deg,#092723,#1B342C)',
  'linear-gradient(160deg,#4A3568,#7A4AC7)',
  'linear-gradient(160deg,#123A34,#C0973A)',
  'linear-gradient(160deg,#7A1F3D,#B5335A)'
];

let statusUnsub = null;
let statusList = [];      // flat, non-expired, all users
let statusGroups = [];    // grouped by uid, in ring-bar order
let statusViewerIdx = -1; // index into statusGroups currently open in the viewer
let statusSlideIdx = 0;
let statusSlideTimer = null;
let statusAudioEl = null;
let statusIsPaused = false;
let statusHoldTimer = null;
let statusSelectedBg = STATUS_BG_PRESETS[0];
let statusSelectedDuration = 24;
let statusSurahMetaCache = {};

// ================= Init / live listener =================
function initStatus(){
  if(!document.getElementById('statusBar')) return;
  listenStatuses();
  setInterval(pruneExpiredStatuses, 60000);
}

function listenStatuses(){
  if(typeof fbDb === 'undefined' || !fbDb || typeof firebase === 'undefined'){
    setTimeout(listenStatuses, 1500); // firebase-config.js / auth.js may still be loading
    return;
  }
  if(statusUnsub) return;
  try{
    statusUnsub = fbDb.collection('statuses').orderBy('createdAt', 'desc').limit(200)
      .onSnapshot(snap => {
        const now = Date.now();
        statusList = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => (s.expiresAt || 0) > now);
        groupStatuses();
        renderStatusBar();
      }, err => console.warn('স্ট্যাটাস লোড ব্যর্থ:', err));
  }catch(e){ console.warn('স্ট্যাটাস ইনিট ব্যর্থ:', e); }
}

function pruneExpiredStatuses(){
  const now = Date.now();
  const before = statusList.length;
  statusList = statusList.filter(s => (s.expiresAt || 0) > now);
  if(statusList.length !== before){ groupStatuses(); renderStatusBar(); }
}

// ================= Locally-seen tracking (per-device, not per-account) =================
function getSeenStatusIds(){
  try{ return JSON.parse(localStorage.getItem('qr_seen_statuses') || '[]'); }catch(e){ return []; }
}
function markStatusSeenLocally(id){
  try{
    const arr = getSeenStatusIds();
    if(!arr.includes(id)){
      arr.push(id);
      if(arr.length > 500) arr.splice(0, arr.length - 500);
      localStorage.setItem('qr_seen_statuses', JSON.stringify(arr));
    }
  }catch(e){}
}

// ================= Group + render the ring bar =================
function groupStatuses(){
  const byUid = new Map();
  statusList.forEach(s => {
    if(!byUid.has(s.uid)) byUid.set(s.uid, []);
    byUid.get(s.uid).push(s);
  });
  const seen = getSeenStatusIds();
  const myUid = state.user && state.user.uid;
  statusGroups = Array.from(byUid.entries()).map(([uid, items]) => {
    items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); // oldest → newest (playback order)
    const newest = items[items.length - 1];
    return {
      uid, name: newest.name, avatarColor: newest.avatarColor, avatarIcon: newest.avatarIcon,
      items, hasUnseen: items.some(s => !seen.includes(s.id)), latestTs: newest.createdAt || 0
    };
  });
  statusGroups.sort((a, b) => {
    if(myUid){ if(a.uid === myUid) return -1; if(b.uid === myUid) return 1; }
    if(a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return b.latestTs - a.latestTs;
  });
}

function statusAvatarHtml(g){
  const style = g.avatarColor ? ` style="background:${g.avatarColor}"` : '';
  const inner = (g.avatarIcon && /^[a-z0-9-]+$/i.test(g.avatarIcon))
    ? `<i class="fa-solid fa-${g.avatarIcon}"></i>`
    : escapeHtml(((g.name || '?').trim().charAt(0) || '?').toUpperCase());
  return `<span class="status-ring-avatar"${style}>${inner}</span>`;
}

function renderStatusBar(){
  const bar = document.getElementById('statusBar');
  if(!bar) return;
  const myUid = state.user && state.user.uid;
  const myGroup = myUid ? statusGroups.find(g => g.uid === myUid) : null;
  const others = statusGroups.filter(g => g.uid !== myUid);

  if(!myGroup && !others.length && !state.user){
    // guest, no statuses at all yet — still show a subtle "add" invite so
    // it's discoverable, WhatsApp does the same with an empty status list.
  }

  let html = `
    <div class="status-ring-item" data-mine="1">
      <div class="status-ring-wrap">
        <button type="button" class="status-ring-btn ${myGroup ? (myGroup.hasUnseen ? 'unseen' : 'seen') : 'empty'}" ${myGroup ? `data-open-group="${myGroup.uid}"` : 'data-status-add="1"'}>
          ${myGroup ? statusAvatarHtml(myGroup) : `<span class="status-ring-avatar status-ring-avatar-empty">${state.user ? escapeHtml((state.user.name || '?').charAt(0).toUpperCase()) : '<i class="fa-solid fa-user"></i>'}</span>`}
        </button>
        <button type="button" class="status-ring-plus" data-status-add="1" title="নতুন স্ট্যাটাস"><i class="fa-solid fa-plus"></i></button>
      </div>
      <span class="status-ring-label">${myGroup ? 'আপনার স্ট্যাটাস' : 'স্ট্যাটাস যোগ করুন'}</span>
    </div>`;

  others.forEach(g => {
    html += `
    <div class="status-ring-item">
      <div class="status-ring-wrap">
        <button type="button" class="status-ring-btn ${g.hasUnseen ? 'unseen' : 'seen'}" data-open-group="${g.uid}">
          ${statusAvatarHtml(g)}
        </button>
      </div>
      <span class="status-ring-label">${escapeHtml((g.name || 'ব্যবহারকারী').split(' ')[0])}</span>
    </div>`;
  });

  bar.innerHTML = html;
  bar.style.display = 'flex';

  bar.querySelectorAll('[data-status-add]').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openStatusComposer(); };
  });
  bar.querySelectorAll('[data-open-group]').forEach(btn => {
    btn.onclick = () => {
      const uid = btn.getAttribute('data-open-group');
      const idx = statusGroups.findIndex(g => g.uid === uid);
      if(idx !== -1) openStatusViewer(idx);
    };
  });
}

// ================= Composer =================
function ensureStatusComposer(){
  let el = document.getElementById('statusComposer');
  if(el) return el;
  el = document.createElement('div');
  el.id = 'statusComposer';
  el.className = 'app-modal';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="app-modal-box status-composer-box">
      <div class="app-modal-head">
        <div class="app-modal-head-title"><h3><i class="fa-solid fa-circle-plus"></i> নতুন স্ট্যাটাস</h3></div>
        <button class="app-modal-close" id="statusComposerClose">✕</button>
      </div>
      <div class="app-modal-body">
        <div class="status-type-tabs">
          <button type="button" class="status-type-tab active" id="statusTypeTextBtn" data-type="text"><i class="fa-solid fa-font"></i> লেখা স্ট্যাটাস</button>
          <button type="button" class="status-type-tab" id="statusTypeAyahBtn" data-type="ayah"><i class="fa-solid fa-book-quran"></i> আয়াত স্ট্যাটাস</button>
        </div>

        <div id="statusFormText">
          <div class="status-text-preview" id="statusTextPreview" style="background:${statusSelectedBg}">
            <textarea id="statusTextInput" maxlength="300" placeholder="আপনার মনের কথা লিখুন..."></textarea>
          </div>
          <div class="status-char-count"><span id="statusCharCount">0</span>/৩০০</div>
          <div class="status-bg-swatches" id="statusBgSwatches">
            ${STATUS_BG_PRESETS.map((bg, i) => `<button type="button" class="status-bg-swatch${i===0?' active':''}" data-bg="${bg}" style="background:${bg}"></button>`).join('')}
          </div>
        </div>

        <div id="statusFormAyah" style="display:none;">
          <div class="status-ayah-row">
            <label>সূরা</label>
            <select id="statusSurahSelect"></select>
          </div>
          <div class="status-ayah-row">
            <label>আয়াত নম্বর</label>
            <input type="number" id="statusAyahInput" min="1" value="1">
          </div>
          <div class="status-hint" id="statusAyahHint"></div>
          <div class="status-ayah-row">
            <label>ক্বারী</label>
            <select id="statusReciterSelect"></select>
          </div>
          <button type="button" class="status-random-btn" id="statusRandomAyahBtn"><i class="fa-solid fa-shuffle"></i> এলোমেলো আয়াত</button>
        </div>

        <div class="status-duration-row" id="statusDurationRow"></div>

        <button type="button" class="status-submit-btn" id="statusSubmitBtn"><i class="fa-solid fa-paper-plane"></i> স্ট্যাটাস পোস্ট করুন</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener('click', (e) => { if(e.target === el) closeStatusComposer(); });
  document.getElementById('statusComposerClose').onclick = closeStatusComposer;

  document.getElementById('statusTypeTextBtn').onclick = () => switchStatusType('text');
  document.getElementById('statusTypeAyahBtn').onclick = () => switchStatusType('ayah');

  const textInput = document.getElementById('statusTextInput');
  textInput.addEventListener('input', () => {
    document.getElementById('statusCharCount').textContent = toBn(textInput.value.length);
  });

  document.getElementById('statusBgSwatches').querySelectorAll('.status-bg-swatch').forEach(sw => {
    sw.onclick = () => {
      statusSelectedBg = sw.getAttribute('data-bg');
      document.getElementById('statusTextPreview').style.background = statusSelectedBg;
      el.querySelectorAll('.status-bg-swatch').forEach(s => s.classList.toggle('active', s === sw));
    };
  });

  const durRow = document.getElementById('statusDurationRow');
  durRow.innerHTML = STATUS_DURATIONS.map(h => `<button type="button" class="status-duration-btn${h===24?' active':''}" data-hours="${h}">${toBn(h)} ঘণ্টা</button>`).join('');
  durRow.querySelectorAll('.status-duration-btn').forEach(btn => {
    btn.onclick = () => {
      statusSelectedDuration = +btn.getAttribute('data-hours');
      durRow.querySelectorAll('.status-duration-btn').forEach(b => b.classList.toggle('active', b === btn));
    };
  });

  const surahSelect = document.getElementById('statusSurahSelect');
  surahSelect.innerHTML = surahNamesBn.map((name, i) => `<option value="${i+1}">${toBn(i+1)}. ${escapeHtml(name)}</option>`).join('');
  surahSelect.addEventListener('change', () => updateStatusAyahHint());

  const reciterSelect = document.getElementById('statusReciterSelect');
  reciterSelect.innerHTML = reciters.map(r => `<option value="${r.id}">${escapeHtml(r.bn || r.name)}</option>`).join('');

  document.getElementById('statusRandomAyahBtn').onclick = fillRandomStatusAyah;
  document.getElementById('statusSubmitBtn').onclick = submitStatus;

  updateStatusAyahHint();
  return el;
}

function switchStatusType(type){
  document.getElementById('statusTypeTextBtn').classList.toggle('active', type === 'text');
  document.getElementById('statusTypeAyahBtn').classList.toggle('active', type === 'ayah');
  document.getElementById('statusFormText').style.display = type === 'text' ? 'block' : 'none';
  document.getElementById('statusFormAyah').style.display = type === 'ayah' ? 'block' : 'none';
  document.getElementById('statusComposer').setAttribute('data-active-type', type);
}

async function updateStatusAyahHint(){
  const surah = +document.getElementById('statusSurahSelect').value;
  const hintEl = document.getElementById('statusAyahHint');
  const ayahInput = document.getElementById('statusAyahInput');
  if(statusSurahMetaCache[surah]){
    ayahInput.max = statusSurahMetaCache[surah];
    hintEl.textContent = `সূরা ${surahNamesBn[surah-1] || ''} — সর্বোচ্চ ${toBn(statusSurahMetaCache[surah])} আয়াত`;
    return;
  }
  hintEl.textContent = 'লোড হচ্ছে...';
  try{
    const res = await fetch(`${API}/surah/${surah}`);
    const json = await res.json();
    const total = json.data && json.data.numberOfAyahs;
    if(total){
      statusSurahMetaCache[surah] = total;
      ayahInput.max = total;
      hintEl.textContent = `সূরা ${surahNamesBn[surah-1] || ''} — সর্বোচ্চ ${toBn(total)} আয়াত`;
    }
  }catch(e){ hintEl.textContent = ''; }
}

async function fillRandomStatusAyah(){
  const btn = document.getElementById('statusRandomAyahBtn');
  btn.disabled = true;
  try{
    const g = 1 + Math.floor(Math.random() * STATUS_TOTAL_AYAHS);
    const res = await fetch(`${API}/ayah/${g}/quran-uthmani`);
    const json = await res.json();
    if(json.data){
      document.getElementById('statusSurahSelect').value = json.data.surah.number;
      document.getElementById('statusAyahInput').value = json.data.numberInSurah;
      await updateStatusAyahHint();
    }
  }catch(e){ showToast('এলোমেলো আয়াত আনা যায়নি'); }
  btn.disabled = false;
}

function openStatusComposer(){
  if(!state.user){
    showToast('স্ট্যাটাস দিতে প্রথমে সাইন ইন করুন');
    if(typeof openAuthFlow === 'function') openAuthFlow('login');
    return;
  }
  // এডমিন প্যানেল থেকে "সীমিত"/"ব্লক" করা অ্যাকাউন্ট নতুন স্টোরি পোস্ট
  // করতে পারবে না (Firestore rules-এও একই শর্ত সার্ভার-সাইডে বাধ্যতামূলক)।
  if(state.user.status === 'restricted' || state.user.status === 'blocked'){
    showToast(
      state.user.statusReason
        ? `আপনার অ্যাকাউন্ট সীমিত অবস্থায় আছে — নতুন স্টোরি পোস্ট করা যাবে না: ${state.user.statusReason}`
        : 'আপনার অ্যাকাউন্ট সীমিত অবস্থায় আছে — নতুন স্টোরি পোস্ট করা যাবে না।',
      'error'
    );
    return;
  }
  const el = ensureStatusComposer();
  switchStatusType('text');
  document.getElementById('statusTextInput').value = '';
  document.getElementById('statusCharCount').textContent = '0';
  statusSelectedDuration = 24;
  el.querySelectorAll('.status-duration-btn').forEach(b => b.classList.toggle('active', +b.getAttribute('data-hours') === 24));
  el.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeStatusComposer(){
  const el = document.getElementById('statusComposer');
  if(el) el.style.display = 'none';
  document.body.style.overflow = '';
}

async function submitStatus(){
  if(!state.user){ openStatusComposer(); return; }
  if(state.user.status === 'restricted' || state.user.status === 'blocked'){ openStatusComposer(); return; }
  const type = document.getElementById('statusComposer').getAttribute('data-active-type') || 'text';
  const btn = document.getElementById('statusSubmitBtn');
  btn.disabled = true;
  try{
    if(type === 'text'){
      const text = document.getElementById('statusTextInput').value.trim();
      if(!text){ showToast('কিছু একটা লিখুন'); btn.disabled = false; return; }
      await postStatusDoc({ type: 'text', text, bg: statusSelectedBg });
    } else {
      const surah = +document.getElementById('statusSurahSelect').value;
      const ayahNum = +document.getElementById('statusAyahInput').value;
      const reciterId = document.getElementById('statusReciterSelect').value;
      if(!surah || !ayahNum || ayahNum < 1){ showToast('সূরা ও আয়াত নম্বর সঠিকভাবে দিন'); btn.disabled = false; return; }
      const [arRes, trRes] = await Promise.all([
        fetch(`${API}/ayah/${surah}:${ayahNum}/quran-uthmani`),
        fetch(`${API}/ayah/${surah}:${ayahNum}/${state.translationEdition || 'bn.bengali'}`)
      ]);
      const arJson = await arRes.json();
      const trJson = await trRes.json();
      if(arJson.code !== 200 || !arJson.data){ throw new Error('invalid ayah'); }
      const r = reciters.find(x => x.id === reciterId);
      await postStatusDoc({
        type: 'ayah', surah, ayah: ayahNum,
        surahName: surahNamesBn[surah-1] || (arJson.data.surah && arJson.data.surah.englishName) || '',
        arabic: arJson.data.text,
        translation: (trJson.data && trJson.data.text) || '',
        reciter: reciterId, reciterName: (r && r.bn) || (r && r.name) || '',
        audioUrl: buildAudioUrl(reciterId, surah, arJson.data.number)
      });
    }
    closeStatusComposer();
    showToast('স্ট্যাটাস পোস্ট করা হয়েছে');
  }catch(e){
    showToast('স্ট্যাটাস পোস্ট করা যায়নি — আয়াত নম্বর যাচাই করুন বা আবার চেষ্টা করুন');
  }
  btn.disabled = false;
}

async function postStatusDoc(payload){
  const now = Date.now();
  const doc = Object.assign({
    uid: state.user.uid,
    name: state.user.name || 'ব্যবহারকারী',
    avatarColor: state.user.avatarColor || '',
    avatarIcon: (state.user.avatarIcon || ''),
    createdAt: now,
    expiresAt: now + statusSelectedDuration * 3600 * 1000,
    viewers: {},
    reactions: {}
  }, payload);
  await fbDb.collection('statuses').add(doc);
}

// ================= Story viewer =================
function ensureStatusViewer(){
  let el = document.getElementById('statusViewer');
  if(el) return el;
  el = document.createElement('div');
  el.id = 'statusViewer';
  el.className = 'status-viewer';
  el.style.display = 'none';
  el.innerHTML = `
    <div class="status-viewer-progress" id="statusViewerProgress"></div>
    <div class="status-viewer-header">
      <span class="status-viewer-avatar" id="statusViewerAvatar"></span>
      <div class="status-viewer-who">
        <span class="status-viewer-name" id="statusViewerName"></span>
        <span class="status-viewer-time" id="statusViewerTime"></span>
      </div>
      <button type="button" class="status-viewer-icon-btn" id="statusViewerDeleteBtn" style="display:none;" title="মুছে ফেলুন"><i class="fa-solid fa-trash"></i></button>
      <button type="button" class="status-viewer-icon-btn" id="statusViewerCloseBtn" title="বন্ধ করুন"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="status-viewer-body" id="statusViewerBody"></div>
    <div class="status-viewer-zone status-viewer-zone-left" id="statusViewerPrevZone"></div>
    <div class="status-viewer-zone status-viewer-zone-right" id="statusViewerNextZone"></div>
    <div class="status-viewer-footer" id="statusViewerFooter"></div>
  `;
  document.body.appendChild(el);

  document.getElementById('statusViewerCloseBtn').onclick = closeStatusViewer;
  document.getElementById('statusViewerDeleteBtn').onclick = deleteCurrentStatus;
  document.getElementById('statusViewerPrevZone').onclick = () => statusStepSlide(-1);
  document.getElementById('statusViewerNextZone').onclick = () => statusStepSlide(1);

  ['statusViewerPrevZone', 'statusViewerNextZone'].forEach(id => {
    const zone = document.getElementById(id);
    zone.addEventListener('pointerdown', () => {
      statusHoldTimer = setTimeout(() => pauseStatusSlide(), 180);
    });
    const release = () => { clearTimeout(statusHoldTimer); if(statusIsPaused) resumeStatusSlide(); };
    zone.addEventListener('pointerup', release);
    zone.addEventListener('pointerleave', release);
  });

  return el;
}

function openStatusViewer(groupIdx){
  ensureStatusViewer();
  statusViewerIdx = groupIdx;
  const group = statusGroups[groupIdx];
  if(!group) return;
  const seen = getSeenStatusIds();
  const firstUnseen = group.items.findIndex(s => !seen.includes(s.id));
  statusSlideIdx = firstUnseen !== -1 ? firstUnseen : 0;
  document.getElementById('statusViewer').style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderStatusSlide();
}

function closeStatusViewer(){
  clearStatusTimer();
  if(statusAudioEl){ statusAudioEl.pause(); statusAudioEl = null; }
  const viewersPanel = document.getElementById('statusViewersPanel');
  if(viewersPanel) viewersPanel.style.display = 'none';
  const el = document.getElementById('statusViewer');
  if(el) el.style.display = 'none';
  document.body.style.overflow = '';
  statusViewerIdx = -1;
  groupStatuses();
  renderStatusBar();
}

function clearStatusTimer(){
  if(statusSlideTimer){ clearTimeout(statusSlideTimer); statusSlideTimer = null; }
  statusIsPaused = false;
}

function renderStatusSlide(){
  const group = statusGroups[statusViewerIdx];
  if(!group){ closeStatusViewer(); return; }
  if(statusSlideIdx < 0) statusSlideIdx = 0;
  if(statusSlideIdx >= group.items.length){ statusStepGroup(1); return; }
  const item = group.items[statusSlideIdx];

  const viewersPanel = document.getElementById('statusViewersPanel');
  if(viewersPanel) viewersPanel.style.display = 'none';
  clearStatusTimer();
  if(statusAudioEl){ statusAudioEl.pause(); statusAudioEl = null; }

  // Progress bar segments
  const progWrap = document.getElementById('statusViewerProgress');
  progWrap.innerHTML = group.items.map((_, i) => `<span class="status-progress-seg"><span class="status-progress-fill${i < statusSlideIdx ? ' full' : ''}" id="statusProgFill${i}"></span></span>`).join('');

  // Header
  document.getElementById('statusViewerAvatar').innerHTML = statusAvatarHtml(group).replace('status-ring-avatar', 'status-ring-avatar status-viewer-avatar-inner');
  const isMine = state.user && state.user.uid === item.uid;
  document.getElementById('statusViewerName').textContent = isMine ? 'আপনি' : (group.name || 'ব্যবহারকারী');
  document.getElementById('statusViewerTime').textContent = timeAgoBn(item.createdAt || Date.now());
  document.getElementById('statusViewerDeleteBtn').style.display = isMine ? 'flex' : 'none';

  // Body
  const body = document.getElementById('statusViewerBody');
  if(item.type === 'ayah'){
    body.innerHTML = `
      <div class="status-slide status-slide-ayah">
        <div class="status-ayah-badge"><i class="fa-solid fa-book-quran"></i> সূরা ${escapeHtml(item.surahName || '')} · আয়াত ${toBn(item.ayah)}</div>
        <div class="status-slide-arabic" dir="rtl">${escapeHtml(item.arabic || '')}</div>
        <div class="status-slide-translation">${escapeHtml(item.translation || '')}</div>
        <div class="status-ayah-reciter"><i class="fa-solid fa-volume-high"></i> ${escapeHtml(item.reciterName || '')}</div>
      </div>`;
    statusAudioEl = new Audio(item.audioUrl);
    statusAudioEl.play().catch(() => {});
    statusAudioEl.addEventListener('timeupdate', () => {
      if(!statusAudioEl || !statusAudioEl.duration) return;
      const fill = document.getElementById('statusProgFill' + statusSlideIdx);
      if(fill) fill.style.width = Math.min(100, (statusAudioEl.currentTime / statusAudioEl.duration) * 100) + '%';
    });
    statusAudioEl.addEventListener('ended', () => statusStepSlide(1));
    // Fallback in case the audio never loads (offline, bad link, etc.)
    statusSlideTimer = setTimeout(() => statusStepSlide(1), 25000);
  } else {
    body.innerHTML = `
      <div class="status-slide status-slide-text" style="background:${item.bg || STATUS_BG_PRESETS[0]}">
        <p>${escapeHtml(item.text || '')}</p>
      </div>`;
    const fill = document.getElementById('statusProgFill' + statusSlideIdx);
    if(fill){
      fill.style.transition = `width ${STATUS_TEXT_MS}ms linear`;
      requestAnimationFrame(() => { fill.style.width = '100%'; });
    }
    statusSlideTimer = setTimeout(() => statusStepSlide(1), STATUS_TEXT_MS);
  }

  renderStatusFooter(item, isMine);
  markStatusViewed(item);
}

// ================= Footer: view count (owner) + love react (everyone else) =================
function statusViewCount(item){
  return item.viewers ? Object.keys(item.viewers).length : 0;
}
function statusReactionCount(item){
  return item.reactions ? Object.keys(item.reactions).length : 0;
}

function renderStatusFooter(item, isMine){
  const footer = document.getElementById('statusViewerFooter');
  if(!footer) return;
  const viewCount = statusViewCount(item);
  const reactionCount = statusReactionCount(item);
  const iReacted = !!(state.user && item.reactions && item.reactions[state.user.uid]);

  const leftHtml = isMine
    ? `<button type="button" class="status-viewcount-btn" id="statusViewCountBtn" title="কে কে দেখেছে"><i class="fa-solid fa-eye"></i><span>${toBn(viewCount)}</span></button>`
    : '';

  let rightHtml = '';
  if(!isMine){
    rightHtml = `
      <button type="button" class="status-love-btn${iReacted ? ' active' : ''}" id="statusLoveBtn" title="লাভ রিয়েক্ট">
        <i class="fa-${iReacted ? 'solid' : 'regular'} fa-heart"></i>
      </button>`;
  } else if(reactionCount){
    rightHtml = `<span class="status-love-count-badge"><i class="fa-solid fa-heart"></i> ${toBn(reactionCount)}</span>`;
  }

  footer.innerHTML = `
    <div class="status-viewer-footer-left">${leftHtml}</div>
    <div class="status-viewer-footer-right">${rightHtml}</div>`;

  const vBtn = document.getElementById('statusViewCountBtn');
  if(vBtn) vBtn.onclick = (e) => { e.stopPropagation(); openStatusViewersList(item); };
  const lBtn = document.getElementById('statusLoveBtn');
  if(lBtn) lBtn.onclick = (e) => { e.stopPropagation(); toggleStatusLove(item, isMine); };
}

// ================= "কে কে দেখেছে" viewer list sheet =================
function openStatusViewersList(item){
  pauseStatusSlide();
  const viewer = document.getElementById('statusViewer');
  let panel = document.getElementById('statusViewersPanel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'statusViewersPanel';
    panel.className = 'status-viewers-panel';
    viewer.appendChild(panel);
    panel.addEventListener('click', (e) => { if(e.target === panel) closeStatusViewersList(); });
  }
  const viewers = Object.entries(item.viewers || {})
    .map(([uid, v]) => ({ uid, ...v }))
    .sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0));
  const reactions = item.reactions || {};

  panel.innerHTML = `
    <div class="status-viewers-sheet">
      <div class="status-viewers-handle"></div>
      <div class="status-viewers-title">
        <span><i class="fa-solid fa-eye"></i> ${toBn(viewers.length)} জন দেখেছেন</span>
        <button type="button" class="status-viewers-close" id="statusViewersCloseBtn">✕</button>
      </div>
      <div class="status-viewers-list">
        ${viewers.length ? viewers.map(v => `
          <div class="status-viewer-row">
            ${statusAvatarHtml({ avatarColor: v.avatarColor, avatarIcon: v.avatarIcon, name: v.name }).replace('status-ring-avatar', 'status-ring-avatar status-viewer-row-avatar')}
            <span class="status-viewer-row-name">${escapeHtml(v.name || 'ব্যবহারকারী')}</span>
            ${reactions[v.uid] ? '<i class="fa-solid fa-heart status-viewer-row-heart"></i>' : ''}
          </div>`).join('') : '<div class="status-viewers-empty">এখনো কেউ দেখেননি</div>'}
      </div>
    </div>`;
  panel.style.display = 'flex';
  document.getElementById('statusViewersCloseBtn').onclick = closeStatusViewersList;
}
function closeStatusViewersList(){
  const panel = document.getElementById('statusViewersPanel');
  if(panel) panel.style.display = 'none';
  if(statusIsPaused) resumeStatusSlide();
}

// ================= Love react (toggle) =================
async function toggleStatusLove(item, isMine){
  if(isMine) return;
  if(!state.user){
    showToast('রিয়েক্ট দিতে প্রথমে সাইন ইন করুন');
    if(typeof openAuthFlow === 'function') openAuthFlow('login');
    return;
  }
  const uid = state.user.uid;
  if(!item.reactions) item.reactions = {};
  const alreadyReacted = !!item.reactions[uid];

  // optimistic local update — instant heart response, no slide/timer restart
  if(alreadyReacted){ delete item.reactions[uid]; }
  else { item.reactions[uid] = { name: state.user.name || 'ব্যবহারকারী', avatarColor: state.user.avatarColor || '', avatarIcon: state.user.avatarIcon || '', at: Date.now() }; }
  renderStatusFooter(item, isMine);
  const lBtn = document.getElementById('statusLoveBtn');
  if(lBtn && !alreadyReacted){ lBtn.classList.add('pop'); setTimeout(() => lBtn.classList.remove('pop'), 380); }

  try{
    if(alreadyReacted){
      await fbDb.collection('statuses').doc(item.id).update({ ['reactions.' + uid]: firebase.firestore.FieldValue.delete() });
    } else {
      await fbDb.collection('statuses').doc(item.id).update({
        ['reactions.' + uid]: { name: state.user.name || 'ব্যবহারকারী', avatarColor: state.user.avatarColor || '', avatarIcon: state.user.avatarIcon || '', at: Date.now() }
      });
    }
  }catch(e){
    // revert on failure
    if(alreadyReacted){ item.reactions[uid] = { name: state.user.name || 'ব্যবহারকারী', avatarColor: state.user.avatarColor || '', avatarIcon: state.user.avatarIcon || '', at: Date.now() }; }
    else { delete item.reactions[uid]; }
    renderStatusFooter(item, isMine);
    showToast('রিয়েক্ট করা যায়নি, আবার চেষ্টা করুন');
  }
}

function pauseStatusSlide(){
  statusIsPaused = true;
  clearTimeout(statusSlideTimer);
  if(statusAudioEl) statusAudioEl.pause();
  const fill = document.getElementById('statusProgFill' + statusSlideIdx);
  if(fill) fill.style.animationPlayState = 'paused';
}
function resumeStatusSlide(){
  statusIsPaused = false;
  if(statusAudioEl){
    statusAudioEl.play().catch(() => {});
  } else {
    const group = statusGroups[statusViewerIdx];
    const item = group && group.items[statusSlideIdx];
    if(item){
      const fill = document.getElementById('statusProgFill' + statusSlideIdx);
      if(fill){
        const donePct = parseFloat(fill.style.width) || 0;
        const remainMs = STATUS_TEXT_MS * (1 - donePct / 100);
        fill.style.transition = `width ${remainMs}ms linear`;
        requestAnimationFrame(() => { fill.style.width = '100%'; });
      }
      statusSlideTimer = setTimeout(() => statusStepSlide(1), Math.max(200, STATUS_TEXT_MS - (STATUS_TEXT_MS * ((parseFloat((fill && fill.style.width) || '0')) / 100))));
    }
  }
}

function statusStepSlide(dir){
  const group = statusGroups[statusViewerIdx];
  if(!group) return;
  const next = statusSlideIdx + dir;
  if(next < 0){
    statusStepGroup(-1);
  } else if(next >= group.items.length){
    statusStepGroup(1);
  } else {
    statusSlideIdx = next;
    renderStatusSlide();
  }
}

function statusStepGroup(dir){
  const nextGroupIdx = statusViewerIdx + dir;
  if(nextGroupIdx < 0 || nextGroupIdx >= statusGroups.length){
    closeStatusViewer();
    return;
  }
  statusViewerIdx = nextGroupIdx;
  statusSlideIdx = dir > 0 ? 0 : (statusGroups[nextGroupIdx].items.length - 1);
  renderStatusSlide();
}

async function markStatusViewed(item){
  markStatusSeenLocally(item.id);
  if(!state.user || state.user.uid === item.uid) return;
  if(item.viewers && item.viewers[state.user.uid]) return;
  const uid = state.user.uid;
  const entry = { name: state.user.name || 'ব্যবহারকারী', avatarColor: state.user.avatarColor || '', avatarIcon: state.user.avatarIcon || '', viewedAt: Date.now() };
  // optimistic — so re-opening the owner's own footer/viewer-list this session is instant
  if(!item.viewers) item.viewers = {};
  item.viewers[uid] = entry;
  try{
    await fbDb.collection('statuses').doc(item.id).update({ ['viewers.' + uid]: entry });
  }catch(e){ /* সাইলেন্ট — ভিউ-কাউন্ট শুধুই সহায়ক তথ্য */ }
}

async function deleteCurrentStatus(){
  const group = statusGroups[statusViewerIdx];
  if(!group) return;
  const item = group.items[statusSlideIdx];
  if(!item || !state.user || item.uid !== state.user.uid) return;
  if(!confirm('এই স্ট্যাটাসটি মুছে ফেলতে চান?')) return;
  try{
    await fbDb.collection('statuses').doc(item.id).delete();
    showToast('স্ট্যাটাস মুছে ফেলা হয়েছে');
    group.items.splice(statusSlideIdx, 1);
    if(!group.items.length){ closeStatusViewer(); return; }
    if(statusSlideIdx >= group.items.length) statusSlideIdx = group.items.length - 1;
    renderStatusSlide();
  }catch(e){ showToast('মুছে ফেলা যায়নি, আবার চেষ্টা করুন'); }
}
