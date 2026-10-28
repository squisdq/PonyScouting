export const KEYS = ["np", "auto", "dc", "eg"];
export const KEY_LABEL = { np: "Total", auto: "Auto", dc: "TeleOp", eg: "End" };
const KEY_WHERE = { auto: "autonomous", dc: "TeleOp", eg: "the endgame", np: "total score" };

function solve(A, b) {
  const n = b.length;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]];
    const d = A[i][i] || 1e-9;
    for (let r = i + 1; r < n; r++) {
      const f = A[r][i] / d;
      if (!f) continue;
      for (let c = i; c < n; c++) A[r][c] -= f * A[i][c];
      b[r] -= f * b[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let c = i + 1; c < n; c++) s -= A[i][c] * x[c];
    x[i] = s / (A[i][i] || 1e-9);
  }
  return x;
}

export function oprOf(rows, key, idx, lambda = 0.05) {
  const n = idx.size;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  for (const r of rows) {
    const ids = r.teams.map((t) => idx.get(t));
    for (const i of ids) { b[i] += r.s[key]; for (const j of ids) A[i][j] += 1; }
  }
  for (let i = 0; i < n; i++) A[i][i] += lambda;
  return solve(A, b);
}

const sum = (a) => a.reduce((x, y) => x + y, 0);
const mean = (a) => (a.length ? sum(a) / a.length : 0);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((v) => (v - m) ** 2))); };

export function analyze(matches) {
  const played = (matches || []).filter((m) => m.played && m.red.score && m.blue.score);
  const quals = played.filter((m) => m.level === "Quals");
  const use = (quals.length ? quals : played).slice().sort((a, b) => a.order - b.order);

  const rows = [];
  use.forEach((m, mi) => ["red", "blue"].forEach((sd_) => {
    const side = m[sd_];
    if (side.teams.some((t) => t.dq)) return;
    const teams = side.teams.filter((t) => !t.off).map((t) => t.n);
    if (teams.length && side.score.np != null) rows.push({ teams, s: side.score, mi, m });
  }));

  const ids = [...new Set(rows.flatMap((r) => r.teams))].sort((a, b) => a - b);
  const idx = new Map(ids.map((n, i) => [n, i]));
  const teams = new Map(ids.map((n) => [n, { n, matches: 0, opr: {}, epa: 0, series: [], mean: 0, sd: 0, ci: null, slope: 0 }]));

  const opr = {};
  for (const k of KEYS) {
    const rs = rows.filter((r) => r.s[k] != null);
    if (!rs.length) continue;
    opr[k] = oprOf(rs, k, idx);
    ids.forEach((n, i) => { teams.get(n).opr[k] = opr[k][i]; });
  }

  const epa = new Map(ids.map((n) => [n, mean(rows.map((r) => r.s.np)) / 2 || 0]));
  const cnt = new Map(ids.map((n) => [n, 0]));
  for (const r of rows) {
    const err = r.s.np - sum(r.teams.map((t) => epa.get(t)));
    for (const t of r.teams) {
      const c = cnt.get(t) + 1;
      cnt.set(t, c);
      epa.set(t, epa.get(t) + (Math.max(0.06, 0.45 / Math.sqrt(c)) * err) / r.teams.length);
    }
  }
  ids.forEach((n) => { teams.get(n).epa = epa.get(n); teams.get(n).matches = cnt.get(n); });

  if (opr.np) {
    for (const r of rows) {
      for (const t of r.teams) {
        const partners = r.teams.filter((x) => x !== t).map((x) => opr.np[idx.get(x)]);
        teams.get(t).series.push({ label: r.m.label, contrib: r.s.np - sum(partners) });
      }
    }
    for (const t of teams.values()) {
      const ys = t.series.map((p) => p.contrib);
      t.mean = mean(ys); t.sd = sd(ys);
      if (ys.length >= 3 && t.mean > 0) t.ci = Math.round(100 * Math.max(0, 1 - t.sd / t.mean));
      if (ys.length >= 3) {
        const xm = (ys.length - 1) / 2;
        const num = sum(ys.map((y, i) => (i - xm) * (y - t.mean)));
        const den = sum(ys.map((_, i) => (i - xm) ** 2)) || 1;
        t.slope = num / den;
      }
    }
  }

  const dist = {};
  for (const k of KEYS) {
    if (!opr[k]) continue;
    const v = ids.map((n) => teams.get(n).opr[k]);
    dist[k] = { mean: mean(v), sd: sd(v) || 1 };
  }
  return { teams, dist, used: use.length, keys: KEYS.filter((k) => opr[k]) };
}

export const z = (A, t, k) => (t?.opr?.[k] != null && A.dist[k] ? (t.opr[k] - A.dist[k].mean) / A.dist[k].sd : 0);

export function suggest(A, ourNumber, exclude, cardMap) {
  const our = A.teams.get(ourNumber);
  if (!our) return [];
  const comps = ["auto", "dc", "eg"].filter((k) => A.dist[k]);
  const ks = comps.length ? comps : ["np"];
  const w = Object.fromEntries(ks.map((k) => [k, Math.max(0, -z(A, our, k)) + 0.25]));
  const wsum = sum(Object.values(w));
  const out = [];
  for (const t of A.teams.values()) {
    if (t.n === ourNumber || exclude.has(t.n)) continue;
    const fit = sum(ks.map((k) => w[k] * z(A, t, k))) / wsum;
    const skill = cardMap?.get(t.n)?.skill || 0;
    const score = 0.65 * fit + 0.35 * z(A, t, "np") + (t.ci != null ? 0.004 * (t.ci - 50) : 0) + (skill ? 0.12 * (skill - 3) : 0);
    const reasons = ks.filter((k) => z(A, t, k) > 0.5).sort((a, b) => w[b] * z(A, t, b) - w[a] * z(A, t, a)).slice(0, 2).map((k) => {
      const weak = z(A, our, k) < -0.2;
      return `strong in ${KEY_WHERE[k]} (${z(A, t, k) >= 0 ? "+" : ""}${z(A, t, k).toFixed(1)}σ)${weak ? ", where we are weaker" : ""}`;
    });
    if (t.ci != null && t.ci >= 70) reasons.push("consistent from match to match");
    out.push({ n: t.n, score, reasons });
  }
  return out.sort((a, b) => b.score - a.score);
}

export const zColor = (v) => (v >= 0 ? `rgba(0,175,115,${Math.min(0.55, v * 0.25)})` : `rgba(255,0,70,${Math.min(0.55, -v * 0.25)})`);
