import { html, useState } from "../html.js";
import Modal from "./Modal.js";

const STEPS = [
  { img: "1-team", title: "Create or join your team", text: "Register your team to get an access code, or sign in with a code a teammate shared. Only people with the code can see your data. Save the code: it cannot be recovered." },
  { img: "2-session", title: "Make a session for each event", text: "Tap “Create new session” and name it after the competition. Everything you scout at that event lives inside it." },
  { img: "3-link", title: "Link the event from FTCScout", text: "Open a session, tap “Link FTCScout competition”, pick the season and search for the event. Teams are added as cards, and Matches, Rankings and Analytics fill in." },
  { img: "4-scout", title: "Scout robots while you watch", text: "Tap “edit” on a team card: driving style and skill, scoring types (Flower, Pollen, Nectar), autonomous, intake, endgame and breakdowns. Your whole team sees the updates." },
  { img: "5-field", title: "Draw on the field", text: "Tap “field” on a card to mark the autonomous start, the driving path and the pickup zones." },
  { img: "6-alliance", title: "Plan your alliance", text: "Analytics shows OPR, EPA and consistency. In Alliance, drag teams into your pick list and see partners who cover your weak spots." },
  { img: "7-offline", title: "Works without Wi-Fi", text: "Open the site once online, then add it to your home screen. Offline, your notes are saved on the device and sync when you are back online." },
];

export default function Onboarding({ onClose }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return html`
    <${Modal} title="How Pony Scouting works" onClose=${onClose}>
      <div className="space-y-3">
        <img src=${`./img/guide/${step.img}.png`} alt=${step.title} className="w-full rounded-xl" />
        <h3 className="f-title text-2xl">${i + 1}. ${step.title}</h3>
        <p>${step.text}</p>
        <div className="flex justify-center gap-1.5">
          ${STEPS.map((_, k) => html`<span key=${k} className="h-2 w-2 rounded-full" style=${{ background: k === i ? "var(--accent)" : "var(--star-off)" }}></span>`)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button onClick=${() => setI(i - 1)} disabled=${i === 0} className="btn2">Back</button>
          <button onClick=${onClose} className="ghost-btn">Skip</button>
          <button onClick=${() => (last ? onClose() : setI(i + 1))} className="btn btn-sm">${last ? "Got it" : "Next"}</button>
        </div>
      </div>
    <//>`;
}
