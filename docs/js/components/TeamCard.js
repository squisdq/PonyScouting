import { html } from "../html.js";
import { DRIVING_STYLES, TEXT_FIELDS } from "../constants.js";
import FieldCanvas from "./FieldCanvas.js";

const f1 = (v) => (v == null ? "—" : v.toFixed(1));

function Stars({ value }) {
  return html`<span className="inline-flex text-xl leading-none" aria-label=${`${value} out of 5`}>
    ${[1, 2, 3, 4, 5].map((n) => html`<span key=${n} className=${n <= value ? "star-on" : "star-off"}>★</span>`)}
  </span>`;
}

const hasField = (m) => Boolean(m && (m.start || m.path?.length || m.zones?.length));

export default function TeamCard({ team, ftc, an, onEdit, onDelete, onField }) {
  const filled = TEXT_FIELDS.filter((f) => team[f.key]?.trim());
  const scouted = team.style || team.skill;

  return html`
    <article className="card flex flex-col p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="f-title accent text-5xl leading-none">${team.number}</p>
          <h3 className="f-title mt-1 truncate text-xl">${team.name || "no name"}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1 text-sm">
          <button onClick=${onField} className="ghost-btn">field</button>
          <button onClick=${onEdit} className="ghost-btn">edit</button>
          <button onClick=${onDelete} className="ghost-btn danger">delete</button>
        </div>
      </header>

      ${(ftc || an) && html`<p className="mt-2 flex flex-wrap gap-1.5">
        ${ftc?.rank != null && html`<span className="tag">Rank ${ftc.rank}</span>`}
        ${ftc?.w != null && html`<span className="tag">${ftc.w}-${ftc.l ?? 0}-${ftc.t ?? 0}</span>`}
        ${an?.opr?.np != null && html`<span className="tag">OPR ${f1(an.opr.np)}</span>`}
        ${an?.ci != null && html`<span className="tag">Cons. ${an.ci}</span>`}
      </p>`}

      ${scouted
        ? html`<div className="inset mt-3 flex items-center justify-between rounded-xl px-3 py-2">
            ${team.style ? html`<span className="chip" style=${{ background: DRIVING_STYLES[team.style] }}>${team.style}</span>` : html`<span className="muted text-sm">style not set</span>`}
            <${Stars} value=${team.skill || 0} />
          </div>`
        : html`<p className="muted mt-3 text-sm">Not scouted yet — tap “edit”.</p>`}

      ${team.scoreTypes?.length > 0 && html`<p className="mt-2 flex flex-wrap gap-1.5">
        ${team.scoreTypes.map((s) => html`<span key=${s} className="tag">${s}</span>`)}
      </p>`}

      ${filled.length > 0 && html`
        <dl className="mt-3 space-y-2.5 text-base">
          ${filled.map((f) => html`
            <div key=${f.key} className=${f.key === "notes" ? "note p-2.5" : ""}>
              <dt className="muted text-sm">${f.label}</dt>
              <dd className="whitespace-pre-wrap">${team[f.key]}</dd>
            </div>`)}
        </dl>`}

      ${hasField(team.fieldMap) && html`<button onClick=${onField} className="mt-3 block w-full" aria-label="Open field">
        <${FieldCanvas} value=${team.fieldMap} readOnly=${true} />
      </button>`}
    </article>`;
}
