import { html, useState } from "../html.js";

export default function ThemeToggle() {
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    setDark(next);
  };

  return html`<button onClick=${toggle} aria-label="Toggle theme" className="fab">${dark ? "☀️" : "🌙"}</button>`;
}
