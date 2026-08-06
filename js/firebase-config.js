// ---------- Firebase project config ----------
// Paste the config object from Firebase Console → Project settings →
// General → "Your apps" → SDK setup and configuration → Config.
// This is the ONLY file you need to edit to connect the app to your own
// Firebase project. Everything else (auth screens, Firestore sync logic)
// is already wired up in js/auth.js.
//
// PRIVACY NOTE: Firestore only ever receives aggregate progress numbers —
// daily reading seconds (by date), search count, best streak, unique
// ayahs-read count, unique surahs-listened count, and the taraweeh rakat
// tracker. It NEVER receives bookmarks, notes, reading history, last-read
// position, or which specific surahs/ayahs were read — those stay only in
// this browser's localStorage on each device. See buildSyncSnapshot() in
// js/auth.js if you want to double-check exactly what gets uploaded.
//
// As of the login-history feature (js/session-security.js), Firestore also
// stores, per real sign-in, a session record under users/{uid}/sessions/{id}:
// browser + OS + device type, an IP-based approximate city/country/ISP, and
// timestamps. It never stores WiFi names or SIM/carrier names — no website
// can read those, by browser design.
//
// Also make sure, in the Firebase Console, you have:
//   1) Authentication → Sign-in method → enabled "Email/Password" and "Google".
//   2) Firestore Database → created a database (production or test mode).
//   3) Firestore → Rules → something like the rules below, so each user can
//      only read/write their own document:
//
//   rules_version = '2';
//   service cloud.firestore {
//     match /databases/{database}/documents {
//       match /users/{uid} {
//         allow read, write: if request.auth != null && request.auth.uid == uid;
//         // Login-history / active-session records (see js/session-security.js).
//         // Same owner-only rule — nobody but this account can ever read or
//         // revoke its own session list, including the "log out everywhere"
//         // link sent by email.
//         match /sessions/{sessionId} {
//           allow read, write: if request.auth != null && request.auth.uid == uid;
//         }
//       }
//       // WhatsApp-style Status/Stories (js/status.js) — everyone can read
//       // (even signed-out visitors), but only the signed-in owner can
//       // create/edit/delete their own status; any other signed-in user may
//       // only append their own uid to `viewers`/`reactions`. The exact,
//       // currently-deployed rule block (kept in sync with firestore_rules.txt)
//       // lives as a comment at the top of js/status.js — see there, not here,
//       // so there's only one copy to keep up to date.
//       match /statuses/{statusId} { /* see js/status.js */ }
//     }
//   }

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZXiL61tFvvjLD8PyWppskbvC2H9pI32w",
  authDomain: "quranbangla2.firebaseapp.com",
  projectId: "quranbangla2",
  storageBucket: "quranbangla2.firebasestorage.app",
  messagingSenderId: "562329456797",
  appId: "1:562329456797:web:6f13a79c3b4b693a7b0474",
  measurementId: "G-C65WWC3WQQ"
};