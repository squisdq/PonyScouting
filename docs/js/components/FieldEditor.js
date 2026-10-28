import { html, useState } from "../html.js";
import { db, doc, serverTimestamp, setDoc } from "../firebase.js";
import Modal from "./Modal.js";
import FieldCanvas from "./FieldCanvas.js";

const MODES = [["start", "Start"], ["path", "Path"], ["zone", "Pickup zones"]];
const HINT = {
  start: "Tap the field to place the autonomous start point.",
  path: "Drag a finger (or the mouse) across the field to draw the driving path.",
  zone: "Tap the field to mark a zone where the team picks up game elements (up to 12 marks).",
};

export default function FieldEditor({ path, team, onClose }) {
  const [fm, setFm] = useState(team.fieldMap || { start: null, path: [], zones: [] });
  const [mode, setMode] = useState("path");

  const save = () => {
    setDoc(doc(db, ...path, "teams", String(team.number)), { fieldMap: fm, updatedAt: serverTimestamp() }, { merge: true })
      .catch((e) => window.alert("Could not save: " + e.message));
    onClose();
  };

  return html`
    <${Modal} title=${`Field · team ${team.number}`} onClose=${onClose}>
      <div className="space-y-3">
        <div className="seg" style=${{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          ${MODES.map(([k, t]) => html`<button key=${k} onClick=${() => setMode(k)} className=${`tab ${mode === k ? "tab-on" : ""}`}>${t}</button>`)}
        </div>
        <p className="muted text-sm">${HINT[mode]}</p>
        <${FieldCanvas} value=${fm} onChange=${setFm} mode=${mode} />
        <div className="flex flex-wrap gap-2">
          <button onClick=${() => setFm({ ...fm, start: null })} className="btn2">Clear start</button>
          <button onClick=${() => setFm({ ...fm, path: [] })} className="btn2">Clear path</button>
          <button onClick=${() => setFm({ ...fm, zones: [] })} className="btn2">Clear zones</button>
        </div>
        <button onClick=${save} className="btn w-full">Save</button>
      </div>
    <//>`;
}
