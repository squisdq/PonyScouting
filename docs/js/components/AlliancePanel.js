import { html, useState, useEffect, useMemo, React } from "../html.js";
import { suggest, z, zColor, KEY_LABEL } from "../analytics.js";

const f1 = (v) => (v == null ? "—" : v.toFixed(1));

function Sortable({ items, render, onMove }) {
  const ref = React.useRef(null);
  const dragRef = React.useRef(null);
  const [drag, setDrag] = useState(null);
  const active = drag !== null;

  useEffect(() => {
    if (!active) return;
    const rowAt = (y) => {
      const rows = [...ref.current.children];
      const i = rows.findIndex((r) => y < r.getBoundingClientRect().bottom);
      return i < 0 ? rows.length - 1 : i;
    };
    const mv = (e) => { dragRef.current = { ...dragRef.current, over: rowAt(e.clientY) }; setDrag(dragRef.current); };
    const up = () => {
      const d = dragRef.current;
      dragRef.current = null; setDrag(null);
      if (d && d.over !== d.from) onMove(d.from, d.over);
    };
    const cancel = () => { dragRef.current = null; setDrag(null); };
    window.addEventListener("pointermove", mv);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); };
  }, [active]);

  const begin = (i) => (e) => { e.preventDefault(); dragRef.current = { from: i, over: i }; setDrag(dragRef.current); };
  return html`<ol ref=${ref} className="space-y-2">
    ${items.map((it, i) => html`<li key=${it} className=${`card flex items-center gap-2 p-2 ${drag && drag.over === i && drag.from !== i ? "drop-over" : ""}`} style=${{ opacity: drag?.from === i ? 0.5 : 1 }}>
      <span className="grip" onPointerDown=${begin(i)} aria-label="Drag">⠿</span>
      ${render(it, i)}
    </li>`)}
  </ol>`;
}

export default function AlliancePanel({ A, cards, our, picks, nameOf, onOur, onPicks }) {
  const [order, setOrder] = useState(picks);
  const [add, setAdd] = useState("");
  const [ourText, setOurText] = useState(our ? String(our) : "");
  useEffect(() => setOrder(picks), [picks.join(",")]);
  useEffect(() => setOurText(our ? String(our) : ""), [our]);

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.number, c])), [cards]);
  const sugg = useMemo(() => suggest(A, our, new Set(order), cardMap).slice(0, 8), [A, our, order.join(","), cardMap]);
  const commit = (l) => { setOrder(l); onPicks(l); };
  const move = (from, to) => { const l = [...order]; const [m] = l.splice(from, 1); l.splice(to, 0, m); commit(l); };
  const addNum = (e) => { e.preventDefault(); const n = Number(add); if (n && !order.includes(n)) commit([...order, n]); setAdd(""); };
  const ourT = A.teams.get(our);

  return html`
    <div className="space-y-6">
      <div className="card space-y-2 p-4">
        <label className="label" htmlFor="our">Our team number</label>
        <div className="flex gap-2">
          <input id="our" className="input" inputMode="numeric" placeholder="12345" value=${ourText}
                 onChange=${(e) => setOurText(e.target.value)} onBlur=${() => onOur(/^\d+$/.test(ourText.trim()) ? Number(ourText.trim()) : null)} />
        </div>
        <p className="muted text-sm">Recommendations look for partners who cover our weak spots (compared with the event average).</p>
        ${our && !ourT && html`<p className="note p-2 text-sm">Team ${our} has not played any matches yet — recommendations will appear after its first games.</p>`}
      </div>

      <section className="space-y-2">
        <h3 className="f-title text-2xl">Pick list (drag to reorder)</h3>
        ${order.length === 0 && html`<p className="muted">The list is empty. Add teams from the recommendations below or enter a number.</p>`}
        <${Sortable} items=${order} onMove=${move} render=${(n, i) => html`
          <span className="f-title w-6 text-center">${i + 1}</span>
          <span className="min-w-0 flex-1"><span className="f-title accent">${n}</span> <span className="truncate">${nameOf(n)}</span></span>
          <button onClick=${() => commit(order.filter((x) => x !== n))} className="ghost-btn danger" aria-label="Remove from list">✕</button>`} />
        <form onSubmit=${addNum} className="flex gap-2">
          <input className="input" inputMode="numeric" placeholder="Add team number" value=${add} onChange=${(e) => setAdd(e.target.value)} />
          <button className="btn2 shrink-0">Add</button>
        </form>
      </section>

      ${order.length > 0 && html`<section className="space-y-2">
        <h3 className="f-title text-2xl">Pick Matrix</h3>
        <div className="card scroll-x p-2"><table className="tbl">
          <thead><tr><th>Team</th>${A.keys.map((k) => html`<th key=${k}>${KEY_LABEL[k]}</th>`)}<th>Cons.</th></tr></thead>
          <tbody>${order.map((n) => { const t = A.teams.get(n); return html`<tr key=${n}>
            <td><span className="f-title">${n}</span> <span className="muted">${nameOf(n)}</span></td>
            ${A.keys.map((k) => html`<td key=${k} style=${{ background: t ? zColor(z(A, t, k)) : "none" }}>${t ? f1(t.opr[k]) : "—"}</td>`)}
            <td>${t?.ci ?? "—"}</td></tr>`; })}</tbody>
        </table></div>
        <p className="muted text-sm">Cell color: green — above the event average, red — below.</p>
      </section>`}

      <section className="space-y-2">
        <h3 className="f-title text-2xl">Partner recommendations</h3>
        ${!our ? html`<p className="muted">Enter our team number.</p>`
          : sugg.length === 0 ? html`<p className="muted">Not enough data for recommendations.</p>`
          : html`<ul className="space-y-2">${sugg.map((s) => html`<li key=${s.n} className="card flex items-start justify-between gap-2 p-3">
              <div className="min-w-0"><span className="f-title accent">${s.n}</span> ${nameOf(s.n)}
                <p className="muted text-sm">${s.reasons.length ? s.reasons.join("; ") : "balanced partner"}</p></div>
              <button onClick=${() => commit([...order, s.n])} className="btn2 shrink-0">+ add to list</button>
            </li>`)}</ul>`}
      </section>
    </div>`;
}
