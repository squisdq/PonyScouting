import { html, React, useState, useEffect } from "./html.js";
import { loadWorkspaces, saveWorkspaces, getActiveCode, setActiveCode } from "./workspace.js";
import AuthScreen from "./components/AuthScreen.js";
import SessionList from "./components/SessionList.js";
import SessionView from "./components/SessionView.js";
import ThemeToggle from "./components/ThemeToggle.js";
import Footer from "./components/Footer.js";
import Onboarding from "./components/Onboarding.js";

const readHash = () => window.location.hash.match(/^#\/s\/(.+)$/)?.[1] ?? null;

export default function App() {
  const [list, setList] = useState(loadWorkspaces);
  const [active, setActive] = useState(getActiveCode);
  const [sessionId, setSessionId] = useState(readHash);
  const [guide, setGuide] = useState(() => { try { return !localStorage.getItem("pony.guide"); } catch { return false; } });
  const closeGuide = () => { try { localStorage.setItem("pony.guide", "1"); } catch {} setGuide(false); };

  useEffect(() => {
    const onChange = () => setSessionId(readHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const ws = list.find((w) => w.code === active) ?? null;
  const commit = (l, a) => { saveWorkspaces(l); setActiveCode(a); setList(l); setActive(a); window.location.hash = ""; };
  const enter = (w) => commit([...list.filter((x) => x.code !== w.code), w], w.code);
  const switchTo = (code) => commit(list, code);
  const leave = (code) => { const l = list.filter((w) => w.code !== code); commit(l, l[0]?.code ?? null); };

  const page = !ws
    ? html`<${AuthScreen} onEnter=${enter} />`
    : sessionId
    ? html`<${SessionView} key=${ws.code + sessionId} ws=${ws} sessionId=${sessionId} onBack=${() => (window.location.hash = "")} />`
    : html`<${SessionList} ws=${ws} workspaces=${list} onOpen=${(id) => (window.location.hash = `#/s/${id}`)}
             onEnter=${enter} onSwitch=${switchTo} onLeave=${leave} />`;

  return html`<${React.Fragment}>${page}<${Footer} onGuide=${() => setGuide(true)} /><${ThemeToggle} />${guide && html`<${Onboarding} onClose=${closeGuide} />`}<//>`;
}
