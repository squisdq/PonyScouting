import { html, useState } from "../html.js";
import { registerWorkspace, findWorkspace, fmtCode } from "../workspace.js";

export default function AuthScreen({ onEnter, compact }) {
  const [mode, setMode] = useState("join");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  const run = async (fn) => {
    setBusy(true); setError("");
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const join = (e) => { e.preventDefault(); run(async () => onEnter(await findWorkspace(code))); };
  const register = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    run(async () => setCreated(await registerWorkspace(name.trim(), /^\d+$/.test(number.trim()) ? Number(number.trim()) : null)));
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(fmtCode(created.code)); setCopied(true); } catch { setError("Could not copy — select the code manually."); }
  };
  const share = () => navigator.share?.({ title: "Pony Scouting", text: `Access code for team ${created.name}: ${fmtCode(created.code)}` }).catch(() => {});

  const wrap = compact ? "" : "mx-auto max-w-lg px-5 pb-16 pt-14";
  return html`
    <div className=${wrap}>
      ${!compact && html`<header className="mb-8">
        <h1 className="f-title text-5xl leading-tight sm:text-6xl">Pony Scouting</h1>
        <p className="mt-2 text-xl">sign in with your team code or register a new team</p>
      </header>`}

      ${created
        ? html`<div className="card space-y-4 p-5">
            <h2 className="f-title text-2xl">Team “${created.name}” created</h2>
            <p>Your team's access code:</p>
            <p className="code-box card p-4 text-center text-3xl">${fmtCode(created.code)}</p>
            <div className="flex flex-wrap gap-2">
              <button onClick=${copy} className="btn2">${copied ? "Copied ✓" : "Copy"}</button>
              ${navigator.share && html`<button onClick=${share} className="btn2">Share</button>`}
            </div>
            <p className="note p-3 text-sm">Save the code and share it with your team. It cannot be recovered. Anyone who knows the code can see and change all of your team's data.</p>
            ${error && html`<p className="err p-3 text-sm">${error}</p>`}
            <button onClick=${() => onEnter(created)} className="btn w-full">Continue</button>
          </div>`
        : html`<div className="space-y-4">
            <div className="seg">
              <button onClick=${() => setMode("join")} className=${`tab ${mode === "join" ? "tab-on" : ""}`}>Sign in with code</button>
              <button onClick=${() => setMode("register")} className=${`tab ${mode === "register" ? "tab-on" : ""}`}>New team</button>
            </div>
            ${mode === "join"
              ? html`<form onSubmit=${join} className="card space-y-4 p-5">
                  <div>
                    <label className="label" htmlFor="code">Access code</label>
                    <input id="code" className="input code-box" placeholder="ABCD-EFGH-JKLM" autoCapitalize="characters" autoComplete="off"
                           value=${code} onChange=${(e) => setCode(e.target.value)} />
                  </div>
                  ${error && html`<p className="err p-3 text-sm">${error}</p>`}
                  <button disabled=${busy || !code.trim()} className="btn w-full">${busy ? "Checking…" : "Sign in"}</button>
                </form>`
              : html`<form onSubmit=${register} className="card space-y-4 p-5">
                  <div>
                    <label className="label" htmlFor="wname">Team name</label>
                    <input id="wname" className="input" value=${name} onChange=${(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="wnum">FTC team number (optional)</label>
                    <input id="wnum" className="input" inputMode="numeric" pattern="[0-9]*" placeholder="12345" value=${number} onChange=${(e) => setNumber(e.target.value)} />
                  </div>
                  ${error && html`<p className="err p-3 text-sm">${error}</p>`}
                  <button disabled=${busy || !name.trim()} className="btn w-full">${busy ? "Creating…" : "Get access code"}</button>
                  <p className="muted text-sm">Registration and the first sign-in need internet. After that the app works without a connection.</p>
                </form>`}
          </div>`}
    </div>`;
}
