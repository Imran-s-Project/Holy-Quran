# কুরআন বাংলা — Quran in Bangla (PWA)

আরবি টেক্সট, বাংলা অনুবাদ ও তিলাওয়াতসহ একটি সম্পূর্ণ অফলাইন-সক্ষম Progressive Web App (PWA)। Vanilla JavaScript, HTML ও CSS দিয়ে তৈরি — কোনো ফ্রেমওয়ার্ক নেই।

## বৈশিষ্ট্যসমূহ

- **কুরআন রিডার** — সূরা, পৃষ্ঠা, পারা, হিজব ও রুকু অনুযায়ী পড়ার সুবিধা, ফন্ট সাইজ কন্ট্রোল, অ্যাপ্রক্সিমেট তাজবীদ কালার হাইলাইটিং
- **অডিও প্লেয়ার** — একাধিক ক্বারী সাপোর্ট, ব্যাকগ্রাউন্ড/লক-স্ক্রিন প্লেব্যাক (Media Session API), স্পিড কন্ট্রোল, অটোপ্লে, রিসাইটার-ভিত্তিক লিসেনিং টাইম স্ট্যাটস
- **ফুল-টেক্সট সার্চ** — অনুবাদ ও আরবি উভয় মোডে পুরো কুরআনের মধ্যে আয়াত খোঁজা
- **রিডিং প্ল্যানার** — "N দিনে কুরআন খতম" ধরনের গোল ট্র্যাক করা (localStorage-ভিত্তিক)
- **বিষয়ভিত্তিক আয়াত ব্রাউজিং** (Topics) — হাতে-বাছাই রেফারেন্স ডেটাসেট
- **সূরা পরিচিতি** — প্রতিটি সূরার শানে নুযুল/প্রেক্ষাপট ও ফজিলত-ভিত্তিক ব্যবহার তথ্য
- **লাইব্রেরি** — বুকমার্ক, প্রতি-আয়াত পার্সোনাল নোট, পড়ার ইতিহাস (History), অফলাইন ডাউনলোড ম্যানেজার (সব ১১৪টি সূরা ব্রাউজ করে বেছে ডাউনলোড)
- **পরিসংখ্যান (Stats)** — পড়ার স্ট্রিক, সাপ্তাহিক চার্ট, ব্যাজ, সপ্তাহ-ভিত্তিক ট্রেন্ড ও পারসোনাল রেকর্ড, শেয়ারযোগ্য মাসিক রিপোর্ট কার্ড (canvas-জেনারেটেড ছবি)
- **রমজান মোড + তারাবীহ ট্র্যাকার** — হিজরি ক্যালেন্ডার ডিটেকশন সহ
- **সালাতের সময়সূচি**, কিবলা কম্পাস ও নামাজের পুশ নোটিফিকেশন (অ্যাপ বন্ধ থাকলেও)
- **অভিধান (Dictionary)**
- **কাস্টম থিম বিল্ডার** — ৩০ দিনের স্ট্রিক আনলক ফিচার, নিজের রং বেছে থিম তৈরি
- **১৩টি ভাষায় UI** — bn, en, ar, es, fa, fr, hi, id, ms, ru, sw, tr, zh (`js/i18n/`)
- **সম্পূর্ণ অফলাইন সাপোর্ট** — Service Worker দিয়ে অ্যাপ শেল, কুরআন টেক্সট ও তিলাওয়াত ক্যাশ হয়; বড় ডেটার জন্য IndexedDB
- **Firebase Auth + Firestore** — অ্যাকাউন্ট সিস্টেম, শুধু অ্যাগ্রিগেট স্ট্যাটস ক্লাউড-সিঙ্ক হয় (বুকমার্ক/নোট/হিস্টরি ডিভাইস-লোকাল থাকে)
- **Installable PWA** — হোম স্ক্রিনে ইনস্টল করা যায়, নিজস্ব আইকন ও ম্যানিফেস্ট আছে

## ফোল্ডার স্ট্রাকচার

```
AlQuran-main/
├── index.html                    # মূল HTML — সব ভিউ (Home, Planner, Topics, Library, Stats) এখানে
├── manifest.json                 # PWA ম্যানিফেস্ট (নাম, আইকন, থিম কালার ইত্যাদি)
├── sw.js                         # Service Worker — ক্যাশিং স্ট্র্যাটেজি নিয়ন্ত্রণ করে
├── SETUP_PRAYER_PUSH.txt         # প্রেয়ার পুশ নোটিফিকেশনের ম্যানুয়াল সেটআপ ধাপ
├── icons/                        # PWA আইকন (192/512, maskable, apple-touch)
├── scripts/                      # অ্যাপের বাইরে চলা হেল্পার স্ক্রিপ্ট
│   ├── package.json              # firebase-admin, node-fetch ডিপেন্ডেন্সি
│   └── send-prayer-notifications.js  # GitHub Actions শিডিউলে চলে, FCM দিয়ে প্রেয়ার-টাইম পুশ পাঠায়
├── css/                          # প্রতিটি ফিচারের নিজস্ব স্টাইলশিট (একটাই style.css নয়)
│   ├── base.css / layout.css / header.css / app-shell.css   # কোর শেল ও লেআউট
│   ├── reader.css / player.css / tajweed.css                # রিডার ও অডিও প্লেয়ার
│   ├── search.css / topics.css / dictionary.css             # সার্চ, টপিকস, অভিধান
│   ├── planner.css / library-stats.css / stats-extra.css    # প্ল্যানার ও স্ট্যাটস
│   ├── notes.css / ayah-of-day.css                          # নোট ও আয়াত-অব-দ্য-ডে
│   ├── ramadan.css / prayer.css / qibla.css                 # রমজান মোড, নামাজ, কিবলা
│   ├── auth.css / modals.css / drawer.css / bottom-nav.css  # অথ, মোডাল, ড্রয়ার, নেভিগেশন
│   └── download-manager.css / theme-builder.css / help.css  # ডাউনলোড ম্যানেজার, থিম বিল্ডার, হেল্প
└── js/
    ├── data.js               # স্ট্যাটিক কনস্ট্যান্ট + হেল্পার (sw.js ও index.html উভয়ে লোড হয়)
    ├── storage.js            # শেয়ার্ড state অবজেক্ট
    ├── idb.js                # IndexedDB-ভিত্তিক key-value store (বড় ডেটার জন্য, localStorage-এর বিকল্প)
    ├── firebase-config.js    # Firebase প্রজেক্ট কনফিগ (এখানেই শুধু আপনার কী বসাতে হবে)
    ├── auth.js               # Firebase Auth + Firestore সিঙ্ক লজিক
    ├── push.js                # প্রেয়ার টাইম পুশ নোটিফিকেশন সাবস্ক্রিপশন (FCM)
    ├── player.js              # অডিও প্লেব্যাক ইঞ্জিন
    ├── audio-stats.js         # রিসাইটার-ভিত্তিক প্রকৃত লিসেনিং টাইম ট্র্যাকিং
    ├── reader.js              # সূরা/জুজ/পৃষ্ঠা/হিজব/রুকু ফেচ ও রেন্ডার, বুকমার্ক, নোট, ফন্ট সাইজ
    ├── tajweed.js             # অ্যাপ্রক্সিমেট তাজবীদ কালার হাইলাইটিং (casual visual aid)
    ├── surah-info.js          # সূরার পরিচিতি ও শানে নুযুল
    ├── surah-benefits.js      # সূরাভিত্তিক ফজিলত ও ব্যবহার তথ্য
    ├── sidebar.js             # লিস্ট রেন্ডারার (সূরা লিস্ট, বুকমার্ক, হিস্টরি, অফলাইন)
    ├── search.js              # ফুল-কুরআন সার্চ (অনুবাদ + আরবি মোড)
    ├── topics.js              # বিষয়ভিত্তিক আয়াত ব্রাউজিং
    ├── planner.js             # রিডিং প্ল্যানার
    ├── stats.js               # স্ট্রিক/চার্ট/ব্যাজ পরিসংখ্যান
    ├── stats-trends.js        # সপ্তাহ-ভিত্তিক ট্রেন্ড, মাসিক সামারি, পারসোনাল রেকর্ড
    ├── share-card.js          # canvas দিয়ে শেয়ারযোগ্য মাসিক রিপোর্ট কার্ড (PNG) তৈরি
    ├── download-manager.js    # অফলাইন ডাউনলোড ম্যানেজার (সব ১১৪ সূরা ব্রাউজ/ডাউনলোড)
    ├── theme-builder.js       # কাস্টম থিম বিল্ডার (৩০-দিন স্ট্রিক গেটেড)
    ├── ramadan.js             # রমজান মোড + তারাবীহ ট্র্যাকার
    ├── qibla.js               # কিবলা কম্পাস (কাবার বিয়ারিং ক্যালকুলেশন)
    ├── nav.js                 # বটম নেভিগেশন (৫টি মূল ভিউয়ের মধ্যে সুইচ)
    ├── menu.js                # হ্যামবার্গার ড্রয়ার: সেটিংস, প্রেয়ার টাইম, ডিকশনারি, হেল্প ইত্যাদি
    ├── app.js                 # থিম টগল ও অ্যাপ ইনিশিয়ালাইজেশন
    └── i18n/                  # প্রতিটি ভাষার জন্য আলাদা ফাইল (bn, en, ar, es, fa, fr, hi, id, ms, ru, sw, tr, zh)
```

## ব্যবহৃত টেকনোলজি ও API

- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (কোনো বান্ডলার/ফ্রেমওয়ার্ক নেই)
- **Quran টেক্সট API:** [alquran.cloud](https://alquran.cloud)
- **তিলাওয়াত অডিও:** islamic.network (রিসাইটার অডিও CDN)
- **Auth/Database:** Firebase Authentication + Cloud Firestore (compat SDK, v10.13.2)
- **ফন্ট:** Amiri (আরবি), Noto Serif Bengali, Hind Siliguri — Google Fonts থেকে
- **আইকন:** Font Awesome 6.5.2

## সেটআপ

### ১. Firebase কনফিগার করা
`js/firebase-config.js` ফাইলে Firebase Console → Project settings → General → "Your apps" থেকে পাওয়া কনফিগ অবজেক্ট বসান। এটাই একমাত্র ফাইল যেখানে হাত দিতে হবে — বাকি সব (auth স্ক্রিন, Firestore সিঙ্ক) আগে থেকেই লেখা আছে।

Firebase কনফিগার না করলেও অ্যাপ চলবে — `auth.js` নিজেই চেক করে কনফিগ আছে কিনা, না থাকলে চুপচাপ নিষ্ক্রিয় থাকে।

### ২. Firestore Security Rules
রেটিং/রিভিউ ও ইউজার ডেটার জন্য Firestore rules Firebase Console থেকে ম্যানুয়ালি ডিপ্লয় করতে হবে (Firebase Console → Firestore Database → Rules)। `js/firebase-config.js`-এর কমেন্টে সাজেস্টেড rules দেওয়া আছে, নিচে কপি করুন:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /push_subscriptions/{deviceId} {
      allow read, delete: if false;
      allow create, update: if request.resource.data.keys().hasOnly(['token','lat','lon','method','updatedAt'])
        && request.resource.data.token is string
        && request.resource.data.lat is number && request.resource.data.lat >= -90 && request.resource.data.lat <= 90
        && request.resource.data.lon is number && request.resource.data.lon >= -180 && request.resource.data.lon <= 180;
    }
  }
}
```

কোড আপডেট করার পর rules-ও মিলিয়ে আপডেট আছে কিনা নিশ্চিত করে নিন, নাহলে রেটিং/রিয়্যাকশন কাজ না-ও করতে পারে।

### ৩. প্রেয়ার-টাইম পুশ নোটিফিকেশন (ঐচ্ছিক)
`js/push.js` ও `scripts/send-prayer-notifications.js` ব্যবহার করতে চাইলে `SETUP_PRAYER_PUSH.txt`-এ দেওয়া ধাপ অনুসরণ করুন (VAPID key, service account, GitHub Actions secret)। এটা স্কিপ করলেও বাকি অ্যাপ স্বাভাবিকভাবেই কাজ করবে।

### ৪. লোকালি রান করা
এটি একটি স্ট্যাটিক সাইট — যেকোনো স্ট্যাটিক সার্ভার দিয়ে চালানো যায়:

```bash
# পাইথন দিয়ে
python3 -m http.server 8000

# অথবা Node দিয়ে
npx serve .
```

তারপর `http://localhost:8000` এ ব্রাউজ করুন। **লক্ষ্য রাখবেন:** Service Worker ও PWA ইনস্টল ফিচার `localhost` অথবা HTTPS ছাড়া কাজ করবে না (ব্রাউজার সিকিউরিটি রিকোয়ারমেন্ট)।

### ৫. প্রোডাকশনে ডিপ্লয়
পুরো `quran-main/` ফোল্ডার যেকোনো স্ট্যাটিক হোস্টিং-এ (Firebase Hosting, Netlify, Vercel, নিজের সার্ভার) আপলোড করলেই হবে। HTTPS আবশ্যক।

## Service Worker ক্যাশিং স্ট্র্যাটেজি (`sw.js`)

| কনটেন্ট | স্ট্র্যাটেজি | কারণ |
|---|---|---|
| অ্যাপ শেল (HTML/CSS/JS/আইকন) | Cache-first | অ্যাপ অফলাইনেও সাথে সাথে খোলে |
| কুরআন টেক্সট API (alquran.cloud) | Network-first, অফলাইনে cache fallback | সবসময় সর্বশেষ ডেটা, তবে নেট না থাকলেও কাজ করে |
| ক্বারীর অডিও (islamic.network) | Cache-first | একবার প্লে হওয়া আয়াত স্থায়ীভাবে সেভ থাকে, পরে ডেটা ছাড়াই আবার শোনা যায় |
| Google Fonts | Stale-while-revalidate | দ্রুত লোড + ব্যাকগ্রাউন্ডে আপডেট |

`sw.js`, `js/data.js` `importScripts()` দিয়ে লোড করে — তাই `data.js`-এ কখনো `window`/`document` রেফারেন্স রাখা যাবে না, শুধু প্লেইন কনস্ট্যান্ট ও pure ফাংশন।

পেজ থেকে সার্ভিস ওয়ার্কারকে মেসেজ পাঠিয়ে দুটি কাজ করানো যায়:
- `SKIP_WAITING` — নতুন ভার্সন সাথে সাথে অ্যাক্টিভেট করা
- `CACHE_AUDIO` (সাথে `urls` অ্যারে) — পুরো সূরার অডিও একসাথে prefetch/অফলাইন ডাউনলোড করা

## localStorage-ভিত্তিক ডেটা (অ্যাকাউন্ট ছাড়াই কাজ করে)

- **প্ল্যানার:** `qr_planners` কী-তে সংরক্ষিত
- **পরিসংখ্যান/স্ট্রিক:** `qr_activity` কী-তে সংরক্ষিত (তারিখ-ভিত্তিক পড়ার সেকেন্ড)

এই ডেটা ডিভাইস-লোকাল, ব্রাউজার ডেটা ক্লিয়ার করলে মুছে যাবে — বুকমার্ক/হিস্টরির মতোই।

## নোট

- এটি একটি starter/hand-picked টপিক ডেটাসেট ব্যবহার করে (`js/topics.js`) — প্রতিটি টপিকে হাতে-বাছাই কিছু রেফারেন্স আছে, সম্পূর্ণ ৬,২৩৬টি আয়াতের ট্যাগড ইনডেক্স নয়। প্রয়োজনে সময়ের সাথে রেফারেন্স যোগ করে বাড়ানো যাবে।
- Firebase Hosting বাধ্যতামূলক না — `firebase-config.js` ঠিকমতো পূরণ করা থাকলে যেকোনো জায়গা থেকে সার্ভ করা যায়।
