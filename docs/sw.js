const V = "pony-v1";
const ALLOW = ["cdn.tailwindcss.com", "esm.sh", "www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];
const CORE = ["./", "./index.html", "./css/theme.css", "./manifest.webmanifest",
  "./img/bg.jpg", "./img/bg-dark.jpg", "./img/field.webp", "./img/favicon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.allSettled(CORE.map((u) => c.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

const allowed = (url) => url.origin === self.location.origin || ALLOW.includes(url.hostname);

async function fetchAndPut(req, cache) {
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(V);
  try {
    return await Promise.race([
      fetchAndPut(req, cache),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 4000)),
    ]);
  } catch {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") { const idx = await cache.match("./index.html"); if (idx) return idx; }
    return Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(V);
  const hit = await cache.match(req);
  const net = fetchAndPut(req, cache).catch(() => null);
  return hit || (await net) || Response.error();
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!allowed(url)) return;
  e.respondWith(url.origin === self.location.origin ? networkFirst(req) : staleWhileRevalidate(req));
});

self.addEventListener("message", (e) => {
  if (e.data?.type !== "CACHE") return;
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await Promise.allSettled((e.data.urls || []).map(async (u) => {
      const url = new URL(u);
      if (!allowed(url) || (await c.match(u))) return;
      const same = url.origin === self.location.origin;
      let res;
      try { res = await fetch(u, { mode: same ? "same-origin" : "cors" }); }
      catch { res = await fetch(u, { mode: "no-cors" }); }
      if (res.ok || res.type === "opaque") await c.put(u, res);
    }));
  })());
});
