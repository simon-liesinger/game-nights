# 🎲 Game Nights

A tiny web app for a friend group to organize board/group games. Everyone can
**create, edit, and delete** games and **vote** on each one:

- **Probability I'll come** — No · Unlikely · Maybe · Likely · Yes!
- **Can I host?** — toggle

No accounts, no automation — just a shared, live-syncing list. Everyone using
the same room sees the same games update in real time.

Each game has: **date**, **type** (which game), **min–max players**, **location**.

---

## How it works

- Pure static site (`index.html` + `app.js` + `styles.css`) — host it anywhere.
- Data syncs through **Firebase Firestore** (free tier is plenty).
- Identity is just a name you type in the corner + a random id stored in your
  browser, so your votes stick to you across reloads. No login.

---

## 1. Set up Firebase (~2 min, one time)

1. Open the [Firebase console](https://console.firebase.google.com) and create a project.
2. **Build → Firestore Database → Create database → Start in test mode.**
3. **Project settings (⚙) → Your apps → Web (`</>`)** → register an app.
4. Copy the `firebaseConfig` it shows you into [`firebase-config.js`](firebase-config.js).
5. (Optional) change `ROOM_ID` to share a different list.

### Security rules

Test mode locks the database after 30 days. Since this is just for friends and
has no logins, the simplest durable rule is "anyone with the config can read/write
this one room." In **Firestore → Rules**, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{room}/games/{game} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ This is open to anyone who has your Firebase config (which ships in the
> page source). That's fine for a private friends app — the worst case is a
> stranger who finds your URL editing your game list. If you want it tighter,
> add Firebase Anonymous Auth and gate on `request.auth != null`.

## 2. Run it

**Locally:** any static server, e.g.

```bash
cd group-games
python3 -m http.server 8000   # then open http://localhost:8000
```

(Opening `index.html` via `file://` won't work — ES modules need http.)

## 3. Publish on GitHub Pages

```bash
gh repo create game-nights --public --source=. --push   # or create the repo in the UI
```

Then in the repo: **Settings → Pages → Build from branch → `main` / root → Save.**
Your app goes live at `https://<you>.github.io/game-nights/`. Share that link
with your friends — they just type their name and start voting.

---

## Data model

```
rooms/{ROOM_ID}/games/{gameId}
  type:        "Catan"
  date:        "2026-07-02T19:30:00.000Z"   // ISO string
  minPlayers:  3
  maxPlayers:  6
  location:    "Simon's place"
  createdAt:   <serverTimestamp>
  votes: {
    <userId>: { name: "Simon", probability: 75, canHost: true }
  }
}
```
