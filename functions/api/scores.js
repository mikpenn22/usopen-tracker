// Cloudflare Pages Function — proxies ESPN's golf leaderboard.
// Route: /api/scores
export async function onRequest(context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
  if (context.request.method === "OPTIONS") return new Response("", { status: 200, headers });

  const EVENT_ID = "401811952";
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  const endpoints = [
    `https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary?event=${EVENT_ID}`,
    `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=${EVENT_ID}`
  ];

  let lastError = "none";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": UA } });
      if (!res.ok) { lastError = "HTTP " + res.status + " @ " + url; continue; }
      const data = await res.json();
      const players = parseAny(data);
      if (players.length > 0) {
        return new Response(JSON.stringify({ players, count: players.length, source: url, timestamp: new Date().toISOString() }), { status: 200, headers });
      }
      lastError = "0 players parsed @ " + url;
    } catch (e) { lastError = e.message + " @ " + url; }
  }
  return new Response(JSON.stringify({ error: lastError, players: [] }), { status: 200, headers });
}

function parseAny(data) {
  let comps = [];
  const tryPaths = [
    () => data?.events?.[0]?.competitions?.[0]?.competitors,
    () => data?.leaderboard?.[0]?.competitors,
    () => data?.competitions?.[0]?.competitors,
    () => data?.competitors,
    () => data?.events?.[0]?.competitors,
    () => data?.leaderboard?.competitors
  ];
  for (const fn of tryPaths) {
    try { const r = fn(); if (Array.isArray(r) && r.length) { comps = r; break; } } catch (e) {}
  }
  if (!comps.length) return [];

  return comps.map((c) => {
    const athlete = c.athlete || c.competitor || {};
    const name = athlete.displayName || athlete.fullName || c.displayName || "";
    let country = "";
    if (athlete.flag) country = athlete.flag.alt || athlete.flag.abbreviation || "";
    if (!country && athlete.birthPlace) country = athlete.birthPlace.country || "";

    let total = null;
    const candidates = [
      c.score?.displayValue, c.score,
      c.statistics?.find?.(s => s.name === "scoreToPar")?.displayValue,
      c.statistics?.find?.(s => s.name === "scoreToPar")?.value
    ];
    for (const cand of candidates) {
      if (cand === null || cand === undefined || cand === "-" || cand === "--") continue;
      if (cand === "E" || cand === "0" || cand === 0) { total = 0; break; }
      const n = parseInt(cand);
      if (!isNaN(n)) { total = n; break; }
    }

    let thru = "-";
    const st = c.status || {};
    if (st.type?.completed === true || st.thru === 18 || st.thru === "18") thru = "F";
    else if (st.thru !== undefined && st.thru !== null && st.thru !== "") thru = String(st.thru);
    else if (st.type?.shortDetail) thru = st.type.shortDetail;
    else if (st.displayValue) thru = st.displayValue;

    const pos = st.position?.displayName || st.position?.id || c.order || "-";
    const posStr = String(pos).toUpperCase();
    const cut = !!(st.type?.name === "cut" || posStr.includes("CUT") || posStr === "MC" || posStr === "WD" || posStr === "DQ");

    const lines = c.linescores || c.rounds || [];
    const rounds = lines.map((r) => {
      const v = (r && (r.displayValue ?? r.value)) ?? r;
      if (v === null || v === undefined || v === "-" || v === "--" || v === "") return null;
      const n = parseInt(v);
      return isNaN(n) ? null : n;
    });

    return { name, country, pos: String(pos), total, thru, r1: rounds[0] ?? null, r2: rounds[1] ?? null, r3: rounds[2] ?? null, r4: rounds[3] ?? null, cut };
  }).filter(p => p.name);
}
