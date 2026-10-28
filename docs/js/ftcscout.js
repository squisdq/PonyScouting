const BASE = "https://api.ftcscout.org/rest/v1";
const PFX = "ftcscout:";

function lsSet(key, val) {
  try { localStorage.setItem(key, val); return; } catch {}
  try {
    const items = Object.keys(localStorage).filter((k) => k.startsWith(PFX)).map((k) => {
      let t = 0; try { t = JSON.parse(localStorage.getItem(k)).t; } catch {}
      return [k, t];
    }).sort((a, b) => a[1] - b[1]);
    items.slice(0, Math.max(1, items.length >> 1)).forEach(([k]) => localStorage.removeItem(k));
    localStorage.setItem(key, val);
  } catch {}
}

export async function api(path, maxAge = 15000) {
  const key = PFX + path;
  let hit = null;
  try { hit = JSON.parse(localStorage.getItem(key)); } catch {}
  if (hit && Date.now() - hit.t < maxAge) return { data: hit.d, t: hit.t, stale: false };
  try {
    const r = await fetch(BASE + path);
    if (!r.ok) throw new Error(r.status === 404 ? "not found (404)" : `server error ${r.status}`);
    const d = await r.json();
    const t = Date.now();
    lsSet(key, JSON.stringify({ t, d }));
    return { data: d, t, stale: false };
  } catch (e) {
    if (hit) return { data: hit.d, t: hit.t, stale: true };
    throw new Error(e instanceof TypeError ? "no connection to FTCScout" : e.message);
  }
}

const normEvent = (e, season) => ({
  season: e.season ?? season,
  code: e.code,
  name: e.name,
  start: e.start ?? null,
  end: e.end ?? null,
  city: e.city ?? null,
  country: e.country ?? null,
});

export async function searchEvents(season, text) {
  const { data } = await api(`/events/search/${season}?searchText=${encodeURIComponent(text)}`, 60000);
  return (Array.isArray(data) ? data : []).map((e) => normEvent(e, season));
}
export async function getEvent(season, code) {
  const { data } = await api(`/events/${season}/${encodeURIComponent(code)}`, 60000);
  return normEvent(data, season);
}

const numOr = (v, d = null) => (typeof v === "number" && isFinite(v) ? v : d);

export function normTeams(raw) {
  return (Array.isArray(raw) ? raw : []).map((t) => {
    const s = t.stats || {}, o = s.opr || {}, a = s.avg || {};
    return {
      number: t.teamNumber ?? t.team?.number ?? t.number,
      name: t.team?.name ?? t.name ?? t.teamName ?? "",
      rank: numOr(s.rank), rp: numOr(s.rp ?? s.rankingPoints), tb: numOr(s.tb1 ?? s.tbp),
      w: numOr(s.wins), l: numOr(s.losses), t: numOr(s.ties), played: numOr(s.qualMatchesPlayed),
      opr: numOr(o.totalPointsNp ?? o.totalPoints), avg: numOr(a.totalPointsNp ?? a.totalPoints),
    };
  }).filter((t) => t.number != null);
}

function parts(s) {
  const n = (k) => numOr(s[k]);
  const egKey = Object.keys(s).find((k) => /^(eg|end)/i.test(k) && /points$/i.test(k) && typeof s[k] === "number");
  const total = n("totalPoints");
  return { total, np: n("totalPointsNp") ?? total, auto: n("autoPoints"), dc: n("dcPoints"), eg: egKey ? s[egKey] : null };
}

const LEVEL_RANK = { Quals: 0, Semis: 1, Finals: 3 };
export const LEVEL_LABEL = { Quals: "Qualification", Semis: "Semifinal", Finals: "Final", DoubleElim: "Playoffs" };

export function normMatches(raw) {
  const list = (Array.isArray(raw) ? raw : []).map((m) => {
    const side = (name) => ({
      teams: (m.teams || []).filter((t) => String(t.alliance).toLowerCase() === name)
        .sort((a, b) => String(a.station).localeCompare(String(b.station)))
        .map((t) => ({ n: t.teamNumber, dq: !!t.dq, off: t.onField === false })),
      score: m.scores?.[name] ? parts(m.scores[name]) : null,
    });
    const level = m.tournamentLevel ?? "Quals";
    const num = m.matchNum ?? m.id;
    return {
      id: m.id, level, num, series: m.series ?? 0,
      label: level === "Quals" ? `Q${num}` : (m.description || `${LEVEL_LABEL[level] ?? level} ${num}`),
      played: m.hasBeenPlayed ?? !!m.scores,
      time: m.actualStartTime ?? m.scheduledStartTime ?? null,
      red: side("red"), blue: side("blue"),
    };
  });
  list.sort((a, b) => (LEVEL_RANK[a.level] ?? 2) - (LEVEL_RANK[b.level] ?? 2) || a.series - b.series || a.num - b.num);
  list.forEach((m, i) => { m.order = i; });
  return list;
}

export async function loadTeams(season, code) {
  const { data, t, stale } = await api(`/events/${season}/${encodeURIComponent(code)}/teams`);
  return { items: normTeams(data), t, stale };
}
export async function loadMatches(season, code) {
  const { data, t, stale } = await api(`/events/${season}/${encodeURIComponent(code)}/matches`);
  return { items: normMatches(data), t, stale };
}
