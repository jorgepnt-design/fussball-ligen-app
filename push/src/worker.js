// Cloudflare-Worker: Web-Push für Tor-Benachrichtigungen.
// - HTTP: /subscribe, /unsubscribe, /test (vom Frontend aufgerufen).
// - Cron (jede Minute): pollt OpenLigaDB (bl1/bl2), erkennt neue Tore und sendet Push
//   an alle Abos, deren Vereine beteiligt sind. Nur deutsche Ligen haben Live-Spiele.
import { sendPush } from "./webpush.js";

const UPSTREAM = "https://api.openligadb.de";
const LEAGUES = ["bl1", "bl2"];
const SCORES_KEY = "scores";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

const subKey = async (endpoint) => {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(endpoint));
  return "sub:" + [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 40);
};

const seasonYear = () => {
  const now = new Date();
  // Saison startet im Sommer; ab Juli (Monat 6) das laufende Jahr, sonst Vorjahr.
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
};

const isLive = (m) => {
  if (m.matchIsFinished) return false;
  const t = new Date(m.matchDateTimeUTC).getTime();
  const now = Date.now();
  return t <= now && now - t < 3 * 3600 * 1000;
};

const liveScore = (m) => {
  if (m.matchResults?.length) {
    const end = m.matchResults.find((r) => r.resultTypeID === 2) ?? m.matchResults[m.matchResults.length - 1];
    return [end.pointsTeam1, end.pointsTeam2];
  }
  if (m.goals?.length) {
    const g = m.goals[m.goals.length - 1];
    return [g.scoreTeam1, g.scoreTeam2];
  }
  return [0, 0];
};

async function checkGoals(env) {
  const season = seasonYear();
  const live = [];
  for (const lg of LEAGUES) {
    try {
      const data = await fetch(`${UPSTREAM}/getmatchdata/${lg}/${season}`, { cf: { cacheTtl: 0 } }).then((r) => r.json());
      if (Array.isArray(data)) for (const m of data) if (isLive(m)) live.push(m);
    } catch {
      /* Liga überspringen */
    }
  }

  const prev = JSON.parse((await env.SUBS.get(SCORES_KEY)) || "{}");
  const next = {};
  const goals = [];
  for (const m of live) {
    const [h, a] = liveScore(m);
    next[m.matchID] = `${h}:${a}`;
    const before = prev[m.matchID];
    if (before !== undefined && before !== next[m.matchID]) {
      const [bh, ba] = before.split(":").map(Number);
      if (h > bh || a > ba) {
        goals.push({ home: m.team1.teamName, away: m.team2.teamName, scoreHome: h, scoreAway: a, scoringSide: h > bh ? m.team1.teamName : m.team2.teamName });
      }
    }
  }
  await env.SUBS.put(SCORES_KEY, JSON.stringify(next), { expirationTtl: 6 * 3600 });
  if (goals.length === 0) return;

  const list = await env.SUBS.list({ prefix: "sub:" });
  const subs = [];
  for (const k of list.keys) {
    const v = await env.SUBS.get(k.name);
    if (v) subs.push({ key: k.name, ...JSON.parse(v) });
  }

  const jobs = [];
  for (const goal of goals) {
    for (const s of subs) {
      const teams = s.teams || [];
      const wanted = teams.some((t) => t && (goal.home.includes(t) || goal.away.includes(t)));
      if (!wanted) continue;
      const payload = {
        title: "⚽ Tor!",
        body: `${goal.scoringSide}\n${goal.home} ${goal.scoreHome} : ${goal.scoreAway} ${goal.away}`,
        url: env.APP_URL,
        tag: `goal-${goal.home}-${goal.away}`,
      };
      jobs.push(
        sendPush(s.subscription, payload, env)
          .then(async (res) => {
            if (res.status === 404 || res.status === 410) await env.SUBS.delete(s.key);
          })
          .catch(() => {}),
      );
    }
  }
  await Promise.allSettled(jobs);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/subscribe") {
      const { subscription, teams } = await request.json().catch(() => ({}));
      if (!subscription?.endpoint) return json({ error: "subscription fehlt" }, 400);
      await env.SUBS.put(await subKey(subscription.endpoint), JSON.stringify({ subscription, teams: teams || [] }));
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/unsubscribe") {
      const { endpoint } = await request.json().catch(() => ({}));
      if (endpoint) await env.SUBS.delete(await subKey(endpoint));
      return json({ ok: true });
    }

    if (request.method === "POST" && url.pathname === "/test") {
      const { subscription } = await request.json().catch(() => ({}));
      if (!subscription?.endpoint) return json({ error: "subscription fehlt" }, 400);
      try {
        const res = await sendPush(subscription, { title: "⚽ Test – es funktioniert!", body: "So sieht eine Tor-Benachrichtigung aus.", url: env.APP_URL }, env);
        return json({ ok: res.ok, status: res.status });
      } catch (e) {
        return json({ ok: false, error: String(e) }, 500);
      }
    }

    return json({ error: "not found" }, 404);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(checkGoals(env));
  },
};
