import "./offline.js";
import { html, React, createRoot } from "./html.js";
import App from "./App.js";

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return html`<div style=${{ padding: "2rem", maxWidth: "40rem" }}>
      <h2>Something went wrong</h2>
      <pre style=${{ whiteSpace: "pre-wrap" }}>${String(this.state.err?.message || this.state.err)}</pre>
      <button onClick=${() => window.__reset?.() ?? location.reload()} style=${{ padding: ".7rem 1rem" }}>Reset cache and reload</button>
    </div>`;
  }
}

const root = document.getElementById("root");
createRoot(root).render(html`<${Boundary}><${App} /><//>`);
requestAnimationFrame(() => { root.dataset.ready = "1"; });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      const reg = await navigator.serviceWorker.ready;
      const urls = performance.getEntriesByType("resource").map((r) => r.name).filter((u) => u.startsWith("http"));
      reg.active?.postMessage({ type: "CACHE", urls });
    } catch (e) {
      console.warn("Service worker:", e);
    }
  });
}
