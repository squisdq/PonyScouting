import { html, useState, useEffect, useMemo } from "../html.js";
import { db, collection, doc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from "../firebase.js";
import { useOnline, useEventData } from "../hooks.js";
import { analyze } from "../analytics.js";
import TeamCard from "./TeamCard.js";
import TeamForm from "./TeamForm.js";
import FieldEditor from "./FieldEditor.js";
import EventLink from "./EventLink.js";
import MatchesTab from "./MatchesTab.js";
import RankingsTab from "./RankingsTab.js";
import AnalyticsTab from "./AnalyticsTab.js";
import AlliancePanel from "./AlliancePanel.js";
import Modal from "./Modal.js";

const TABS = [["teams", "Teams"], ["matches", "Matches"], ["rank", "Rankings"], ["stats", "Analytics"], ["pick", "Alliance"]];

export default function SessionView({ ws, sessionId, onBack }) {
  const path = ["workspaces", ws.code, "sessions", sessionId];
  const [session, setSession] = useState(undefined);
  const [cards, setCards] = useState([]);
  const [cardsReady, setCardsReady] = useState(false);
  const [tab, setTab] = useState("teams");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [fieldFor, setFieldFor] = useState(null);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const online = useOnline();

  useEffect(() => {
    const u1 = onSnapshot(doc(db, ...path), (d) => setSession(d.exists() ? d.data() : null), (e) => setError(e.message));
    const q = query(collection(db, ...path, "teams"), orderBy("number"));
    const u2 = onSnapshot(q, (s) => { setCards(s.docs.map((d) => ({ id: d.id, ...d.data() }))); setCardsReady(true); }, (e) => setError(e.message));
    return () => { u1(); u2(); };
  }, [ws.code, sessionId]);

  const event = session?.event ?? null;
  const ev = useEventData(event);
  const A = useMemo(() => analyze(ev.matches), [ev.matches]);
  const our = session?.ourTeam ?? ws.number ?? null;
  const picks = session?.picks ?? [];

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.number, c])), [cards]);
  const ftcMap = useMemo(() => new Map(ev.teams.map((t) => [t.number, t])), [ev.teams]);
  const nameOf = (n) => cardMap.get(n)?.name || ftcMap.get(n)?.name || "";
  const cardNums = useMemo(() => new Set(cards.map((c) => c.number)), [cards]);

  const patch = (data) => setDoc(doc(db, ...path), data, { merge: true }).catch((e) => setError(e.message));

  const planSync = () => {
    const ops = [];
    for (const t of ev.teams) {
      const c = cardMap.get(t.number);
      if (!c) ops.push({ t, create: true });
      else if (!c.name?.trim() && t.name) ops.push({ t, create: false });
    }
    return ops;
  };
  const pending = useMemo(planSync, [ev.teams, cardMap]);
  const syncCards = () => {
    const batch = writeBatch(db);
    for (const { t, create } of planSync()) {
      const ref = doc(db, ...path, "teams", String(t.number));
      if (create) batch.set(ref, { number: t.number, name: t.name || "", fromFtc: true, updatedAt: serverTimestamp() }, { merge: true });
      else batch.set(ref, { name: t.name, fromFtc: true }, { merge: true });
    }
    batch.commit().catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (cardsReady && session?.event && !session.synced && ev.teams.length) { syncCards(); patch({ synced: true }); }
  }, [cardsReady, session?.event?.code, session?.synced, ev.teams.length]);

  const remove = (c) => { if (window.confirm(`Delete team ${c.number}?`)) deleteDoc(doc(db, ...path, "teams", c.id)).catch((e) => setError(e.message)); };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? cards.filter((c) => String(c.number).includes(s) || c.name?.toLowerCase().includes(s)) : cards;
  }, [cards, search]);

  if (session === null) {
    return html`<div className="p-8 text-center">
      <p className="mb-4 text-lg">Session not found (it may have been deleted).</p>
      <button onClick=${onBack} className="link text-lg underline">Back to sessions</button>
    </div>`;
  }

  const needEvent = (node) => (event ? node : html`<div className="card space-y-3 p-8 text-center">
    <p className="text-lg">To see matches and stats, link a competition from FTCScout.</p>
    <button onClick=${() => setLinking(true)} className="btn">Link competition</button></div>`);

  return html`
    <div className="mx-auto max-w-5xl px-5 pb-10">
      <div className="sticky-bar sticky top-0 z-10 -mx-5 mb-5 px-5 pb-3 pt-8">
        <button onClick=${onBack} className="link mb-1 text-lg">← all sessions</button>
        <div className="flex items-center justify-between gap-3">
          <h1 className="f-title text-3xl leading-tight sm:text-5xl">${session?.name ?? "…"}</h1>
          <button onClick=${() => setEditing({})} className="btn btn-sm shrink-0">Add team</button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick=${() => setLinking(true)} className="btn2">🏆 ${event ? `${event.name} · ${event.season}` : "Link FTCScout competition"}</button>
          ${event && html`<button onClick=${ev.reload} disabled=${ev.loading || !online} className="btn2">${ev.loading ? "Refreshing…" : "Refresh"}</button>`}
          ${event && pending.length > 0 && html`<button onClick=${syncCards} className="btn2">Add event teams (${pending.length})</button>`}
        </div>
        <div className="tabs">
          ${TABS.map(([k, t]) => html`<button key=${k} onClick=${() => setTab(k)} className=${`tab ${tab === k ? "tab-on" : ""}`}>${t}</button>`)}
        </div>
        ${tab === "teams" && html`<input type="search" inputMode="numeric" placeholder="Search by team number" value=${search}
          onChange=${(e) => setSearch(e.target.value)} className="input mt-2" />`}
      </div>

      <div className="mb-4 space-y-2">
        ${!online && html`<p className="banner">No connection: everything you enter is saved on this device and will be sent when internet is back.</p>`}
        ${event && ev.stale && html`<p className="banner">FTCScout data from a saved copy (${new Date(ev.t).toLocaleString("en-GB")}). Refresh when you are back online.</p>`}
        ${ev.error && html`<p className="err p-3">FTCScout: ${ev.error}</p>`}
        ${error && html`<p className="err p-3">Firebase error: ${error}</p>`}
      </div>

      ${tab === "teams" && (cards.length === 0
        ? html`<p className="card p-8 text-center text-lg">No teams yet. Add the first one${event ? " or tap “Add event teams”" : ""}.</p>`
        : filtered.length === 0
        ? html`<p className="p-10 text-center text-lg">Nothing found for “${search}”.</p>`
        : html`<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            ${filtered.map((c) => html`<${TeamCard} key=${c.id} team=${c} ftc=${ftcMap.get(c.number)} an=${A.teams.get(c.number)}
              onEdit=${() => setEditing(c)} onDelete=${() => remove(c)} onField=${() => setFieldFor(c)} />`)}
          </div>`)}

      ${tab === "matches" && needEvent(html`<${MatchesTab} matches=${ev.matches} our=${our} cardNums=${cardNums} />`)}
      ${tab === "rank" && needEvent(html`<${RankingsTab} teams=${ev.teams} cardMap=${cardMap} />`)}
      ${tab === "stats" && needEvent(html`<${AnalyticsTab} A=${A} nameOf=${nameOf} our=${our} />`)}
      ${tab === "pick" && html`<${AlliancePanel} A=${A} cards=${cards} our=${our} picks=${picks} nameOf=${nameOf}
        onOur=${(n) => patch({ ourTeam: n })} onPicks=${(l) => patch({ picks: l })} />`}

      ${editing && html`
        <${Modal} title=${editing.id ? `Team ${editing.number}` : "New team"} onClose=${() => setEditing(null)}>
          <${TeamForm} path=${path} initial=${editing.id ? editing : null} existingNumbers=${cards.map((c) => c.id)} onDone=${() => setEditing(null)} />
        <//>`}
      ${fieldFor && html`<${FieldEditor} path=${path} team=${cards.find((c) => c.id === fieldFor.id) ?? fieldFor} onClose=${() => setFieldFor(null)} />`}
      ${linking && html`<${EventLink} current=${event} onSave=${(e) => { patch({ event: e, synced: false }); setLinking(false); }} onClose=${() => setLinking(false)} />`}
    </div>`;
}
