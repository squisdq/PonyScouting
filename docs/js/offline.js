import * as fb from "./firebase.js";

(async () => {
  if (/[?&]nooffline\b/.test(location.search)) return;
  try {
    if (fb.enableMultiTabIndexedDbPersistence) await fb.enableMultiTabIndexedDbPersistence(fb.db);
  } catch (e) {
    try { if (fb.enableIndexedDbPersistence) await fb.enableIndexedDbPersistence(fb.db); }
    catch (e2) { console.warn("Firestore offline cache unavailable:", e2.code || e2.message); }
  }
})();
