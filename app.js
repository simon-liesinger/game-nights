import { firebaseConfig, ROOM_ID } from "./firebase-config.js";

/* ── Setup gate ──────────────────────────────────────────────── */
// Check config first and load the Firebase SDK only once configured, so the
// setup banner shows instantly even with no network / before any CDN call.
if (firebaseConfig.apiKey.startsWith("YOUR_")) {
  document.getElementById("setup").classList.remove("hidden");
  throw new Error("Firebase not configured — see firebase-config.js");
}
document.getElementById("app").classList.remove("hidden");

/* ── Firebase ────────────────────────────────────────────────── */
const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
const {
  getFirestore, collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

const db = getFirestore(initializeApp(firebaseConfig));
const gamesCol = collection(db, "rooms", ROOM_ID, "games");
const gameRef = (id) => doc(db, "rooms", ROOM_ID, "games", id);

/* ── Identity (no auth — just a name + stable local id) ───────── */
const me = {
  id: localStorage.getItem("gg_uid") || crypto.randomUUID(),
  name: localStorage.getItem("gg_name") || "",
};
localStorage.setItem("gg_uid", me.id);

const nameInput = document.getElementById("nameInput");
nameInput.value = me.name;
nameInput.addEventListener("input", () => {
  me.name = nameInput.value.trim();
  localStorage.setItem("gg_name", me.name);
});
if (!me.name) setTimeout(() => nameInput.focus(), 100);

document.getElementById("roomLabel").textContent = `room: ${ROOM_ID}`;

/* ── Answer scale ────────────────────────────────────────────── */
const PROBS = [
  { v: 100, l: "Yes" },
  { v: 0, l: "No" },
];

/* ── Rendering ───────────────────────────────────────────────── */
let games = [];
const list = document.getElementById("games");

function fmtDate(value) {
  if (!value) return "Date TBD";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function render() {
  document.getElementById("empty").classList.toggle("hidden", games.length > 0);
  list.innerHTML = games.map(renderCard).join("");
}

function renderCard(g) {
  const votes = Object.entries(g.votes || {}).map(([uid, v]) => ({ uid, ...v }));
  const coming = votes.filter((v) => (v.probability ?? 0) >= 50).length;
  const hosts = votes.filter((v) => v.canHost);
  const min = g.minPlayers, max = g.maxPlayers;

  let countClass = "chip", countNote = "";
  if (min != null && max != null) {
    if (coming >= min && coming <= max) { countClass = "chip ok"; countNote = " ✓"; }
    else if (coming < min) { countClass = "chip under"; countNote = ` · need ${min - coming} more`; }
    else { countClass = "chip ok"; countNote = " · full+"; }
  }

  const mine = (g.votes || {})[me.id] || {};
  const probBtns = PROBS.map((p) =>
    `<button data-action="prob" data-game="${g.id}" data-prob="${p.v}" class="${mine.probability === p.v ? "sel" : ""}">${p.l}</button>`
  ).join("");

  const voterRows = votes
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0))
    .map((v) => {
      const yes = (v.probability ?? 0) >= 50;
      return `
      <div class="voter ${yes ? "yes" : "no"}">
        <span class="answer">${yes ? "✅ Yes" : "❌ No"}</span>
        <span class="vname">${esc(v.name || "Someone")}</span>
        ${v.canHost ? '<span class="badge">🏠 host</span>' : ""}
      </div>`;
    }).join("");

  return `
    <article class="card">
      <div class="card-head">
        <div class="card-title">
          <span class="type">${esc(g.type)}</span>
          <span class="when">🗓 ${esc(fmtDate(g.date))}</span>
        </div>
        <div class="card-actions">
          <button class="icon-btn" data-action="edit" data-game="${g.id}">Edit</button>
          <button class="icon-btn danger" data-action="delete" data-game="${g.id}">Delete</button>
        </div>
      </div>

      <div class="card-meta">
        <span class="${countClass}">👥 ${min ?? "?"}–${max ?? "?"} players${countNote}</span>
        ${g.location ? `<span class="chip">📍 ${esc(g.location)}</span>` : ""}
      </div>

      <div class="vote">
        <div class="vote-row">
          <span class="vote-label">I'll come</span>
          <div class="prob-opts">${probBtns}</div>
        </div>
        <div class="vote-row">
          <span class="vote-label">Hosting</span>
          <button class="host-btn ${mine.canHost ? "sel" : ""}" data-action="host" data-game="${g.id}">
            ${mine.canHost ? "🏠 I can host" : "I can host"}
          </button>
        </div>

        <div class="tally">
          <div class="tally-summary">
            <span><strong>${votes.length}</strong> respondent${votes.length === 1 ? "" : "s"}</span>
            <span><strong>${coming}</strong> coming</span>
            <span><strong>${hosts.length}</strong> can host</span>
          </div>
          ${votes.length
            ? `<details class="voters-wrap">
                 <summary>Show respondents</summary>
                 <div class="voters">${voterRows}</div>
               </details>`
            : '<span class="muted">No votes yet.</span>'}
        </div>
      </div>
    </article>`;
}

/* ── Live data (subscribe after render helpers are ready) ────── */
onSnapshot(
  query(gamesCol, orderBy("date", "asc")),
  (snap) => {
    games = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    document.getElementById("status").textContent = `${games.length} game${games.length === 1 ? "" : "s"} · live`;
    render();
  },
  (err) => {
    document.getElementById("status").textContent = "⚠ " + err.message;
  }
);

/* ── Voting (event delegation) ───────────────────────────────── */
list.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const { action, game: id, prob } = btn.dataset;
  const g = games.find((x) => x.id === id);
  if (!g) return;

  if (action === "edit") return openDialog(g);
  if (action === "delete") {
    if (confirm(`Delete "${g.type}"?`)) await deleteDoc(gameRef(id));
    return;
  }

  if (!me.name) {
    nameInput.focus();
    alert("Enter your name first (top right) so others know who's voting.");
    return;
  }

  const current = (g.votes || {})[me.id] || { probability: 0, canHost: false };
  const next = { ...current, name: me.name };
  if (action === "prob") next.probability = Number(prob);
  if (action === "host") next.canHost = !current.canHost;

  await updateDoc(gameRef(id), { [`votes.${me.id}`]: next });
});

/* ── Add / edit dialog ───────────────────────────────────────── */
const dialog = document.getElementById("gameDialog");
const form = document.getElementById("gameForm");
let editingId = null;

function openDialog(g = null) {
  editingId = g?.id ?? null;
  document.getElementById("dialogTitle").textContent = g ? "Edit game" : "New game";
  form.type.value = g?.type ?? "";
  form.date.value = g?.date ? toLocalInput(g.date) : "";
  form.minPlayers.value = g?.minPlayers ?? 2;
  form.maxPlayers.value = g?.maxPlayers ?? 6;
  form.location.value = g?.location ?? "";
  dialog.showModal();
  setTimeout(() => form.type.focus(), 50);
}

function toLocalInput(value) {
  const d = new Date(value);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

document.getElementById("addBtn").addEventListener("click", () => openDialog());
document.getElementById("cancelBtn").addEventListener("click", () => dialog.close());

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const min = Number(form.minPlayers.value);
  const max = Number(form.maxPlayers.value);
  const data = {
    type: form.type.value.trim(),
    date: form.date.value ? new Date(form.date.value).toISOString() : "",
    minPlayers: min,
    maxPlayers: Math.max(min, max),
    location: form.location.value.trim(),
  };
  if (!data.type) return;

  try {
    if (editingId) {
      await updateDoc(gameRef(editingId), data);
    } else {
      await addDoc(gamesCol, { ...data, votes: {}, createdAt: serverTimestamp() });
    }
    dialog.close();
  } catch (err) {
    alert("Couldn't save: " + err.message);
  }
});
