// ─────────────────────────────────────────────────────────────────────────
//  PASTE YOUR FIREBASE CONFIG HERE
//
//  1. Go to https://console.firebase.google.com  → create / pick a project
//  2. Build → Firestore Database → Create database → Start in *test mode*
//  3. Project settings (gear icon) → "Your apps" → Web app (</>) → register
//  4. Copy the `firebaseConfig` object it gives you over the one below
//
//  Until you do this the app will show a setup banner instead of running.
// ─────────────────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// Everyone using the same ROOM_ID shares the same list of games.
// Change it to anything you like — it's just a string, no setup needed.
export const ROOM_ID = "friends";
