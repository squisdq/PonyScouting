export const DRIVING_STYLES = {
  "Aggressive": "rgba(255,0,70,.25)",
  "Careful": "rgba(0,175,115,.25)",
  "Defensive": "rgba(50,110,255,.25)",
  "Passive": "rgba(130,125,140,.30)",
};

export const SCORE_TYPES = ["Flower", "Pollen", "Nectar"];

export const SEASONS = [
  { y: 2026, label: "2026–27 BIOBUZZ" },
  { y: 2025, label: "2025–26 DECODE" },
  { y: 2024, label: "2024–25 INTO THE DEEP" },
];

export const TEXT_FIELDS = [
  { key: "auto", label: "Autonomous", hint: "What it does, where it parks" },
  { key: "intake", label: "Intake", hint: "Speed, reliability of pickup" },
  { key: "scoring", label: "Shooter / Scoring", hint: "How it scores points" },
  { key: "endgame", label: "Endgame", hint: "For example, hanging" },
  { key: "notes", label: "Comments / Breakdowns", hint: "Anything else worth knowing" },
];

export const EMPTY_TEAM = { number: "", name: "", style: "Careful", skill: 3, scoreTypes: [], auto: "", intake: "", scoring: "", endgame: "", notes: "" };
