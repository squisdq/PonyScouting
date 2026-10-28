import { html, useState, useMemo } from "../html.js";
import { KEY_LABEL } from "../analytics.js";

const f1 = (v) => (v == null ? "—" : v.toFixed(1));

function Spark({ pts, slope }) {
  if (pts.length < 2) return html`<p className="muted text-sm">At least 2 matches are needed for a chart.</p>`;
  const W = 320, H = 110, p = 10;
  const ys = pts.map((q) => q.contrib), lo = Math.min(...ys, 0), hi = Math.max(...ys, 1);
  const x = (i) => p + (i * (W - 2 * p)) / (pts.length - 1);
  const y = (v) => H - p - ((v - lo) / (hi - lo || 1)) * (H - 2 * p);
  const m = ys.reduce((a, b) => a + b, 0) / ys.length;
  const b0 = m - (slope * (pts.length - 1)) / 2;
  return html`<svg viewBox=${`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Contribution per match">
    <line x1=${x(0)} y1=${y(b0)} x2=${x(pts.length - 1)} y2=${y(b0 + slope * (pts.length - 1))} style=${{ stroke: "var(--accent)" }} strokeWidth="2" strokeDasharray="5 4" />
    <polyline points=${pts.map((q, i) => `${x(i).toFixed(1)},${y(q.contrib).toFixed(1)}`).join(" ")} fill="none" stroke="#ff008c" strokeWidth="2.5" />
    ${pts.map((q, i) => html`<circle key=${i} cx=${x(i)} cy=${y(q.contrib)} r="3.5" fill="#ff008c" />`)}
  </svg>`;
}

export default function AnalyticsTab({ A, nameOf, our }) {
  const [sort, setSort] = useState({ k: "np", dir: -1 });
  const [sel, setSel] = useState(null);
  const get = (t, k) => (k === "epa" ? t.epa : k === "ci" ? t.ci : k === "slope" ? t.slope : k === "n" ? t.n : t.opr[k]);
  const rows = useMemo(() => [...A.teams.values()].sort((a, b) => ((get(a, sort.k) ?? -1e9) - (get(b, sort.k) ?? -1e9)) * sort.dir), [A, sort]);
  if (!rows.length) return html`<p className="card p-8 text-center text-lg">Played matches are needed. Analytics will appear once the first games have been played.</p>`;

  const th = (k, text) => html`<th onClick=${() => setSort((s) => ({ k, dir: s.k === k ? -s.dir : -1 }))}>${text}${sort.k === k ? (sort.dir < 0 ? " ▾" : " ▴") : ""}</th>`;
  const t = sel != null ? A.teams.get(sel) : null;
  return html`
    <div className="space-y-4">
      <p className="muted text-sm">Matches used: ${A.used}. The more matches, the more accurate the estimates. Tap a row to see the chart.</p>
      <div className="card scroll-x p-2">
        <table className="tbl">
          <thead><tr>${th("n", "Team")}${th("np", "OPR")}${th("epa", "EPA")}
            ${A.keys.includes("auto") && th("auto", "Auto")}${A.keys.includes("dc") && th("dc", "TeleOp")}${A.keys.includes("eg") && th("eg", "End")}
            ${th("ci", "Cons.")}${th("slope", "Trend")}<th>M</th></tr></thead>
          <tbody>
            ${rows.map((r) => html`<tr key=${r.n} className=${sel === r.n ? "sel" : ""} onClick=${() => setSel(sel === r.n ? null : r.n)} style=${{ cursor: "pointer" }}>
              <td><span className=${`f-title ${r.n === our ? "accent" : ""}`}>${r.n}</span> <span className="muted">${nameOf(r.n)}</span></td>
              <td>${f1(r.opr.np)}</td><td>${f1(r.epa)}</td>
              ${A.keys.includes("auto") && html`<td>${f1(r.opr.auto)}</td>`}${A.keys.includes("dc") && html`<td>${f1(r.opr.dc)}</td>`}${A.keys.includes("eg") && html`<td>${f1(r.opr.eg)}</td>`}
              <td>${r.ci ?? "—"}</td>
              <td>${r.series.length >= 3 ? html`<span style=${{ color: r.slope >= 0 ? "#00af73" : "#ff0046" }}>${r.slope >= 0 ? "▲" : "▼"} ${Math.abs(r.slope).toFixed(1)}</span>` : "—"}</td>
              <td>${r.matches}</td></tr>`)}
          </tbody>
        </table>
      </div>

      ${t && html`<div className="card space-y-2 p-4">
        <h3 className="f-title text-2xl"><span className="accent">${t.n}</span> ${nameOf(t.n)}</h3>
        <p className="flex flex-wrap gap-1.5">
          ${A.keys.map((k) => html`<span key=${k} className="tag">${KEY_LABEL[k]} OPR ${f1(t.opr[k])}</span>`)}
          <span className="tag">EPA ${f1(t.epa)}</span>
          ${t.ci != null && html`<span className="tag">Consistency ${t.ci}/100</span>`}
          ${t.series.length >= 2 && html`<span className="tag">σ ${f1(t.sd)} pts</span>`}
        </p>
        <p className="muted text-sm">Contribution in each match (alliance score − partner OPR) and the trend line:</p>
        <${Spark} pts=${t.series} slope=${t.slope} />
      </div>`}

      <div className="muted space-y-1 text-sm">
        <p><b>OPR</b> — a team's contribution to alliance points, solved by least squares over played qualification matches (Auto / TeleOp / End — by component, if present in the data).</p>
        <p><b>EPA</b> — our own online contribution estimate: updated after every match by the prediction error, so it reacts more to recent form. It is not the official Statbotics metric.</p>
        <p><b>Consistency</b> = 100 × (1 − σ/mean) of the per-match contribution (higher is more predictable). <b>Trend</b> — slope of the line in points per match.</p>
      </div>
    </div>`;
}
