import { html } from "../html.js";

const f1 = (v) => (v == null ? "—" : v.toFixed(1));

export default function RankingsTab({ teams, cardMap }) {
  if (!teams.length) return html`<p className="card p-8 text-center text-lg">The event's team list is empty for now.</p>`;
  const sorted = [...teams].sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9) || (b.opr ?? 0) - (a.opr ?? 0) || a.number - b.number);
  return html`
    <div className="card scroll-x p-2">
      <table className="tbl">
        <thead><tr><th>#</th><th>Team</th><th>RP</th><th>TBP</th><th>W-L-T</th><th>OPR</th><th>Avg</th><th>★</th></tr></thead>
        <tbody>
          ${sorted.map((t) => html`<tr key=${t.number}>
            <td>${t.rank ?? "—"}</td>
            <td><span className="f-title">${t.number}</span> ${t.name}</td>
            <td>${f1(t.rp)}</td><td>${f1(t.tb)}</td>
            <td>${t.w != null ? `${t.w}-${t.l ?? 0}-${t.t ?? 0}` : "—"}</td>
            <td>${f1(t.opr)}</td><td>${f1(t.avg)}</td>
            <td>${cardMap.get(t.number)?.skill || ""}</td>
          </tr>`)}
        </tbody>
      </table>
    </div>`;
}
