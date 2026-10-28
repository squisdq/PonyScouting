import { html, useState, useEffect } from "../html.js";
import Modal from "./Modal.js";

const UPDATED = "12 October 2026";
const LEGAL = {
  terms: {
    title: "Terms of use",
    body: [
      `Version of ${UPDATED}.`,
      "Pony Scouting is an unofficial, free tool for team scouting in FIRST Tech Challenge. It is not affiliated with or endorsed by FIRST®. FIRST® and FIRST® Tech Challenge are trademarks of their owners.",
      "The app is provided “as is”, without warranties. We do not guarantee uninterrupted operation, data safety or the accuracy of calculations (OPR, EPA, consistency, alliance suggestions). These are helper estimates, not official competition results; the alliance selection decisions are yours.",
      "You are responsible for the data you enter. Do not enter personal data (names, contacts, photos of people, especially minors) or offensive remarks: write only about robots and the game. We may delete data that breaks these rules.",
      "Access to a team's data is granted by an access code. Anyone who knows the code can read and change all of the team's data. Keep the code and share it only with your team. A lost code cannot be recovered.",
      "It is forbidden to try to access other people's data, guess codes, overload the service or use it for unlawful purposes.",
      "We may change or discontinue the app and change these terms. By continuing to use the app you accept the current version.",
      "Contact the author: [your e-mail or Telegram].",
    ],
  },
  privacy: {
    title: "Privacy",
    body: [
      `Version of ${UPDATED}.`,
      "What we store on the server (Google Firebase / Firestore): your team's name and number, the access code, and everything you enter: sessions, scouting cards of other teams, notes, drawings on the field, the alliance pick list. There is no registration by e-mail or phone.",
      "What is stored on your device (in the browser): the list of your teams with access codes, the theme choice, an offline copy of the data and a cache of FTCScout responses. To remove it, leave the team in the app or clear the site data in your browser settings.",
      "The app uses no advertising and no analytics trackers. Data is not sold or passed to third parties, except the infrastructure the service runs on (Google Firebase, GitHub Pages) and the public FTCScout API, which only receives requests for event and team numbers.",
      "Data kept by Google is governed by Google's own terms and privacy policy.",
      "To delete a team's data from the server, delete the sessions in the app or contact the author (see the terms of use).",
    ],
  },
  data: {
    title: "Data sources",
    body: [
      "The schedule, match results, rankings and team statistics come from the public FTCScout API (ftcscout.org), which in turn uses FIRST data. We show them as they are: delays and errors are possible, and FIRST results are the official source.",
      "OPR, EPA, consistency and trend are calculated by the app itself from played matches and may differ from values on other sites. Early in an event there is little data, so the estimates are rough.",
      "FTCScout has no connection to this app and is not responsible for how it works.",
    ],
  },
  install: {
    title: "Install and offline use",
    body: [
      "Open the site once while you have internet and wait for it to load fully: the app will save itself on your device. After that it opens and works without a connection.",
      "iPhone / iPad (Safari): Share → Add to Home Screen. Android (Chrome): menu ⋮ → Install app or Add to Home screen. It then launches like a normal app, without the address bar.",
      "Offline you can open sessions, view and add team cards and draw on the field. Everything is saved on the device and sent to the server when internet is back. FTCScout data is shown from the last download; refresh it while you are online to keep it current.",
      "If there are two or more of you, you will see each other's changes only after both devices get online.",
    ],
  },
};

export default function Footer() {
  const [open, setOpen] = useState(null);
  const [prompt, setPrompt] = useState(null);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const link = (k, text) => html`<button className="link underline" onClick=${() => setOpen(k)}>${text}</button>`;
  return html`
    <footer className="mx-auto max-w-5xl px-5 pb-24 pt-6 text-center text-sm">
      <p className="muted">Pony Scouting — an unofficial FIRST Tech Challenge scouting tool. Not affiliated with FIRST® or FTCScout.</p>
      <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
        ${link("terms", "Terms of use")}${link("privacy", "Privacy")}${link("data", "Data sources")}${link("install", "Install & offline")}
        ${prompt && html`<button className="btn2" onClick=${() => { prompt.prompt(); setPrompt(null); }}>Install app</button>`}
      </p>
      ${open && html`<${Modal} title=${LEGAL[open].title} onClose=${() => setOpen(null)}>
        <div className="space-y-3 text-left">${LEGAL[open].body.map((p, i) => html`<p key=${i}>${p}</p>`)}</div>
      <//>`}
    </footer>`;
}
