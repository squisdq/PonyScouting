import { useState, useEffect } from "./html.js";
import { loadTeams, loadMatches } from "./ftcscout.js";

export function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);
  return on;
}

export function useEventData(event) {
  const [st, setSt] = useState({ teams: [], matches: [], loading: false, error: "", stale: false, t: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!event) { setSt({ teams: [], matches: [], loading: false, error: "", stale: false, t: 0 }); return; }
    let dead = false;
    (async () => {
      setSt((s) => ({ ...s, loading: true, error: "" }));
      try {
        const [t, m] = await Promise.all([loadTeams(event.season, event.code), loadMatches(event.season, event.code)]);
        if (!dead) setSt({ teams: t.items, matches: m.items, loading: false, error: "", stale: t.stale || m.stale, t: Math.min(t.t, m.t) });
      } catch (e) {
        if (!dead) setSt((s) => ({ ...s, loading: false, error: e.message }));
      }
    })();
    return () => { dead = true; };
  }, [event?.season, event?.code, tick]);

  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) setTick((x) => x + 1); }, 120000);
    return () => clearInterval(id);
  }, []);

  return { ...st, reload: () => setTick((x) => x + 1) };
}
