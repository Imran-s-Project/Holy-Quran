// ---------- Firebase Auth + Firestore sync ----------
// Everything needed to connect this app's account system to Firebase lives
// in this one file (plus js/firebase-config.js, where the project keys go).
// Nothing here needs Firebase Hosting — it works fine served from anywhere,
// as long as the config in js/firebase-config.js is filled in and the
// domain is added under Authentication → Settings → Authorized domains.

let fbApp = null, fbAuth = null, fbDb = null;
let firebaseReady = false;
let authUnsub = null;
let cloudSyncTimer = null;
let cloudSyncInFlight = false;
let suppressNextSync = false; // true while we're applying a just-downloaded cloud snapshot

function isFirebaseConfigured(){
  return typeof FIREBASE_CONFIG !== 'undefined'
    && FIREBASE_CONFIG.apiKey
    && !/PASTE_YOUR/.test(FIREBASE_CONFIG.apiKey);
}

function initAuth(){
  if(typeof firebase === 'undefined' || !isFirebaseConfigured()) return; // SDK not loaded / not configured yet
  try{
    fbApp = firebase.initializeApp(FIREBASE_CONFIG);
    fbAuth = firebase.auth();
    fbDb = firebase.firestore();
    firebaseReady = true;
  }catch(e){ console.warn('Firebase init failed:', e); return; }

  authUnsub = fbAuth.onAuthStateChanged(async (fbUser) => {
    if(fbUser){
      await onSignedIn(fbUser);
    } else {
      state.user = null;
      refreshCurrentView();
    }
  });
}

function refreshCurrentView(){
  const statsView = document.getElementById('view-stats');
  if(statsView && statsView.classList.contains('active') && typeof renderStatsView === 'function') renderStatsView();
}

// ---------- Sign-in / sign-up / forgot-password overlay ----------
// A single full-screen overlay with four "screens" swapped in and out,
// mirroring the reference design: choice → (signup | login) → forgot.
function ensureAuthOverlay(){
  let overlay = document.getElementById('authOverlay');
  if(overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'authOverlay';
  overlay.className = 'auth-overlay';
  overlay.innerHTML = `
    <div class="auth-screen" id="authScreenChoice">
      <div class="auth-topbar">
        <button class="auth-back" data-close="1"><i class="fa-solid fa-arrow-left"></i></button>
        <span>সাইন আপ / লগইন করুন</span>
      </div>
      <div class="auth-body">
        <div class="auth-scene auth-scene-choice">
          <div class="auth-icon-box"><i class="fa-solid fa-book-open"></i></div>
          <div class="auth-medal"><i class="fa-solid fa-star"></i></div>
          <i class="fa-solid fa-sparkles auth-spark s1"></i>
          <i class="fa-solid fa-sparkles auth-spark s2"></i>
          <span class="auth-dot" style="top:8px;left:6px;"></span>
        </div>
        <h2 class="auth-title">অ্যাকাউন্ট তৈরি করুন</h2>
        <p class="auth-sub">আপনার অর্জন ও পড়ার অগ্রগতি সুরক্ষিত রাখুন। আপনার সম্পূর্ণ পরিসংখ্যান এক জায়গায় দেখুন।</p>
        <button class="auth-cta-btn" id="authGoSignup">ইমেইল দিয়ে সাইন আপ করুন</button>
        <button class="auth-google-btn" id="authGoogleFromChoice"><i class="fa-brands fa-google"></i> গুগল দিয়ে সাইন ইন করুন</button>
        <div class="auth-switch">অলরেডি অ্যাকাউন্ট আছে? <a href="javascript:void(0)" id="authGoLogin">লগইন করুন</a></div>
      </div>
    </div>

    <div class="auth-screen" id="authScreenSignup" style="display:none;">
      <div class="auth-topbar">
        <button class="auth-back" data-back="choice"><i class="fa-solid fa-arrow-left"></i></button>
        <span>সাইন আপ</span>
      </div>
      <div class="auth-body">
        <div class="auth-scene auth-scene-signup">
          <div class="auth-card-tile"></div>
          <div class="auth-plus-mock">
            <div class="auth-plus-circle"><i class="fa-solid fa-plus"></i></div>
            <div class="auth-plus-row"><span class="dot"></span><span class="bar"></span></div>
            <div class="auth-plus-row"><span class="dot"></span><span class="bar short"></span></div>
          </div>
        </div>
        <h2 class="auth-title">কুরআন বাংলা অ্যাকাউন্ট তৈরি করুন</h2>
        <p class="auth-sub">আমাদের যেকোনো অ্যাপে এই অ্যাকাউন্ট দিয়ে লগইন এবং সিঙ্ক করুন।</p>
        <input class="auth-field" id="suName" type="text" placeholder="নাম">
        <input class="auth-field" id="suPosition" type="text" placeholder="পদবি (ঐচ্ছিক)">
        <input class="auth-field" id="suEmail" type="email" placeholder="ইমেইল">
        <input class="auth-field" id="suPassword" type="password" placeholder="পাসওয়ার্ড">
        <input class="auth-field" id="suPasswordConfirm" type="password" placeholder="পাসওয়ার্ড নিশ্চিত করুন">
        <div class="auth-error" id="suError"></div>
        <button class="auth-cta-btn has-icon" id="suSubmit"><span>সাইন আপ</span><span class="cta-icon-dot"><i class="fa-solid fa-plus"></i></span></button>
      </div>
    </div>

    <div class="auth-screen" id="authScreenLogin" style="display:none;">
      <div class="auth-topbar">
        <button class="auth-back" data-back="choice"><i class="fa-solid fa-arrow-left"></i></button>
        <span>লগইন করুন</span>
      </div>
      <div class="auth-body">
        <div class="auth-scene auth-scene-login">
          <div class="auth-icon-box"><i class="fa-solid fa-right-to-bracket"></i></div>
          <span class="auth-leaf l1"></span>
          <span class="auth-leaf l2"></span>
          <i class="fa-solid fa-sparkles auth-spark s3"></i>
        </div>
        <h2 class="auth-title">বিদ্যমান অ্যাকাউন্টে লগইন করুন</h2>
        <input class="auth-field" id="liEmail" type="email" placeholder="ইমেইল">
        <input class="auth-field" id="liPassword" type="password" placeholder="পাসওয়ার্ড">
        <div class="auth-error" id="liError"></div>
        <button class="auth-cta-btn" id="liSubmit">লগইন করুন</button>
        <div class="auth-switch"><a href="javascript:void(0)" id="liForgot">পাসওয়ার্ড ভুলে গেছেন?</a></div>
        <button class="auth-google-btn" id="authGoogleFromLogin"><i class="fa-brands fa-google"></i> গুগল দিয়ে সাইন ইন করুন</button>
      </div>
    </div>

    <div class="auth-screen" id="authScreenForgot" style="display:none;">
      <div class="auth-topbar">
        <button class="auth-back" data-back="login"><i class="fa-solid fa-arrow-left"></i></button>
        <span>পাসওয়ার্ড পুনরুদ্ধার করুন</span>
      </div>
      <div class="auth-body">
        <h2 class="auth-title">পুনরুদ্ধার করতে নিবন্ধিত ইমেইলটি প্রবেশ করুন</h2>
        <p class="auth-sub">চিন্তা করবেন না, আমরা আপনার ইমেইলে একটি পাসওয়ার্ড পুনরুদ্ধারের লিঙ্ক পাঠাবো।</p>
        <input class="auth-field" id="fgEmail" type="email" placeholder="ইমেইল">
        <div class="auth-error" id="fgError"></div>
        <button class="auth-cta-btn" id="fgSubmit">পুনরুদ্ধারের লিঙ্ক ইমেইল করুন</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelectorAll('[data-close]').forEach(b => b.onclick = closeAuthFlow);
  overlay.querySelectorAll('[data-back]').forEach(b => b.onclick = () => showAuthScreen(b.getAttribute('data-back')));

  document.getElementById('authGoSignup').onclick = () => showAuthScreen('signup');
  document.getElementById('authGoLogin').onclick = () => showAuthScreen('login');
  document.getElementById('liForgot').onclick = () => showAuthScreen('forgot');
  document.getElementById('authGoogleFromChoice').onclick = handleGoogleSignIn;
  document.getElementById('authGoogleFromLogin').onclick = handleGoogleSignIn;
  document.getElementById('suSubmit').onclick = handleEmailSignup;
  document.getElementById('liSubmit').onclick = handleEmailLogin;
  document.getElementById('fgSubmit').onclick = handlePasswordReset;

  return overlay;
}

function openAuthFlow(screen){
  if(!firebaseReady){
    showToast(typeof isFirebaseConfigured === 'function' && !isFirebaseConfigured()
      ? 'এখনো এই ফিউচারটি উপলব্ধ করা হয়নি'
      : 'সাইন ইন এখন লোড করা যায়নি, একটু পর আবার চেষ্টা করুন');
    return;
  }
  ensureAuthOverlay();
  showAuthScreen(screen || 'choice');
  document.getElementById('authOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeAuthFlow(){
  const overlay = document.getElementById('authOverlay');
  if(overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}
function showAuthScreen(name){
  ['choice','signup','login','forgot'].forEach(n => {
    const el = document.getElementById('authScreen' + n.charAt(0).toUpperCase() + n.slice(1));
    if(el) el.style.display = (n === name) ? 'block' : 'none';
  });
}

// ---------- Actions ----------
async function handleGoogleSignIn(){
  const provider = new firebase.auth.GoogleAuthProvider();
  try{
    await fbAuth.signInWithPopup(provider);
    closeAuthFlow();
  }catch(e){
    // Popups are blocked inside some installed-PWA / in-app browser contexts —
    // fall back to a full-page redirect, which always works.
    if(e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment' || e.code === 'auth/cancelled-popup-request')){
      try{ await fbAuth.signInWithRedirect(provider); }catch(e2){ showToast('গুগল সাইন-ইন ব্যর্থ হয়েছে'); }
    } else if(e && e.code !== 'auth/popup-closed-by-user'){
      showToast('গুগল সাইন-ইন ব্যর্থ হয়েছে');
    }
  }
}

async function handleEmailSignup(){
  const name = document.getElementById('suName').value.trim();
  const position = document.getElementById('suPosition').value.trim();
  const email = document.getElementById('suEmail').value.trim();
  const pass = document.getElementById('suPassword').value;
  const pass2 = document.getElementById('suPasswordConfirm').value;
  const errBox = document.getElementById('suError');
  errBox.textContent = '';

  if(!name || !email || !pass){ errBox.textContent = 'সব ঘর পূরণ করুন।'; return; }
  if(pass.length < 6){ errBox.textContent = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'; return; }
  if(pass !== pass2){ errBox.textContent = 'পাসওয়ার্ড দুটি মিলছে না।'; return; }

  const btn = document.getElementById('suSubmit');
  const btnOriginal = btn.innerHTML;
  btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...';
  try{
    const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await fbDb.collection('users').doc(cred.user.uid).set({
      name, position, email, createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    closeAuthFlow();
  }catch(e){
    errBox.textContent = authErrorMessageBn(e);
  }finally{
    btn.disabled = false; btn.innerHTML = btnOriginal;
  }
}

async function handleEmailLogin(){
  const email = document.getElementById('liEmail').value.trim();
  const pass = document.getElementById('liPassword').value;
  const errBox = document.getElementById('liError');
  errBox.textContent = '';
  if(!email || !pass){ errBox.textContent = 'ইমেইল ও পাসওয়ার্ড দিন।'; return; }

  const btn = document.getElementById('liSubmit');
  btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...';
  try{
    await fbAuth.signInWithEmailAndPassword(email, pass);
    closeAuthFlow();
  }catch(e){
    errBox.textContent = authErrorMessageBn(e);
  }finally{
    btn.disabled = false; btn.textContent = 'লগইন করুন';
  }
}

async function handlePasswordReset(){
  const email = document.getElementById('fgEmail').value.trim();
  const errBox = document.getElementById('fgError');
  errBox.textContent = '';
  if(!email){ errBox.textContent = 'ইমেইল দিন।'; return; }
  const btn = document.getElementById('fgSubmit');
  btn.disabled = true; btn.textContent = 'পাঠানো হচ্ছে...';
  try{
    await fbAuth.sendPasswordResetEmail(email);
    showToast('পুনরুদ্ধারের লিঙ্ক ইমেইলে পাঠানো হয়েছে');
    closeAuthFlow();
  }catch(e){
    errBox.textContent = authErrorMessageBn(e);
  }finally{
    btn.disabled = false; btn.textContent = 'পুনরুদ্ধারের লিঙ্ক ইমেইল করুন';
  }
}

function authErrorMessageBn(e){
  const code = e && e.code;
  const map = {
    'auth/email-already-in-use': 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।',
    'auth/invalid-email': 'সঠিক ইমেইল দিন।',
    'auth/weak-password': 'পাসওয়ার্ড খুবই দুর্বল।',
    'auth/user-not-found': 'এই ইমেইলে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
    'auth/wrong-password': 'পাসওয়ার্ড সঠিক নয়।',
    'auth/invalid-credential': 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
    'auth/too-many-requests': 'অনেকবার চেষ্টা করা হয়েছে, একটু পর আবার চেষ্টা করুন।',
    'auth/network-request-failed': 'ইন্টারনেট সংযোগ পরীক্ষা করুন।'
  };
  return map[code] || 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।';
}

function confirmLogout(){
  const old = document.getElementById('logoutConfirmModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'logoutConfirmModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>লগ আউট করবেন?</h3><button class="app-modal-close" id="logoutClose">✕</button></div>
      <div class="app-modal-body">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:14px;">আপনার এই ডিভাইসের ডেটা থাকবে, তবে ক্লাউড সিঙ্ক বন্ধ হয়ে যাবে যতক্ষণ না আবার লগইন করেন।</p>
        <div class="input-box-actions">
          <button class="tw-cancel-btn" id="logoutCancel">বাতিল</button>
          <button class="tw-save-btn" id="logoutYes">লগ আউট করুন</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('logoutClose').onclick = remove;
  document.getElementById('logoutCancel').onclick = remove;
  document.getElementById('logoutYes').onclick = async () => {
    remove();
    try{ await fbAuth.signOut(); }catch(e){}
    showToast('লগ আউট করা হয়েছে');
  };
}

// ---------- Firestore sync ----------
// On sign-in: pull the cloud copy (if any), merge it with whatever is
// already on this device, save the merged result locally, then push it
// back up — so both directions end up consistent.
async function onSignedIn(fbUser){
  state.user = {
    uid: fbUser.uid,
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'ব্যবহারকারী'),
    email: fbUser.email || '',
    position: '',        // পদবি — pulled from Firestore below, editable via the profile modal
    avatarColor: '',     // custom avatar color, editable via the profile modal
    avatarIcon: '',       // preset picture-avatar, editable via the profile modal (empty = use initials)
    phone: '',           // ফোন নম্বর — pulled from Firestore below, editable via the profile modal
    district: '',        // ঠিকানা/এলাকা — pulled from Firestore below, editable via the profile modal
    birthDate: '',        // জন্ম তারিখ — pulled from Firestore below, editable via the profile modal
    bio: '',              // সংক্ষিপ্ত পরিচিতি — pulled from Firestore below, editable via the profile modal
    favoriteQari: '',     // প্রিয় ক্বারী — pulled from Firestore below, editable via the profile modal
    favoriteSurah: '',    // প্রিয় সূরা — pulled from Firestore below, editable via the profile modal
    joinedAt: (fbUser.metadata && fbUser.metadata.creationTime) || null,
    providerIds: (fbUser.providerData || []).map(p => p.providerId),
    provider: (fbUser.providerData && fbUser.providerData[0] && fbUser.providerData[0].providerId) || 'password'
  };
  refreshCurrentView();

  try{
    const doc = await fbDb.collection('users').doc(fbUser.uid).get();
    if(doc.exists){
      const cloud = doc.data();
      if(cloud.name && !fbUser.displayName){ state.user.name = cloud.name; }
      if(cloud.position){ state.user.position = cloud.position; }
      if(cloud.avatarColor){ state.user.avatarColor = cloud.avatarColor; }
      if(cloud.avatarIcon){ state.user.avatarIcon = cloud.avatarIcon; }
      if(cloud.phone){ state.user.phone = cloud.phone; }
      if(cloud.district){ state.user.district = cloud.district; }
      if(cloud.birthDate){ state.user.birthDate = cloud.birthDate; }
      if(cloud.bio){ state.user.bio = cloud.bio; }
      if(cloud.favoriteQari){ state.user.favoriteQari = cloud.favoriteQari; }
      if(cloud.favoriteSurah){ state.user.favoriteSurah = cloud.favoriteSurah; }
      mergeCloudIntoLocal(cloud.progress || {});
    }
  }catch(e){ console.warn('Cloud fetch failed:', e); }

  refreshCurrentView();
  queueCloudSync(true); // push the merged result back up immediately
}

// Combines a downloaded Firestore `progress` object into the local `state` +
// localStorage. IMPORTANT: the cloud document only ever contains aggregate
// progress numbers (streaks, counts, daily reading seconds) — never which
// surahs/ayahs were read, bookmarks, notes, or reading history, so there is
// nothing "content-shaped" here to merge, only numbers to take the max of.
function mergeCloudIntoLocal(cloud){
  if(!cloud || typeof cloud !== 'object') return;
  suppressNextSync = true;

  // Daily reading time (date -> seconds). Dates alone reveal nothing about
  // which surah was read, so this is safe to merge by date.
  if(cloud.activity && typeof cloud.activity === 'object'){
    const local = loadActivity();
    const merged = { ...cloud.activity };
    Object.keys(local).forEach(k => { merged[k] = Math.max(merged[k] || 0, local[k] || 0); });
    saveActivity(merged);
  }

  if(typeof cloud.searchCount === 'number'){
    state.searchCount = Math.max(state.searchCount || 0, cloud.searchCount);
    try{ IDBKV.set(LS_KEYS.searchCount, String(state.searchCount)); }catch(e){}
  }
  if(typeof cloud.bestStreak === 'number'){
    state.bestStreak = Math.max(state.bestStreak || 0, cloud.bestStreak);
    try{ IDBKV.set(LS_KEYS.bestStreak, String(state.bestStreak)); }catch(e){}
  }
  // Aggregate counts only — the actual sets of which ayahs/surahs stay local
  // on each device and are never uploaded.
  if(typeof cloud.ayahsReadCount === 'number'){
    state.ayahsReadFloor = Math.max(state.ayahsReadFloor || 0, cloud.ayahsReadCount);
    try{ IDBKV.set(LS_KEYS.ayahsReadFloor, String(state.ayahsReadFloor)); }catch(e){}
  }
  if(typeof cloud.audioSurahsPlayedCount === 'number'){
    state.audioSurahsPlayedFloor = Math.max(state.audioSurahsPlayedFloor || 0, cloud.audioSurahsPlayedCount);
    try{ IDBKV.set(LS_KEYS.audioSurahsPlayedFloor, String(state.audioSurahsPlayedFloor)); }catch(e){}
  }
  // Taraweeh tracker: per-Ramadan-day rakat counts. Not surah-related, so
  // it's treated as progress and merged (cloud as base, local wins on conflict).
  if(cloud.taraweeh && typeof cloud.taraweeh === 'object'){
    state.taraweeh.days = { ...(cloud.taraweeh.days||{}), ...(state.taraweeh.days||{}) };
    state.taraweeh.goal = state.taraweeh.goal || cloud.taraweeh.goal || RAMADAN_DEFAULT_RAKAT_GOAL;
    saveTaraweeh();
  }

  // Extra badge-progress fields — same aggregate-only, no-content-identity rule.
  if(typeof cloud.topicsExploredCount === 'number'){
    state.topicsExploredFloor = Math.max(state.topicsExploredFloor || 0, cloud.topicsExploredCount);
    try{ IDBKV.set(LS_KEYS.topicsExploredFloor, String(state.topicsExploredFloor)); }catch(e){}
  }
  if(Array.isArray(cloud.themesTried)){
    state.themesTried = Array.from(new Set([...(state.themesTried||[]), ...cloud.themesTried]));
    try{ IDBKV.set(LS_KEYS.themesTried, JSON.stringify(state.themesTried)); }catch(e){}
  }
  if(Array.isArray(cloud.languagesUsed)){
    state.languagesUsed = Array.from(new Set([...(state.languagesUsed||[]), ...cloud.languagesUsed]));
    try{ IDBKV.set(LS_KEYS.languagesUsed, JSON.stringify(state.languagesUsed)); }catch(e){}
  }
  const boolFlags = ['qiblaUsed','tajweedModeUsed','hafezModeUsed','translationCompareUsed','ramadanModeUsed','prayerNotifyEverEnabled','nightOwlDone','earlyBirdDone'];
  boolFlags.forEach(flag => {
    if(cloud[flag] === true && !state[flag]){
      state[flag] = true;
      try{ IDBKV.set(LS_KEYS[flag], '1'); }catch(e){}
    }
  });
  if(typeof cloud.shareCount === 'number'){
    state.shareCount = Math.max(state.shareCount || 0, cloud.shareCount);
    try{ IDBKV.set(LS_KEYS.shareCount, String(state.shareCount)); }catch(e){}
  }

  suppressNextSync = false;
}

// Builds the plain-object snapshot that gets written to users/{uid}.progress
// in Firestore. Deliberately contains ONLY aggregate progress numbers —
// no bookmarks, notes, reading history, last-read position, or which
// surahs/ayahs were involved. Those remain in localStorage on-device only.
function buildSyncSnapshot(){
  return {
    activity: loadActivity(),                 // { "YYYY-MM-DD": secondsReadThatDay }
    searchCount: state.searchCount,
    bestStreak: state.bestStreak,
    ayahsReadCount: ayahsReadCount(),
    audioSurahsPlayedCount: (state.audioSurahsPlayed||[]).length,
    taraweeh: state.taraweeh,
    // Extra badge-progress fields, aggregate-only (see mergeCloudIntoLocal for the privacy rule)
    topicsExploredCount: (state.topicsExplored||[]).length,
    themesTried: state.themesTried || [],
    languagesUsed: state.languagesUsed || [],
    qiblaUsed: !!state.qiblaUsed,
    tajweedModeUsed: !!state.tajweedModeUsed,
    hafezModeUsed: !!state.hafezModeUsed,
    translationCompareUsed: !!state.translationCompareUsed,
    ramadanModeUsed: !!state.ramadanModeUsed,
    prayerNotifyEverEnabled: !!state.prayerNotifyEverEnabled,
    nightOwlDone: !!state.nightOwlDone,
    earlyBirdDone: !!state.earlyBirdDone,
    shareCount: state.shareCount || 0
  };
}

// Debounced push so rapid local changes (e.g. scrolling through several
// ayahs, ticking off several taraweeh days) collapse into one Firestore write.
function queueCloudSync(immediate){
  if(!firebaseReady || !state.user || suppressNextSync) return;
  clearTimeout(cloudSyncTimer);
  const run = async () => {
    if(cloudSyncInFlight) return;
    cloudSyncInFlight = true;
    try{
      await fbDb.collection('users').doc(state.user.uid).set({
        progress: buildSyncSnapshot(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }catch(e){ console.warn('Cloud sync failed:', e); }
    cloudSyncInFlight = false;
  };
  if(immediate) run();
  else cloudSyncTimer = setTimeout(run, 2500);
}

// ---------- Profile modal: view + manage everything about the account ----------
// Opened by tapping the account strip at the top of the পরিসংখ্যান (stats) view
// once a user is signed in. Lets them edit name/position/avatar color, see a
// quick lifetime-stats summary, change password, log out, or delete the account.
const PROFILE_AVATAR_COLORS = ['#2f6f61','#c9973a','#8a4b3b','#4a5a8a','#6b7d3d','#7a4a7a','#3d6b7d'];

// Preset picture-avatars — Font Awesome solid icons (already loaded via
// the cdnjs link in index.html) on a themed color disc. No image uploads
// or hosting needed, works fully offline like the rest of the app.
// user.avatarIcon stores which one is picked (empty string = use initials).
const PROFILE_AVATARS = [
  { icon:'moon',              color:'#2f6f61' },
  { icon:'mosque',            color:'#c9973a' },
  { icon:'book-quran',        color:'#4a5a8a' },
  { icon:'kaaba',             color:'#3d3d3d' },
  { icon:'star-and-crescent', color:'#8a4b3b' },
  { icon:'hands-praying',     color:'#6b7d3d' },
  { icon:'star',              color:'#7a4a7a' },
  { icon:'gem',               color:'#3d6b7d' },
  { icon:'leaf',              color:'#3f7d4a' },
  { icon:'seedling',          color:'#4a8f5c' },
  { icon:'dove',              color:'#5a7a9a' },
  { icon:'feather',           color:'#7a8a5a' },
  { icon:'sun',               color:'#c9862f' },
  { icon:'cloud',             color:'#6a8a9a' },
  { icon:'water',             color:'#2b6a8f' },
  { icon:'fire',              color:'#b5522f' },
  { icon:'mountain',          color:'#5a5a6a' },
  { icon:'compass',           color:'#3a6a7a' },
  { icon:'crown',             color:'#9a7a2f' },
  { icon:'heart',             color:'#b5566f' }
];

// True only for icon names that exist in PROFILE_AVATARS — guards against
// rendering an arbitrary/unexpected value that might end up on user.avatarIcon.
function isKnownAvatarIcon(icon){
  return PROFILE_AVATARS.some(a => a.icon === icon);
}

// Shared by the profile modal preview + the account strip on পরিসংখ্যান —
// returns the icon markup if the user picked one, otherwise the initial letter.
function avatarGlyph(user){
  if(user && user.avatarIcon && isKnownAvatarIcon(user.avatarIcon)){
    return `<i class="fa-solid fa-${user.avatarIcon}"></i>`;
  }
  const initial = ((user && (user.name || user.email)) || '?').trim().charAt(0).toUpperCase();
  return escapeHtml(initial);
}

function formatJoinDateBn(iso){
  if(!iso) return '';
  const d = new Date(iso);
  if(isNaN(d.getTime())) return '';
  const months = (typeof BN_MONTHS !== 'undefined') ? BN_MONTHS : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${toBn(d.getDate())} ${months[d.getMonth()]}, ${toBn(d.getFullYear())}`;
}

function openProfileModal(){
  const user = state.user;
  if(!user) return; // profile modal only makes sense for a signed-in user

  const old = document.getElementById('profileModal');
  if(old) old.remove();

  const avatarColor = user.avatarColor || PROFILE_AVATAR_COLORS[0];
  const avatarIcon = (user.avatarIcon && isKnownAvatarIcon(user.avatarIcon)) ? user.avatarIcon : '';
  const providerIds = user.providerIds || [user.provider || 'password'];
  const isPasswordUser = providerIds.includes('password');
  const isGoogleLinked = providerIds.includes('google.com');
  const activity = (typeof loadActivity === 'function') ? loadActivity() : {};
  const streak = (typeof computeStreak === 'function') ? computeStreak(activity) : 0;
  const badgeTotal = (typeof BADGES !== 'undefined') ? BADGES.length : 0;
  const badgeUnlocked = (typeof unlockedBadgesCount === 'function') ? unlockedBadgesCount() : 0;
  const ayahCount = (typeof ayahsReadCount === 'function') ? ayahsReadCount() : 0;

  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'profileModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box profile-modal-box">
      <div class="app-modal-head"><h3><i class="fa-solid fa-user"></i> প্রোফাইল</h3><button class="app-modal-close" id="profileClose">✕</button></div>
      <div class="app-modal-body">
        <div class="profile-avatar-row">
          <div class="profile-avatar-lg" id="profileAvatarPreview" style="background:${avatarColor}">${avatarGlyph(user)}</div>

          <button type="button" class="profile-avatar-toggle" id="avatarToggle" aria-expanded="false" aria-controls="avatarGridWrap">
            <span>অ্যাভাটার বেছে নিন</span>
            <i class="fa-solid fa-chevron-down profile-avatar-toggle-icon" id="avatarToggleIcon"></i>
          </button>
          <div class="profile-avatar-grid" id="avatarGridWrap">
            <button type="button" class="profile-avatar-tile none-tile${avatarIcon?'':' active'}" data-icon="" data-color="" aria-label="ইনিশিয়াল ব্যবহার করুন">Aa</button>
            ${PROFILE_AVATARS.map(a => `<button type="button" class="profile-avatar-tile${a.icon===avatarIcon?' active':''}" data-icon="${a.icon}" data-color="${a.color}" style="background:${a.color}" aria-label="avatar"><i class="fa-solid fa-${a.icon}"></i></button>`).join('')}
          </div>

          <div class="profile-field-label" style="margin-top:4px;">ইনিশিয়ালের রং</div>
          <div class="profile-color-swatches">
            ${PROFILE_AVATAR_COLORS.map(c => `<button type="button" class="profile-color-dot${c===avatarColor && !avatarIcon?' active':''}" data-color="${c}" style="background:${c}" aria-label="avatar color"></button>`).join('')}
          </div>
        </div>

        <label class="profile-field-label" for="profName">নাম</label>
        <input class="auth-field" id="profName" type="text" value="${escapeHtml(user.name||'')}" placeholder="নাম">

        <label class="profile-field-label" for="profPosition">পদবি (ঐচ্ছিক)</label>
        <input class="auth-field" id="profPosition" type="text" value="${escapeHtml(user.position||'')}" placeholder="যেমন: শিক্ষার্থী, ইমাম, ইত্যাদি">

        <label class="profile-field-label" for="profEmail">ইমেইল</label>
        <input class="auth-field" id="profEmail" type="text" value="${escapeHtml(user.email||'')}" disabled>

        <label class="profile-field-label" for="profPhone">ফোন নম্বর (ঐচ্ছিক)</label>
        <input class="auth-field" id="profPhone" type="tel" value="${escapeHtml(user.phone||'')}" placeholder="যেমন: ০১৭xxxxxxxx">

        <label class="profile-field-label" for="profDistrict">ঠিকানা/এলাকা (ঐচ্ছিক)</label>
        <input class="auth-field" id="profDistrict" type="text" value="${escapeHtml(user.district||'')}" placeholder="যেমন: ঢাকা">

        <label class="profile-field-label" for="profBirthDate">জন্ম তারিখ (ঐচ্ছিক)</label>
        <input class="auth-field" id="profBirthDate" type="date" value="${escapeHtml(user.birthDate||'')}">

        <label class="profile-field-label" for="profBio">সংক্ষিপ্ত পরিচিতি (ঐচ্ছিক)</label>
        <textarea class="auth-field" id="profBio" rows="3" placeholder="নিজের সম্পর্কে কিছু কথা">${escapeHtml(user.bio||'')}</textarea>

        <label class="profile-field-label" for="profQari">প্রিয় ক্বারী (ঐচ্ছিক)</label>
        <input class="auth-field" id="profQari" type="text" value="${escapeHtml(user.favoriteQari||'')}" placeholder="যেমন: মিশারি রাশিদ">

        <label class="profile-field-label" for="profSurah">প্রিয় সূরা (ঐচ্ছিক)</label>
        <input class="auth-field" id="profSurah" type="text" value="${escapeHtml(user.favoriteSurah||'')}" placeholder="যেমন: সূরা আর-রাহমান">

        ${user.joinedAt ? `<div class="profile-joined"><i class="fa-regular fa-calendar"></i> যোগদান করেছেন: ${formatJoinDateBn(user.joinedAt)}</div>` : ''}

        <div class="profile-error" id="profError"></div>
        <button class="auth-cta-btn" id="profSaveBtn">সংরক্ষণ করুন</button>

        <div class="profile-stats-grid">
          <div class="profile-stat-box">
            <div class="profile-stat-val">${toBn(badgeUnlocked)}/${toBn(badgeTotal)}</div>
            <div class="profile-stat-lbl">ব্যাজ</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-val">${toBn(Math.max(state.bestStreak||0, streak))}</div>
            <div class="profile-stat-lbl">সেরা স্ট্রিক</div>
          </div>
          <div class="profile-stat-box">
            <div class="profile-stat-val">${toBn(ayahCount)}</div>
            <div class="profile-stat-lbl">আয়াত পাঠ</div>
          </div>
        </div>

        <div class="profile-meta-box">
          <div class="profile-meta-row">
            <div class="profile-meta-text">
              <span class="profile-meta-label">ইউজার আইডি</span>
              <code class="profile-meta-value">${escapeHtml(user.uid)}</code>
            </div>
            <button type="button" class="profile-copy-btn" id="profUidCopy" aria-label="ইউজার আইডি কপি করুন"><i class="fa-regular fa-copy"></i></button>
          </div>
          <div class="profile-meta-row">
            <div class="profile-meta-text">
              <span class="profile-meta-label">সাইটটি চলছে এই ঠিকানা থেকে</span>
              <code class="profile-meta-value">${escapeHtml(window.location.host)}</code>
            </div>
            <button type="button" class="profile-copy-btn" id="profServerCopy" aria-label="ঠিকানা কপি করুন"><i class="fa-regular fa-copy"></i></button>
          </div>
        </div>

        <div class="profile-actions">
          ${isPasswordUser ? '<button class="settings-btn profile-action-btn" id="profChangePass"><i class="fa-solid fa-key"></i><span>পাসওয়ার্ড পরিবর্তন করুন</span></button>' : ''}
          ${isPasswordUser && !isGoogleLinked ? '<button class="settings-btn profile-action-btn" id="profLinkGoogle"><i class="fa-brands fa-google"></i><span>Google অ্যাকাউন্ট লিংক করুন</span></button>' : ''}
          ${isGoogleLinked && isPasswordUser ? '<button class="settings-btn profile-action-btn" id="profUnlinkGoogle"><i class="fa-brands fa-google"></i><span>Google আনলিংক করুন</span></button>' : ''}
          ${isGoogleLinked && !isPasswordUser ? '<div class="profile-linked-badge"><i class="fa-brands fa-google"></i><span>Google দিয়ে সাইন-ইন করা</span></div>' : ''}
          <button class="settings-btn profile-action-btn" id="profLogoutBtn"><i class="fa-solid fa-right-from-bracket"></i><span>লগ আউট করুন</span></button>
        </div>

        <div class="profile-danger-zone">
          <div class="profile-danger-zone-title"><i class="fa-solid fa-triangle-exclamation"></i> ডেঞ্জার জোন</div>
          <p class="profile-danger-zone-desc">এই অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হবে। এটি আর ফিরিয়ে আনা যাবে না।</p>
          <button class="settings-btn profile-action-btn profile-action-danger" id="profDeleteBtn"><i class="fa-solid fa-trash"></i><span>অ্যাকাউন্ট মুছে ফেলুন</span></button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  // Avatar picker starts collapsed — just the current pick + a toggle —
  // so the full 21-icon grid doesn't dump onto the screen at once. Tapping
  // the label row or the round preview itself opens/closes it.
  const avatarToggleBtn = document.getElementById('avatarToggle');
  const avatarGridWrap = document.getElementById('avatarGridWrap');
  const avatarPreviewEl = document.getElementById('profileAvatarPreview');
  const setAvatarGridOpen = (open) => {
    avatarGridWrap.classList.toggle('open', open);
    avatarToggleBtn.classList.toggle('open', open);
    avatarToggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  setAvatarGridOpen(false);
  avatarToggleBtn.onclick = () => setAvatarGridOpen(!avatarGridWrap.classList.contains('open'));
  if(avatarPreviewEl){
    avatarPreviewEl.style.cursor = 'pointer';
    avatarPreviewEl.onclick = () => setAvatarGridOpen(!avatarGridWrap.classList.contains('open'));
  }

  let pickedColor = avatarColor;
  let pickedIcon = avatarIcon;

  const updatePreview = () => {
    const preview = document.getElementById('profileAvatarPreview');
    if(!preview) return;
    preview.style.background = pickedColor;
    preview.innerHTML = pickedIcon
      ? `<i class="fa-solid fa-${pickedIcon}"></i>`
      : escapeHtml((user.name || user.email || '?').trim().charAt(0).toUpperCase());
  };

  wrap.querySelectorAll('.profile-color-dot').forEach(btn => {
    btn.onclick = () => {
      pickedColor = btn.getAttribute('data-color');
      pickedIcon = ''; // a plain color choice means "use initials"
      wrap.querySelectorAll('.profile-color-dot').forEach(b => b.classList.toggle('active', b === btn));
      wrap.querySelectorAll('.profile-avatar-tile').forEach(b => b.classList.toggle('active', b.classList.contains('none-tile')));
      updatePreview();
    };
  });

  wrap.querySelectorAll('.profile-avatar-tile').forEach(btn => {
    btn.onclick = () => {
      pickedIcon = btn.getAttribute('data-icon') || '';
      const color = btn.getAttribute('data-color');
      if(color) pickedColor = color; // "none" tile keeps whatever color was picked
      wrap.querySelectorAll('.profile-avatar-tile').forEach(b => b.classList.toggle('active', b === btn));
      if(pickedIcon){
        wrap.querySelectorAll('.profile-color-dot').forEach(b => b.classList.remove('active'));
      }
      updatePreview();
    };
  });

  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('profileClose').onclick = remove;

  document.getElementById('profSaveBtn').onclick = async () => {
    const name = document.getElementById('profName').value.trim();
    const position = document.getElementById('profPosition').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const district = document.getElementById('profDistrict').value.trim();
    const birthDate = document.getElementById('profBirthDate').value;
    const bio = document.getElementById('profBio').value.trim();
    const favoriteQari = document.getElementById('profQari').value.trim();
    const favoriteSurah = document.getElementById('profSurah').value.trim();
    const errBox = document.getElementById('profError');
    errBox.textContent = '';
    if(!name){ errBox.textContent = 'নাম দিন।'; return; }

    const btn = document.getElementById('profSaveBtn');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'সংরক্ষণ হচ্ছে...';
    try{
      await saveProfileChanges({ name, position, avatarColor: pickedColor, avatarIcon: pickedIcon, phone, district, birthDate, bio, favoriteQari, favoriteSurah });
      showToast('প্রোফাইল আপডেট হয়েছে');
      remove();
    }catch(e){
      errBox.textContent = 'কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন।';
    }finally{
      btn.disabled = false; btn.textContent = original;
    }
  };

  const changePassBtn = document.getElementById('profChangePass');
  if(changePassBtn) changePassBtn.onclick = () => { remove(); confirmPasswordChange(user); };

  const uidCopyBtn = document.getElementById('profUidCopy');
  if(uidCopyBtn) uidCopyBtn.onclick = () => copyProfileValue(user.uid, uidCopyBtn);

  const serverCopyBtn = document.getElementById('profServerCopy');
  if(serverCopyBtn) serverCopyBtn.onclick = () => copyProfileValue(window.location.host, serverCopyBtn);

  const linkGoogleBtn = document.getElementById('profLinkGoogle');
  if(linkGoogleBtn) linkGoogleBtn.onclick = () => {
    const span = linkGoogleBtn.querySelector('span');
    const original = span ? span.textContent : '';
    linkGoogleBtn.disabled = true;
    if(span) span.textContent = 'লিংক করা হচ্ছে...';
    linkGoogleAccount(linkGoogleBtn, () => { remove(); openProfileModal(); }).finally(() => {
      if(span && document.body.contains(linkGoogleBtn)) span.textContent = original;
    });
  };

  const unlinkGoogleBtn = document.getElementById('profUnlinkGoogle');
  if(unlinkGoogleBtn) unlinkGoogleBtn.onclick = () => { remove(); confirmUnlinkGoogle(); };

  document.getElementById('profLogoutBtn').onclick = () => { remove(); confirmLogout(); };
  document.getElementById('profDeleteBtn').onclick = () => { remove(); confirmDeleteAccount(); };
}

// Copies a value (user ID, server address, ...) to the clipboard with a
// toast confirmation. Falls back to the old execCommand trick on browsers/
// contexts where navigator.clipboard isn't available (e.g. non-HTTPS).
async function copyProfileValue(text, btn){
  try{
    await navigator.clipboard.writeText(text);
    showToast('কপি করা হয়েছে');
  }catch(e){
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('কপি করা হয়েছে');
    }catch(e2){
      showToast('কপি করা যায়নি');
    }
  }
}

// ---------- Google account linking ----------
// Lets an email/password user attach Google sign-in to their existing
// account (same uid, same Firestore data — nothing migrates). After this,
// either method logs into the same account. Only proceeds if the Google
// account's email actually matches the current account's email, so a user
// can't accidentally attach the wrong Google identity to their profile.
async function linkGoogleAccount(triggerBtn, onDone){
  const fbUser = fbAuth.currentUser;
  if(!fbUser){ if(triggerBtn) triggerBtn.disabled = false; return; }
  try{
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await fbUser.linkWithPopup(provider);
    const googleEntry = (result.user.providerData || []).find(p => p.providerId === 'google.com');
    const currentEmail = (fbUser.email || '').toLowerCase();
    if(googleEntry && googleEntry.email && currentEmail && googleEntry.email.toLowerCase() !== currentEmail){
      // Different email than the account's — undo the link, this would
      // otherwise silently attach an unrelated Google identity.
      await fbUser.unlink('google.com');
      showToast('এই Google অ্যাকাউন্টের ইমেইল আপনার প্রোফাইলের ইমেইলের সাথে মিলছে না');
      return;
    }
    if(state.user){ state.user.providerIds = (result.user.providerData || []).map(p => p.providerId); }
    showToast('Google অ্যাকাউন্ট লিংক করা হয়েছে');
    if(onDone) onDone();
  }catch(e){
    if(e && e.code === 'auth/credential-already-in-use'){
      showToast('এই Google অ্যাকাউন্ট ইতিমধ্যে অন্য একটি অ্যাকাউন্টের সাথে যুক্ত');
    } else if(e && e.code === 'auth/popup-closed-by-user'){
      // user backed out of the popup — nothing to say
    } else {
      showToast('লিংক করতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    }
  }finally{
    if(triggerBtn) triggerBtn.disabled = false;
  }
}

// Confirms before detaching Google sign-in. Only ever offered when the
// account also has a password set (see openProfileModal), so unlinking
// can never lock the user out of their own account.
function confirmUnlinkGoogle(){
  const old = document.getElementById('unlinkGoogleModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'unlinkGoogleModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>Google আনলিংক করবেন?</h3><button class="app-modal-close" id="unlinkGClose">✕</button></div>
      <div class="app-modal-body">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:14px;">এরপর থেকে শুধু ইমেইল ও পাসওয়ার্ড দিয়েই সাইন-ইন করতে হবে।</p>
        <div class="input-box-actions">
          <button class="tw-cancel-btn" id="unlinkGCancel">বাতিল</button>
          <button class="tw-save-btn" id="unlinkGYes">আনলিংক করুন</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('unlinkGClose').onclick = remove;
  document.getElementById('unlinkGCancel').onclick = remove;
  document.getElementById('unlinkGYes').onclick = async () => {
    remove();
    const fbUser = fbAuth.currentUser;
    if(!fbUser) return;
    try{
      await fbUser.unlink('google.com');
      if(state.user){ state.user.providerIds = (state.user.providerIds || []).filter(p => p !== 'google.com'); }
      showToast('Google আনলিংক করা হয়েছে');
      openProfileModal();
    }catch(e){
      showToast('আনলিংক করতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    }
  };
}

// Persists name/position/avatarColor to Firebase Auth (displayName) + the
// Firestore profile doc, then updates local state so the whole app reflects
// it immediately (account strip, badges, etc.) without a reload.
async function saveProfileChanges({ name, position, avatarColor, avatarIcon, phone, district, birthDate, bio, favoriteQari, favoriteSurah }){
  const fbUser = fbAuth.currentUser;
  if(!fbUser) throw new Error('not signed in');
  if(fbUser.displayName !== name){ await fbUser.updateProfile({ displayName: name }); }
  await fbDb.collection('users').doc(fbUser.uid).set({
    name, position, avatarColor, avatarIcon, phone, district, birthDate, bio, favoriteQari, favoriteSurah
  }, { merge: true });
  Object.assign(state.user, { name, position, avatarColor, avatarIcon, phone, district, birthDate, bio, favoriteQari, favoriteSurah });
  refreshCurrentView();
}

async function handleSendPasswordReset(email){
  if(!email) return;
  try{
    await fbAuth.sendPasswordResetEmail(email);
    showToast('পাসওয়ার্ড রিসেট লিঙ্ক ইমেইলে পাঠানো হয়েছে');
  }catch(e){
    showToast('পাঠাতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
  }
}

// Shown right after OTP verification for "পাসওয়ার্ড পরিবর্তন করুন" — collects
// the new password and applies it via Firebase Auth. If Firebase asks for a
// recent login (e.g. the session is old), we sign out and send the user back
// through the login screen rather than silently failing.
function openNewPasswordModal(){
  const old = document.getElementById('newPassModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'newPassModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>নতুন পাসওয়ার্ড দিন</h3><button class="app-modal-close" id="npClose">✕</button></div>
      <div class="app-modal-body">
        <input class="auth-field" id="npNew" type="password" placeholder="নতুন পাসওয়ার্ড">
        <input class="auth-field" id="npConfirm" type="password" placeholder="পাসওয়ার্ড নিশ্চিত করুন">
        <div class="auth-error" id="npError"></div>
        <button class="auth-cta-btn" id="npSubmit">পাসওয়ার্ড পরিবর্তন করুন</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('npClose').onclick = remove;

  document.getElementById('npSubmit').onclick = async () => {
    const pw = document.getElementById('npNew').value;
    const pw2 = document.getElementById('npConfirm').value;
    const errBox = document.getElementById('npError');
    errBox.textContent = '';
    if(!pw || pw.length < 6){ errBox.textContent = 'অন্তত ৬ অক্ষরের পাসওয়ার্ড দিন।'; return; }
    if(pw !== pw2){ errBox.textContent = 'পাসওয়ার্ড দুটি মিলছে না।'; return; }

    const btn = document.getElementById('npSubmit');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'পরিবর্তন হচ্ছে...';
    try{
      const fbUser = fbAuth.currentUser;
      if(!fbUser) throw new Error('not signed in');
      await fbUser.updatePassword(pw);
      showToast('পাসওয়ার্ড পরিবর্তন হয়েছে');
      remove();
    }catch(e){
      if(e && e.code === 'auth/requires-recent-login'){
        remove();
        showToast('নিরাপত্তার জন্য আবার লগইন করুন, তারপর পাসওয়ার্ড পরিবর্তন করুন');
        try{ await fbAuth.signOut(); }catch(e2){}
        openAuthFlow('login');
      } else {
        errBox.textContent = 'পরিবর্তন ব্যর্থ হয়েছে, আবার চেষ্টা করুন।';
        btn.disabled = false; btn.textContent = original;
      }
    }
  };
}

// Shown when "পাসওয়ার্ড পরিবর্তন করুন" is tapped — asks the user to confirm
// intent before an OTP email goes out (so a stray tap doesn't fire off an
// email). Only on confirm does startOtpFlow() actually send anything.
function confirmPasswordChange(user){
  const old = document.getElementById('passChangeConfirmModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'passChangeConfirmModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>পাসওয়ার্ড পরিবর্তন করবেন?</h3><button class="app-modal-close" id="pcClose">✕</button></div>
      <div class="app-modal-body">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:14px;">নিশ্চিত করলে <b>${escapeHtml(user.email||'')}</b>-এ একটি যাচাইকরণ কোড (OTP) পাঠানো হবে। কোড দিয়ে যাচাই করার পর নতুন পাসওয়ার্ড সেট করতে পারবেন।</p>
        <div class="input-box-actions">
          <button class="tw-cancel-btn" id="pcCancel">বাতিল</button>
          <button class="tw-save-btn" id="pcYes">কোড পাঠান</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('pcClose').onclick = remove;
  document.getElementById('pcCancel').onclick = remove;
  document.getElementById('pcYes').onclick = () => {
    remove();
    startOtpFlow({
      email: user.email,
      name: user.name,
      purposeLabel: 'পাসওয়ার্ড পরিবর্তন',
      onVerified: openNewPasswordModal
    });
  };
}

// Permanently deletes the Firebase Auth account + its Firestore profile doc.
// On-device data (bookmarks, notes, history) is left alone, matching the
// same "cloud vs local" split used everywhere else in this file.
function confirmDeleteAccount(){
  const old = document.getElementById('deleteAccountModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'deleteAccountModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>অ্যাকাউন্ট মুছে ফেলবেন?</h3><button class="app-modal-close" id="delAccClose">✕</button></div>
      <div class="app-modal-body">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:14px;">এটি স্থায়ীভাবে আপনার অ্যাকাউন্ট এবং ক্লাউডে সংরক্ষিত অগ্রগতি মুছে ফেলবে। এই ডিভাইসের স্থানীয় ডেটা (বুকমার্ক, নোট, ইতিহাস) অক্ষত থাকবে।</p>
        <div class="input-box-actions">
          <button class="tw-cancel-btn" id="delAccCancel">বাতিল</button>
          <button class="tw-save-btn profile-delete-confirm-btn" id="delAccYes">মুছে ফেলুন</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('delAccClose').onclick = remove;
  document.getElementById('delAccCancel').onclick = remove;
  document.getElementById('delAccYes').onclick = () => {
    remove();
    const fbUser = fbAuth.currentUser;
    if(!fbUser) return;
    startOtpFlow({
      email: fbUser.email,
      name: state.user && state.user.name,
      purposeLabel: 'অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা',
      onVerified: performAccountDeletion
    });
  };
}

// Runs only after the email OTP above is verified. Deletes the Firestore
// profile doc, then the Firebase Auth account itself — irreversible.
async function performAccountDeletion(){
  const fbUser = fbAuth.currentUser;
  if(!fbUser) return;
  try{
    await deleteAccountEverywhere(fbUser);
  }catch(e){
    if(e && e.code === 'auth/requires-recent-login'){
      // Firebase wants fresh proof of identity before a destructive action
      // like this. Instead of bouncing the user out to the login screen
      // (which would abandon the whole delete flow), reauthenticate right
      // here and retry — the OTP step above already confirmed intent.
      await reauthenticateThenDelete(fbUser);
    } else {
      showToast('মুছতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন');
    }
  }
}

// Deletes the Firestore profile doc, then the Firebase Auth account itself.
// The Firestore delete gets one retry — once the Auth account is gone,
// the security rules that allow a user to delete their own doc no longer
// apply, so this is the only real window to clean that data up. If both
// attempts fail we still proceed to remove the Auth account (that's the
// step the user is actually waiting on), but that's the rare case, not
// something silently accepted on the first hiccup.
// Errors from either step (e.g. auth/requires-recent-login) propagate to
// the caller so it can reauthenticate and retry.
async function deleteAccountEverywhere(fbUser){
  try{
    await fbDb.collection('users').doc(fbUser.uid).delete();
  }catch(e){
    try{ await fbDb.collection('users').doc(fbUser.uid).delete(); }catch(e2){ /* proceed anyway — Auth delete below still fully removes the account */ }
  }
  await fbUser.delete();
  showToast('অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে');
}

// Re-proves identity, then retries the delete — without ever sending the
// user away from this flow. Google accounts reauthenticate via a popup;
// password accounts get an inline "confirm your password" modal.
async function reauthenticateThenDelete(fbUser){
  const providerId = fbUser.providerData && fbUser.providerData[0] && fbUser.providerData[0].providerId;

  if(providerId === 'google.com'){
    try{
      const provider = new firebase.auth.GoogleAuthProvider();
      await fbUser.reauthenticateWithPopup(provider);
      await deleteAccountEverywhere(fbUser);
    }catch(e){
      showToast('যাচাই ব্যর্থ হয়েছে, অ্যাকাউন্ট মুছা যায়নি — আবার চেষ্টা করুন');
    }
    return;
  }

  openReauthPasswordModal(async (password) => {
    try{
      const cred = firebase.auth.EmailAuthProvider.credential(fbUser.email, password);
      await fbUser.reauthenticateWithCredential(cred);
      await deleteAccountEverywhere(fbUser);
      return true;
    }catch(e){
      return false; // wrong password or delete failed — let the modal show an error and retry
    }
  });
}

// Small inline modal used only by reauthenticateThenDelete() above — asks
// for the current password, calls onSubmit(password) which resolves
// true/false, and only closes on success.
function openReauthPasswordModal(onSubmit){
  const old = document.getElementById('reauthPassModal');
  if(old) old.remove();
  const wrap = document.createElement('div');
  wrap.className = 'app-modal';
  wrap.id = 'reauthPassModal';
  wrap.style.display = 'flex';
  wrap.innerHTML = `
    <div class="app-modal-box input-box-modal">
      <div class="app-modal-head"><h3>পাসওয়ার্ড দিয়ে নিশ্চিত করুন</h3><button class="app-modal-close" id="raClose">✕</button></div>
      <div class="app-modal-body">
        <p style="margin:0 0 14px;color:var(--ink-soft);font-size:14px;">নিরাপত্তার জন্য অ্যাকাউন্ট মুছে ফেলার আগে আপনার বর্তমান পাসওয়ার্ডটি দিন।</p>
        <input class="auth-field" id="raPassword" type="password" placeholder="বর্তমান পাসওয়ার্ড">
        <div class="auth-error" id="raError"></div>
        <div class="input-box-actions">
          <button class="tw-cancel-btn" id="raCancel">বাতিল</button>
          <button class="tw-save-btn profile-delete-confirm-btn" id="raSubmit">অ্যাকাউন্ট মুছে ফেলুন</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  const remove = () => wrap.remove();
  wrap.addEventListener('click', (e) => { if(e.target === wrap) remove(); });
  document.getElementById('raClose').onclick = remove;
  document.getElementById('raCancel').onclick = remove;
  document.getElementById('raSubmit').onclick = async () => {
    const pw = document.getElementById('raPassword').value;
    const errBox = document.getElementById('raError');
    errBox.textContent = '';
    if(!pw){ errBox.textContent = 'পাসওয়ার্ড দিন।'; return; }
    const btn = document.getElementById('raSubmit');
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'যাচাই হচ্ছে...';
    const ok = await onSubmit(pw);
    if(ok){
      remove();
    } else {
      errBox.textContent = 'পাসওয়ার্ড ভুল অথবা মুছতে ব্যর্থ হয়েছে, আবার চেষ্টা করুন।';
      btn.disabled = false; btn.textContent = original;
    }
  };
}
