import { db, doc, getDoc, setDoc, serverTimestamp } from "./firebase.js";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LS_LIST = "pony.workspaces";
const LS_ACTIVE = "pony.active";

export function genCode() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (v) => ALPHABET[v % 32]).join("");
}
export const fmtCode = (c) => c.replace(/(.{4})(?=.)/g, "$1-");
export const normCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const loadWorkspaces = () => { try { return JSON.parse(localStorage.getItem(LS_LIST)) || []; } catch { return []; } };
export const saveWorkspaces = (l) => { try { localStorage.setItem(LS_LIST, JSON.stringify(l)); } catch {} };
export const getActiveCode = () => { try { return localStorage.getItem(LS_ACTIVE); } catch { return null; } };
export const setActiveCode = (c) => { try { c ? localStorage.setItem(LS_ACTIVE, c) : localStorage.removeItem(LS_ACTIVE); } catch {} };

const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

export async function registerWorkspace(name, number) {
  if (!navigator.onLine) throw new Error("Registration needs an internet connection.");
  const code = genCode();
  await withTimeout(
    setDoc(doc(db, "workspaces", code), { name, number: number ?? null, createdAt: serverTimestamp() }),
    12000,
    "No response from the server. Check your connection and the Firestore rules."
  );
  return { code, name, number: number ?? null };
}

export async function findWorkspace(raw) {
  const code = normCode(raw);
  if (code.length !== 12) throw new Error("The code has 12 characters, for example ABCD-EFGH-JKLM.");
  const snap = await withTimeout(getDoc(doc(db, "workspaces", code)), 12000, "No response from the server. The first sign-in needs internet.");
  if (!snap.exists()) throw new Error("This code was not found.");
  const d = snap.data();
  return { code, name: d.name, number: d.number ?? null };
}
