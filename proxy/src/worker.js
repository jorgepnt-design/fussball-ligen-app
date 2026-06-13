// Cloudflare Worker: versteckt den API-Football-Key und fuegt CORS hinzu.
// Leitet /api/<pfad> an https://v3.football.api-sports.io/<pfad> weiter.
// Key wird als Secret gesetzt:  wrangler secret put API_FOOTBALL_KEY

const UPSTREAM = "https://v3.football.api-sports.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
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

    const target = `${UPSTREAM}${url.pathname.replace(/^\/api/, "")}${url.search}`;
    const upstream = await fetch(target, {
      headers: { "x-apisports-key": env.API_FOOTBALL_KEY, Accept: "application/json" },
      // Kurzes Cache-Fenster reduziert den Verbrauch des Tageskontingents.
      cf: { cacheTtl: 30, cacheEverything: true },
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  },
};
