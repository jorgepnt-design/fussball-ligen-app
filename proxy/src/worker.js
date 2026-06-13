// Cloudflare Worker: versteckt den API-Football-Key und fuegt CORS hinzu.
// Leitet /api/<pfad> an https://v3.football.api-sports.io/<pfad> weiter.
// Key wird als Secret gesetzt:  wrangler secret put API_FOOTBALL_KEY

const UPSTREAM = "https://v3.football.api-sports.io";

// Erfolgreiche Antworten werden 10 Minuten am Cloudflare-Edge gecacht. Das schont
// das Free-Tier-Kontingent (100/Tag, ~10/Min) massiv: wiederholte Aufrufe – inkl.
// dem doppelten Feuern durch React StrictMode im Dev – werden aus dem Cache bedient.
// Fehlerantworten (Rate-Limit, Plan, leeres Ergebnis) werden NIE gecacht, damit ein
// transientes Limit nicht "klebt".
const SUCCESS_TTL_SECONDS = 600;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// API-Football antwortet auch bei Fehlern mit HTTP 200; der Fehler steckt im Body
// unter "errors" (mal Array, mal Objekt). Nur cachen, wenn wirklich Daten kamen.
const isCacheable = (status, body) => {
  if (status !== 200) return false;
  try {
    const json = JSON.parse(body);
    const errs = json.errors;
    const hasErrors = Array.isArray(errs) ? errs.length > 0 : errs && typeof errs === "object" && Object.keys(errs).length > 0;
    return !hasErrors;
  } catch {
    return false;
  }
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404, headers: corsHeaders });
    }

    if (!env.API_FOOTBALL_KEY) {
      return new Response(JSON.stringify({ errors: ["API_FOOTBALL_KEY ist nicht gesetzt (wrangler secret put)."] }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache-Key nur aus dem Pfad+Query (ohne wechselnde Header), damit alle Clients
    // denselben Edge-Cache-Eintrag teilen.
    const cache = caches.default;
    const cacheKey = new Request(`${url.origin}${url.pathname}${url.search}`, { method: "GET" });

    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    const target = `${UPSTREAM}${url.pathname.replace(/^\/api/, "")}${url.search}`;
    const upstream = await fetch(target, {
      headers: { "x-apisports-key": env.API_FOOTBALL_KEY, Accept: "application/json" },
    });

    const body = await upstream.text();
    const headers = { ...corsHeaders, "Content-Type": "application/json" };

    if (isCacheable(upstream.status, body)) {
      const response = new Response(body, {
        status: 200,
        headers: { ...headers, "Cache-Control": `public, max-age=${SUCCESS_TTL_SECONDS}` },
      });
      // Im Hintergrund cachen, Antwort sofort zurueckgeben.
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    // Fehler/leer: ungecacht durchreichen, plus Hinweis fuer Clients.
    return new Response(body, {
      status: upstream.status,
      headers: { ...headers, "Cache-Control": "no-store" },
    });
  },
};
