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
  apiKey: "AIzaSyCPbnXF6UxSa2wPN4RUS3wF-SLrqE5_b0s",
  authDomain: "board-game-organization.firebaseapp.com",
  projectId: "board-game-organization",
  storageBucket: "board-game-organization.firebasestorage.app",
  messagingSenderId: "633995288694",
  appId: "1:633995288694:web:d9d5079c4d7a79c3b27f57"
};

// Everyone using the same ROOM_ID shares the same list of games.
// Change it to anything you like — it's just a string, no setup needed.
export const ROOM_ID = "friends";
