import { html, useState, useEffect } from "../html.js";
import { db, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from "../firebase.js";
import { fmtCode } from "../workspace.js";
import Modal from "./Modal.js";
import AuthScreen from "./AuthScreen.js";

function AccountModal({ ws, workspaces, onClose, onEnter, onSwitch, onLeave }) {
  const [show, setShow] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const others = workspaces.filter((w) => w.code !== ws.code);
  const copy = async () => { try { await navigator.clipboard.writeText(fmtCode(ws.code)); setCopied(true); } catch {} };

  if (adding) return html`<${Modal} title="Add a team" onClose=${() => setAdding(false)}><${AuthScreen} compact=${true} onEnter=${onEnter} /><//>`;
  return html`
    <${Modal} title=${ws.name} onClose=${onClose}>
      <div className="space-y-4">
        <div>
          <span className="label">Access code${ws.number ? ` · team ${ws.number}` : ""}</span>
          <p className="code-box card p-3 text-center text-2xl">${show ? fmtCode(ws.code) : "••••-••••-••••"}</p>
          <div className="mt-2 flex gap-2">
            <button onClick=${() => setShow(!show)} className="btn2">${show ? "Hide" : "Show"}</button>
            <button onClick=${copy} className="btn2">${copied ? "Copied ✓" : "Copy"}</button>
          </div>
        </div>
        ${others.length > 0 && html`<div>
          <span className="label">Other teams on this device</span>
          <div className="space-y-2">${others.map((w) => html`<button key=${w.code} onClick=${() => onSwitch(w.code)} className="opt w-full text-left">${w.name}</button>`)}</div>
        </div>`}
        <button onClick=${() => setAdding(true)} className="btn2 w-full">Join another team / create a new one</button>
        <button onClick=${() => { if (window.confirm("Leave this team on this device? You will need the code to join again.")) onLeave(ws.code); }}
                className="ghost-btn danger w-full text-center">Leave this team on this device</button>
      </div>
    <//>`;
}

export default function SessionList({ ws, workspaces, onOpen, onEnter, onSwitch, onLeave }) {
  const [sessions, setSessions] = useState(null);
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const col = ["workspaces", ws.code, "sessions"];

  useEffect(() => {
    setSessions(null);
    const q = query(collection(db, ...col), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => setError(e.message));
  }, [ws.code]);

  const create = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const ref = doc(collection(db, ...col));
    setDoc(ref, { name: name.trim(), createdAt: serverTimestamp(), ourTeam: ws.number ?? null }).catch((err) => setError(err.message));
    setOpen(false); setName("");
    onOpen(ref.id);
  };

  const remove = async (s) => {
    if (!window.confirm(`Delete session “${s.name}” together with all its teams? This cannot be undone.`)) return;
    try {
      const teams = await getDocs(collection(db, ...col, s.id, "teams"));
      const batch = writeBatch(db);
      teams.forEach((t) => batch.delete(t.ref));
      batch.delete(doc(db, ...col, s.id));
      batch.commit().catch((err) => setError(err.message));
    } catch (err) { setError(err.message); }
  };

  const date = (s) =>
    s.createdAt?.toDate().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) ?? "saving…";

  return html`
    <div className="mx-auto max-w-3xl px-5 pb-10 pt-14">
      <header className="mb-8">
        <h1 className="f-title text-5xl leading-tight sm:text-6xl">Pony Scouting</h1>
        <p className="mt-2 text-xl">choose a competition or create a new one</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button onClick=${() => setOpen(true)} className="btn">Create new session</button>
          <button onClick=${() => setAccount(true)} className="btn2">👥 ${ws.name}</button>
        </div>
      </header>

      ${error && html`<p className="err mb-4 p-3">Firebase error: ${error}</p>`}

      ${sessions === null
        ? html`<p className="text-lg">loading…</p>`
        : sessions.length === 0
        ? html`<p className="card p-8 text-center text-lg">No sessions yet. Create the first one, for example “Almaty Regional 2026”.</p>`
        : html`<ul className="grid gap-8 sm:grid-cols-2">
            ${sessions.map((s) => html`
              <li key=${s.id} className="relative">
                <button onClick=${() => onOpen(s.id)} className="card block w-full p-4 pr-24 text-left">
                  <span className="f-title block text-4xl leading-tight">${s.name}</span>
                  <span className="mt-1 block text-lg">${date(s)}</span>
                </button>
                <button onClick=${() => remove(s)} aria-label=${`Delete session ${s.name}`} className="ghost-btn danger absolute right-3 top-3 text-sm">delete</button>
              </li>`)}
          </ul>`}

      ${open && html`
        <${Modal} title="New session" onClose=${() => setOpen(false)}>
          <form onSubmit=${create} className="space-y-4">
            <div>
              <label className="label" htmlFor="sname">Competition name</label>
              <input id="sname" autoFocus className="input" placeholder="Your competition name" value=${name} onChange=${(e) => setName(e.target.value)} />
            </div>
            <button disabled=${!name.trim()} className="btn w-full">Create session</button>
          </form>
        <//>`}

      ${account && html`<${AccountModal} ws=${ws} workspaces=${workspaces} onClose=${() => setAccount(false)}
                           onEnter=${(w) => { setAccount(false); onEnter(w); }} onSwitch=${onSwitch} onLeave=${onLeave} />`}
    </div>`;
}
