import { html, React } from "../html.js";

export default function FieldCanvas({ value, onChange, mode = "path", readOnly }) {
  const v = value || { start: null, path: [], zones: [] };
  const svg = React.useRef(null);
  const buf = React.useRef(null);
  const cur = React.useRef(v);
  cur.current = v;

  const pt = (e) => {
    const r = svg.current.getBoundingClientRect();
    return { x: Math.round(((e.clientX - r.left) / r.width) * 1000), y: Math.round(((e.clientY - r.top) / r.height) * 1000) };
  };
  const down = (e) => {
    if (readOnly) return;
    const p = pt(e);
    if (mode === "start") onChange({ ...cur.current, start: p });
    else if (mode === "zone") onChange({ ...cur.current, zones: [...(cur.current.zones || []), p].slice(-12) });
    else { buf.current = [p]; svg.current.setPointerCapture?.(e.pointerId); onChange({ ...cur.current, path: [p] }); }
  };
  const move = (e) => {
    if (!buf.current) return;
    const p = pt(e), last = buf.current[buf.current.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 8 && buf.current.length < 300) {
      buf.current.push(p);
      onChange({ ...cur.current, path: [...buf.current] });
    }
  };
  const up = () => { buf.current = null; };

  const path = (v.path || []).map((p) => `${p.x},${p.y}`).join(" ");
  const end = v.path?.length > 1 ? v.path[v.path.length - 1] : null;
  return html`
    <div className="relative w-full overflow-hidden rounded-xl" style=${{ aspectRatio: "1 / 1" }}>
      <img src="./img/field.webp" alt="Field" draggable="false" className="absolute inset-0 h-full w-full select-none" />
      <svg ref=${svg} viewBox="0 0 1000 1000" className="absolute inset-0 h-full w-full"
           style=${{ touchAction: readOnly ? "auto" : "none" }}
           onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up}>
        ${(v.zones || []).map((z, i) => html`<circle key=${i} cx=${z.x} cy=${z.y} r="45" fill="rgba(255,190,0,.35)" stroke="#f5a300" strokeWidth="5" strokeDasharray="14 8" />`)}
        ${path && html`<polyline points=${path} fill="none" stroke="#ff008c" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />`}
        ${end && html`<circle cx=${end.x} cy=${end.y} r="14" fill="#ff008c" />`}
        ${v.start && html`<g><circle cx=${v.start.x} cy=${v.start.y} r="28" fill="#6f37a9" stroke="#fff" strokeWidth="6" />
          <text x=${v.start.x} y=${v.start.y + 10} textAnchor="middle" fontSize="30" fontWeight="700" fill="#fff">S</text></g>`}
      </svg>
    </div>`;
}
