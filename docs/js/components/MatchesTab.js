import { html, useState } from "../html.js";
import { LEVEL_LABEL } from "../ftcscout.js";

export default function MatchesTab({ matches, our, cardNums }) {
  const [onlyOur, setOnlyOur] = useState(false);
  const list = onlyOur && our ? matches.filter((m) => [...m.red.teams, ...m.blue.teams].some((t) => t.n === our)) : matches;
  if (!matches.length) return html`<p className="card p-8 text-center text-lg">No matches yet: the schedule will appear once it is published.</p>`;

  const side = (s, cls, won) => html`
    <div className=${`flex items-center justify-between gap-2 rounded-lg px-2 py-1 ${cls}`}>
      <span className="flex flex-wrap gap-x-2">
        ${s.teams.map((t) => html`<span key=${t.n} className=${t.n === our ? "f-title accent" : cardNums.has(t.n) ? "f-title" : ""}>${t.n}</span>`)}
      </span>
      <span className=${won ? "f-title" : ""}>${s.score ? s.score.total ?? s.score.np ?? "—" : "—"}</span>
    </div>`;

  let lastLevel = null;
  return html`
    <div className="space-y-3">
      ${our && html`<label className="flex items-center gap-2"><input type="checkbox" checked=${onlyOur} onChange=${(e) => setOnlyOur(e.target.checked)} /> Only our team's matches (${our})</label>`}
      <p className="muted text-sm">Bold teams are already in your scouting cards.</p>
      ${list.map((m) => {
        const head = m.level !== lastLevel ? html`<h3 className="f-title mt-4 text-2xl">${LEVEL_LABEL[m.level] ?? m.level}</h3>` : null;
        lastLevel = m.level;
        const rs = m.red.score?.total, bs = m.blue.score?.total;
        return html`<div key=${m.order}>
          ${head}
          <div className="card mt-2 space-y-1 p-3">
            <div className="flex justify-between text-sm"><span className="f-title">${m.label}</span>
              <span className="muted">${m.played ? "played" : m.time ? new Date(m.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "scheduled"}</span></div>
            ${side(m.red, "t-red", m.played && rs > bs)}
            ${side(m.blue, "t-blue", m.played && bs > rs)}
          </div>
        </div>`;
      })}
    </div>`;
}
