// Debug endpoint — returns the RAW ESPN response structure so we can inspect field names.
// Route: /api/raw
export async function onRequest(context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };
  const EVENT_ID = "401811952";
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  const endpoints = [
    `https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
    `https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary?event=${EVENT_ID}`
  ];

  const report = { endpoints: [] };

  for (const url of endpoints) {
    const entry = { url };
    try {
      const res = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": UA } });
      entry.status = res.status;
      if (!res.ok) { entry.note = "non-200"; report.endpoints.push(entry); continue; }
      const data = await res.json();

      // Find competitors
      const paths = {
        "events[0].competitions[0].competitors": data?.events?.[0]?.competitions?.[0]?.competitors,
        "leaderboard[0].competitors": data?.leaderboard?.[0]?.competitors,
        "competitions[0].competitors": data?.competitions?.[0]?.competitors,
        "competitors": data?.competitors,
        "events[0].competitors": data?.events?.[0]?.competitors
      };
      entry.topLevelKeys = Object.keys(data || {});
      entry.pathCounts = {};
      let firstComp = null;
      for (const [k, v] of Object.entries(paths)) {
        entry.pathCounts[k] = Array.isArray(v) ? v.length : (v ? "not-array" : 0);
        if (!firstComp && Array.isArray(v) && v.length) firstComp = v[0];
      }
      // Dump the first competitor RAW so we see exact field names
      entry.firstCompetitor = firstComp || null;
      report.endpoints.push(entry);
      // Stop after first endpoint that has a competitor
      if (firstComp) break;
    } catch (e) {
      entry.error = e.message;
      report.endpoints.push(entry);
    }
  }

  return new Response(JSON.stringify(report, null, 2), { status: 200, headers });
}
