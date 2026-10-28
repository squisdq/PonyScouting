import { html, useState } from "../html.js";
import { db, doc, serverTimestamp, setDoc } from "../firebase.js";
import { DRIVING_STYLES, EMPTY_TEAM, SCORE_TYPES, TEXT_FIELDS } from "../constants.js";

export default function TeamForm({ path, initial, existingNumbers, onDone }) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({ ...EMPTY_TEAM, ...(initial ? { style: "", skill: 0, scoreTypes: [] } : {}), ...(initial ?? {}) });
  const [error, setError] = useState("");

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleType = (s) => set("scoreTypes", form.scoreTypes?.includes(s) ? form.scoreTypes.filter((x) => x !== s) : [...(form.scoreTypes || []), s]);

  const submit = (e) => {
    e.preventDefault();
    const number = String(form.number).trim();
    if (!/^\d+$/.test(number)) return setError("Team number must contain digits only.");
    if (!isEdit && existingNumbers.includes(number)) return setError(`Team ${number} is already in this session.`);
    const { id, ...data } = form;
    setDoc(doc(db, ...path, "teams", number), { ...data, number: Number(number), name: form.name.trim(), updatedAt: serverTimestamp() }, { merge: true })
      .catch((err) => window.alert("Could not save: " + err.message));
    onDone();
  };

  return html`
    <form onSubmit=${submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="num">Number</label>
          <input id="num" required autoFocus=${!isEdit} disabled=${isEdit} inputMode="numeric" pattern="[0-9]*"
                 className="input" placeholder="12345" value=${form.number} onChange=${(e) => set("number", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label" htmlFor="tname">Team name</label>
          <input id="tname" className="input" value=${form.name} onChange=${(e) => set("name", e.target.value)} />
        </div>
      </div>

      <div>
        <span className="label">Driving style</span>
        <div className="grid grid-cols-2 gap-2">
          ${Object.keys(DRIVING_STYLES).map((s) => html`
            <button type="button" key=${s} onClick=${() => set("style", s)} className=${`opt ${form.style === s ? "opt-on" : ""}`}>${s}</button>`)}
        </div>
      </div>

      <div>
        <span className="label">Driving skill: ${form.skill ? `${form.skill} out of 5` : "—"}</span>
        <div className="flex gap-1">
          ${[1, 2, 3, 4, 5].map((n) => html`
            <button type="button" key=${n} onClick=${() => set("skill", n)} aria-label=${`${n} out of 5`}
              className=${`text-4xl leading-none ${n <= form.skill ? "star-on" : "star-off"}`}>★</button>`)}
        </div>
      </div>

      <div>
        <span className="label">Scoring types (select any)</span>
        <div className="flex flex-wrap gap-2">
          ${SCORE_TYPES.map((s) => { const on = form.scoreTypes?.includes(s); return html`
            <button type="button" key=${s} aria-pressed=${on} onClick=${() => toggleType(s)} className=${`opt ${on ? "opt-on" : ""}`}>${s}</button>`; })}
        </div>
      </div>

      ${TEXT_FIELDS.map((f) => html`
        <div key=${f.key}>
          <label className="label" htmlFor=${f.key}>${f.label}</label>
          <textarea id=${f.key} rows="2" className="input" placeholder=${f.hint}
                    value=${form[f.key]} onChange=${(e) => set(f.key, e.target.value)}></textarea>
        </div>`)}

      ${error && html`<p className="err p-3 text-sm">${error}</p>`}

      <button className="btn w-full">${isEdit ? "Save changes" : "Add team"}</button>
    </form>`;
}
