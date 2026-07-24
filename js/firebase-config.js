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
//       }
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