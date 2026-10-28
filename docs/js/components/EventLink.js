import { html, useState } from "../html.js";
import { searchEvents, getEvent } from "../ftcscout.js";
import { SEASONS } from "../constants.js";
import Modal from "./Modal.js";

export default function EventLink({ current, onSave, onClose }) {
  const [season, setSeason] = useState(current?.season ?? SEASONS[0].y);
  const [q, setQ] = useState("");
  const [code, setCode] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (fn) => { setBusy(true); setError(""); try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  const search = (e) => { e.preventDefault(); if (!q.trim()) return;
    run(async () => { const r = await searchEvents(season, q.trim()); setResults(r); if (!r.length) setError("Nothing found. Try another name or enter the event code."); }); };
  const byCode = (e) => { e.preventDefault(); if (!code.trim()) return;
    run(async () => onSave(await getEvent(season, code.trim().toUpperCase()))); };

  return html`
    <${Modal} title="FTCScout competition" onClose=${onClose}>
      <div className="space-y-4">
        ${current && html`<p className="card p-3">Current: <b>${current.name}</b> (${current.season}, ${current.code})
          <button onClick=${() => onSave(null)} className="ghost-btn danger ml-2">unlink</button></p>`}
        <div>
          <label className="label" htmlFor="season">Season</label>
          <select id="season" className="input" value=${season} onChange=${(e) => { setSeason(Number(e.target.value)); setResults([]); }}>
            ${SEASONS.map((s) => html`<option key=${s.y} value=${s.y}>${s.label}</option>`)}
          </select>
        </div>
        <form onSubmit=${search} className="space-y-2">
          <label className="label" htmlFor="evq">Search by name</label>
          <div className="flex gap-2">
            <input id="evq" className="input" placeholder="e.g., Almaty" value=${q} onChange=${(e) => setQ(e.target.value)} />
            <button disabled=${busy} className="btn2 shrink-0">Search</button>
          </div>
        </form>
        <form onSubmit=${byCode} className="space-y-2">
          <label className="label" htmlFor="evc">…or the event code (as on ftcscout.org)</label>
          <div className="flex gap-2">
            <input id="evc" className="input" placeholder="e.g., KZALM" value=${code} onChange=${(e) => setCode(e.target.value)} />
            <button disabled=${busy} className="btn2 shrink-0">Link</button>
          </div>
        </form>
        ${busy && html`<p className="muted">Loading…</p>`}
        ${error && html`<p className="err p-3 text-sm">${error}</p>`}
        <ul className="space-y-2">
          ${results.slice(0, 20).map((e) => html`
            <li key=${e.code}><button onClick=${() => onSave(e)} className="opt w-full text-left">
              <span className="block">${e.name}</span>
              <span className="muted block text-sm">${[e.code, e.city, e.country, e.start?.slice?.(0, 10)].filter(Boolean).join(" · ")}</span>
            </button></li>`)}
        </ul>
      </div>
    <//>`;
}
