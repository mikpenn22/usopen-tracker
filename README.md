# 2026 U.S. Open Tracker — Cloudflare Pages

## Deploy in ~3 minutes (no Git, no API key)

1. Go to **https://dash.cloudflare.com** and create a free account (just email + password)
2. In the left sidebar, click **Workers & Pages**
3. Click **Create application** → **Pages** tab → **Upload assets**
4. Give it a project name like `usopen-tracker`
5. **Drag the entire `usopen_cf` folder contents** (the `index.html` file AND the `functions` folder) into the upload box
   - Important: upload BOTH items together so the `functions` folder comes along
6. Click **Deploy site**

Your live URL will be: `https://usopen-tracker.pages.dev`

That's it. Share that link with your friends — it works for everyone, no setup on their end.

---

## Why Cloudflare Pages instead of Netlify Drop?

Netlify's drag-and-drop deploy does NOT run serverless functions — that was the source of every "can't refresh" error. Cloudflare Pages runs the `/functions` folder automatically even with drag-and-drop upload, so the ESPN proxy just works.

## How the data works
- The page calls `/api/scores` (your Cloudflare function)
- That function fetches the real ESPN leaderboard server-side (no CORS issue, no API key)
- Returns all 156 players with live scores, positions, rounds, and cut status
- Auto-refreshes every 60 seconds

## Features
- Full live leaderboard with country flags + score-change arrows (▲▼)
- Contest standings with expandable per-person pick dropdowns
- Holes remaining per entry and per pick
- Tiebreaker display when entries are tied
- CUT alerts on picks that miss the cut
- Sort standings by score / holes remaining / name
- Admin panel (gear button, password: `usopen2026`) to add picks
- Auto-pauses when the browser tab is hidden
- Confetti when the leader changes
- Mobile-friendly

## To change the admin password
Open `index.html`, find `const ADMIN_PW="usopen2026"` near the top of the script, change it before deploying.

## To update the tournament (future years)
Open `functions/api/scores.js` and change the `EVENT_ID` to the new ESPN event ID.
