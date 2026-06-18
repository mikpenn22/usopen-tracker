// ============================================================
//  2026 U.S. Open Tracker — single-file Cloudflare Worker
//  Serves the page at /  and proxies ESPN at /api/scores and /api/raw
// ============================================================

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>2026 U.S. Open Championship Tracker</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#eef1f7;min-height:100vh;padding:12px 8px 24px}
.container{max-width:820px;margin:0 auto}
.hdr{background:linear-gradient(135deg,#1a3a6b 0%,#0d2444 55%,#7a0000 100%);padding:22px 20px 16px;text-align:center;border-radius:14px 14px 0 0;position:relative}
.hdr-usga{color:#a8c4e0;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin-bottom:4px;opacity:.8}
.hdr-title{color:#d4af37;font-size:24px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
.hdr-course{color:#ccd9ea;font-size:13px;margin-top:4px;font-weight:500}
.hdr-dates{color:#8fa8c4;font-size:12px;margin-top:2px}
.hdr-badge{display:inline-block;background:#d4af37;color:#1a3a6b;font-size:11px;font-weight:700;padding:4px 14px;border-radius:20px;margin-top:10px;letter-spacing:.5px}
.hdr-updated{position:absolute;top:12px;right:14px;font-size:10px;color:#7a9bbf;text-align:right;line-height:1.6}
.hdr-pause{font-size:9px;color:#f59e0b;display:none}
.wrap{background:#fff;border-radius:0 0 14px 14px;border:1px solid #dde3ec;border-top:none;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
.tabs{display:flex;background:#f0f3f9;border-bottom:1px solid #dde3ec}
.tab{flex:1;padding:11px 6px;font-size:13px;font-weight:500;text-align:center;cursor:pointer;color:#6b7280;border-bottom:2px solid transparent;transition:all .15s;user-select:none;white-space:nowrap}
.tab i{margin-right:4px;font-size:14px;vertical-align:-2px}
.tab.active{color:#1a3a6b;border-bottom:2px solid #d4af37;background:#fff;font-weight:600}
.tab:hover:not(.active){background:#e8ecf5}
.panel{display:none;padding:14px}
.panel.active{display:block}
.refresh-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-size:12px;color:#6b7280}
.refresh-left{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.refresh-btn{display:flex;align-items:center;gap:5px;background:none;border:1px solid #d1d5db;border-radius:8px;padding:5px 11px;font-size:12px;cursor:pointer;color:#374151;font-family:inherit;transition:all .15s}
.refresh-btn:hover{background:#f5f7fa}
.status-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0}
.status-dot.loading{background:#f59e0b;animation:pulse 1s infinite}
.status-dot.error{background:#ef4444}
.status-dot.paused{background:#9ca3af}
.pause-chip{font-size:11px;background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:6px;border:1px solid #fde68a;display:none}
.course-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px;background:#f5f7fa;border-radius:8px;padding:9px 14px;margin-bottom:12px;font-size:12px;color:#6b7280}
.course-bar strong{color:#111}
.round-indicator{margin-left:auto;background:#1a3a6b;color:#d4af37;font-size:11px;font-weight:600;padding:2px 10px;border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{padding:7px 6px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;background:#f5f7fa;border-bottom:1px solid #e5e7eb;white-space:nowrap}
tbody tr{border-bottom:1px solid #f0f2f5;transition:background .1s}
tbody tr:hover{background:#f9fafb}
tbody td{padding:7px 6px;vertical-align:middle}
.pos{font-weight:700;font-size:12px;color:#374151}
.pos-1{color:#d4af37;font-size:15px}
.pos-2,.pos-3{color:#888}
.flag{font-size:15px;margin-right:4px}
.player-name{font-weight:500;font-size:13px;color:#111}
.score-under{color:#15803d;font-weight:700}
.score-over{color:#dc2626;font-weight:700}
.score-even{color:#111;font-weight:700}
.score-cut{color:#9ca3af;font-style:italic;font-size:12px}
.r-score{text-align:center;font-size:12px;color:#6b7280}
.thru-cell{text-align:center;font-size:12px;color:#374151;font-weight:500}
.cut-line{background:linear-gradient(90deg,#fffbeb,#fef3c7,#fffbeb);text-align:center;font-size:11px;font-weight:700;color:#92400e;padding:5px;letter-spacing:.8px;border-top:1px solid #fde68a;border-bottom:1px solid #fde68a}
.cut-badge{background:#dc2626;color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:5px;vertical-align:middle}
.move-up{color:#15803d;font-size:11px;margin-left:3px}
.move-down{color:#dc2626;font-size:11px;margin-left:3px}
@media(max-width:540px){.r-col{display:none}.r-toggle{display:inline-flex!important}.player-name{font-size:12px}.tab{font-size:11px;padding:10px 4px}.tab i{display:none}}
.r-toggle{display:none}
.st-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:8px;overflow:hidden;transition:box-shadow .15s}
.st-card:hover{box-shadow:0 2px 8px rgba(0,0,0,.08)}
.st-row{display:flex;align-items:center;gap:8px;padding:11px 14px;cursor:pointer;user-select:none}
.st-rank-wrap{min-width:32px;text-align:center}
.st-rank-medal{font-size:20px}
.st-rank-num{font-size:14px;font-weight:700;color:#6b7280}
.st-info{flex:1;min-width:0}
.st-name{font-weight:700;font-size:15px;color:#111}
.st-tbd-note{font-size:10px;color:#9ca3af;margin-left:5px;font-weight:400}
.st-cut-note{font-size:10px;color:#dc2626;margin-left:5px;font-weight:400}
.st-sub{display:flex;align-items:center;gap:8px;margin-top:3px;flex-wrap:wrap}
.st-holes-rem{font-size:11px;color:#6b7280}
.st-tiebreaker{font-size:10px;background:#dbeafe;color:#1e40af;padding:1px 7px;border-radius:6px;font-weight:600}
.st-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.st-score{font-weight:700;font-size:18px}
.st-chevron{font-size:16px;color:#9ca3af;transition:transform .2s;margin-left:4px;flex-shrink:0}
.st-chevron.open{transform:rotate(180deg)}
.st-picks-drop{display:none;border-top:1px solid #f0f2f5;background:#f9fafb}
.st-picks-drop.open{display:block}
.st-pick-table{width:100%;border-collapse:collapse;font-size:12px}
.st-pick-table thead th{padding:6px 12px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e5e7eb;background:#f0f3f9}
.st-pick-table tbody tr{border-bottom:1px solid #f0f2f5}
.st-pick-table tbody tr:last-child{border-bottom:none}
.st-pick-table tbody td{padding:7px 12px;vertical-align:middle}
.st-pick-table tbody tr:hover{background:#fff}
.holes-pip{display:inline-block;background:#dbeafe;color:#1e40af;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;min-width:36px;text-align:center}
.holes-pip.done{background:#dcfce7;color:#166534}
.holes-pip.na{background:#f3f4f6;color:#9ca3af}
.pick-cut-badge{background:#fee2e2;color:#991b1b;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;margin-left:4px}
.sort-bar{display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap}
.sort-label{font-size:11px;color:#6b7280;font-weight:500}
.sort-btn{font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;color:#374151;font-family:inherit;transition:all .15s;font-weight:500}
.sort-btn.active{background:#1a3a6b;color:#fff;border-color:#1a3a6b}
.sort-btn:hover:not(.active){background:#f0f3f9}
.entry-card{background:#fff;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:10px;overflow:hidden}
.entry-hdr{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:#f5f7fa;border-bottom:1px solid #e5e7eb}
.entry-name{font-weight:700;font-size:15px;color:#111}
.entry-rank-sub{font-size:12px;color:#6b7280;margin-top:2px}
.entry-total{font-weight:700;font-size:18px}
.entry-total.under{color:#15803d}
.entry-total.over{color:#dc2626}
.entry-picks{padding:8px 16px}
.pick-row{display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #f0f2f5;font-size:12px}
.pick-row:last-child{border-bottom:none}
.pick-tier{font-size:10px;color:#9ca3af;min-width:32px;font-weight:600}
.pick-name{flex:1;color:#111;font-weight:500}
.pick-score{font-weight:700}
.pick-score.under{color:#15803d}
.pick-score.over{color:#dc2626}
.pick-score.tbd{color:#9ca3af;font-style:italic}
.admin-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1000;align-items:center;justify-content:center;padding:16px}
.admin-overlay.open{display:flex}
.admin-modal{background:#fff;border-radius:14px;padding:24px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.admin-modal h2{font-size:18px;font-weight:700;margin-bottom:4px;color:#111}
.admin-modal p{font-size:13px;color:#6b7280;margin-bottom:16px}
.admin-row{margin-bottom:12px}
.admin-row label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}
.admin-row select,.admin-row input{width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;font-family:inherit;color:#111}
.admin-picks-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.admin-tier-row label{font-size:11px;color:#6b7280;font-weight:600;display:block;margin-bottom:3px}
.admin-tier-row input{width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;font-family:inherit}
.admin-btns{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}
.btn-primary{background:#1a3a6b;color:#fff;border:none;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.btn-primary:hover{background:#22499e}
.btn-cancel{background:#fff;color:#374151;border:1px solid #d1d5db;padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit}
.btn-cancel:hover{background:#f5f7fa}
.admin-success{background:#dcfce7;color:#166534;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:12px;display:none}
.admin-err{color:#dc2626;font-size:12px;margin-top:4px;display:none}
.admin-trigger{position:fixed;bottom:18px;right:18px;background:#1a3a6b;color:#fff;border:none;width:46px;height:46px;border-radius:50%;font-size:20px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:99;transition:background .15s}
.admin-trigger:hover{background:#22499e}
.loading-msg{text-align:center;padding:32px 16px;color:#6b7280;font-size:13px;line-height:2.2}
.spinner{display:block;margin:0 auto 8px;font-size:24px;animation:spin 1s linear infinite}
.data-source{font-size:10px;color:#9ca3af;text-align:center;padding:6px;border-top:1px solid #f0f2f5}
#confetti-canvas{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;display:none}
footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:14px;padding-bottom:4px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.fade-in{animation:fadeIn .2s ease}
</style>
</head>
<body>
<canvas id="confetti-canvas"></canvas>
<div class="container">
  <div class="hdr">
    <div class="hdr-updated"><div id="hdr-time"></div><div class="hdr-pause" id="hdr-pause">⏸ paused</div></div>
    <div class="hdr-usga">Conducted by the USGA</div>
    <div class="hdr-title">U.S. Open 2026</div>
    <div class="hdr-course">Shinnecock Hills Golf Club</div>
    <div class="hdr-dates">Southampton, New York · Jun 18–21, 2026</div>
    <div class="hdr-badge" id="round-badge">Loading…</div>
  </div>
  <div class="wrap">
    <div class="tabs">
      <div class="tab active" onclick="showTab('leaderboard')"><i class="ti ti-list-numbers"></i> Tournament</div>
      <div class="tab" onclick="showTab('standings')"><i class="ti ti-trophy"></i> Standings</div>
      <div class="tab" onclick="showTab('picks')"><i class="ti ti-users"></i> All Picks</div>
    </div>
    <div id="tab-leaderboard" class="panel active">
      <div class="refresh-bar">
        <div class="refresh-left"><span class="status-dot" id="sd1"></span><span id="st1">Loading…</span><span class="pause-chip" id="pause-chip">Tab hidden — paused</span></div>
        <div style="display:flex;gap:6px">
          <button class="refresh-btn r-toggle" id="r-toggle-btn" onclick="toggleRounds()"><i class="ti ti-table"></i> Rounds</button>
          <button class="refresh-btn" onclick="loadData(true)"><i class="ti ti-refresh"></i> Refresh</button>
        </div>
      </div>
      <div class="course-bar">
        <div><strong>Course:</strong> Shinnecock Hills GC</div>
        <div><strong>Par:</strong> 70</div>
        <div><strong>Purse:</strong> $22.5M</div>
        <div class="round-indicator" id="round-ind">Loading…</div>
      </div>
      <div id="lb-cont"><div class="loading-msg"><i class="ti ti-loader spinner"></i>Loading leaderboard…</div></div>
      <div class="data-source">Live data via ESPN · 156-player field · Updates every 60s</div>
    </div>
    <div id="tab-standings" class="panel">
      <div class="refresh-bar">
        <div class="refresh-left"><span class="status-dot" id="sd2"></span><span id="st2">Synced with live data</span></div>
        <button class="refresh-btn" onclick="loadData(true)"><i class="ti ti-refresh"></i> Refresh</button>
      </div>
      <div class="sort-bar">
        <span class="sort-label">Sort by:</span>
        <button class="sort-btn active" id="sort-score" onclick="setSort('score')">Score</button>
        <button class="sort-btn" id="sort-holes" onclick="setSort('holes')">Holes Rem.</button>
        <button class="sort-btn" id="sort-name" onclick="setSort('name')">Name</button>
      </div>
      <div id="st-cont"><div class="loading-msg">Loading standings…</div></div>
    </div>
    <div id="tab-picks" class="panel"><div id="pk-cont"></div></div>
  </div>
</div>
<button class="admin-trigger" onclick="openAdmin()" title="Update picks"><i class="ti ti-settings"></i></button>
<div class="admin-overlay" id="admin-overlay" onclick="if(event.target===this)closeAdmin()">
  <div class="admin-modal">
    <h2><i class="ti ti-settings" style="vertical-align:-2px;margin-right:6px"></i>Update Picks</h2>
    <p>Select a participant and enter their 7 golfer picks by tier.</p>
    <div class="admin-success" id="adm-ok">✓ Picks saved!</div>
    <div class="admin-row"><label>Participant</label><select id="adm-person" onchange="loadAdminPicks()"><option value="">— Select —</option></select></div>
    <div id="adm-grid" class="admin-picks-grid"></div>
    <div class="admin-row"><label>Password</label><input type="password" id="adm-pw" placeholder="Admin password"><div class="admin-err" id="adm-err">Incorrect password</div></div>
    <div class="admin-btns">
      <button class="btn-cancel" onclick="closeAdmin()">Cancel</button>
      <button class="btn-primary" onclick="savePicksAdmin()">Save Picks</button>
    </div>
  </div>
</div>
<footer>2026 U.S. Open Pick'em · Live data via ESPN · Auto-refreshes every 60s</footer>
<script>
const ADMIN_PW="usopen2026",TOTAL_HOLES=72;
let lbData=[],prevLbData=[],prevLeader=null,sortMode="score",showRounds=false,isPaused=false;
const DEF_PICKS={
  Mike:[{tier:1,name:"Cameron Young"},{tier:2,name:"Tommy Fleetwood"},{tier:3,name:"Sam Burns"},{tier:4,name:"Joaquin Niemann"},{tier:5,name:"Jason Day"},{tier:6,name:"Max Greyserman"},{tier:7,name:"Neal Shipley"}],
  Nate:[{tier:1,name:"Jon Rahm"},{tier:2,name:"Matt Fitzpatrick"},{tier:3,name:"Viktor Hovland"},{tier:4,name:"Shane Lowry"},{tier:5,name:"Sahith Theegala"},{tier:6,name:"Emiliano Grillo"},{tier:7,name:"Ben Silverman"}],
  Ben:[{tier:1,name:"Scottie Scheffler"},{tier:2,name:"Tommy Fleetwood"},{tier:3,name:"Sam Burns"},{tier:4,name:"Maverick McNealy"},{tier:5,name:"J.T. Poston"},{tier:6,name:"Nick Taylor"},{tier:7,name:"Nathan Kimsey"}],
  Henry:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Eric:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Cam:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Jake:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Kurt:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Luke:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Mitch:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}],
  Quincy:[{tier:1,name:"TBD"},{tier:2,name:"TBD"},{tier:3,name:"TBD"},{tier:4,name:"TBD"},{tier:5,name:"TBD"},{tier:6,name:"TBD"},{tier:7,name:"TBD"}]
};
function loadPicks(){try{const s=localStorage.getItem("uso26");return s?JSON.parse(s):JSON.parse(JSON.stringify(DEF_PICKS));}catch(e){return JSON.parse(JSON.stringify(DEF_PICKS));}}
function savePicks2(){try{localStorage.setItem("uso26",JSON.stringify(PICKS));}catch(e){}}
let PICKS=loadPicks();
const FLAGS={"USA":"🇺🇸","United States":"🇺🇸","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Ireland":"🇮🇪","Northern Ireland":"🇬🇧","Spain":"🇪🇸","Germany":"🇩🇪","Japan":"🇯🇵","South Korea":"🇰🇷","Korea":"🇰🇷","Australia":"🇦🇺","South Africa":"🇿🇦","Sweden":"🇸🇪","Norway":"🇳🇴","Canada":"🇨🇦","Argentina":"🇦🇷","Chile":"🇨🇱","Colombia":"🇨🇴","Venezuela":"🇻🇪","New Zealand":"🇳🇿","Denmark":"🇩🇰","Finland":"🇫🇮","China":"🇨🇳","Philippines":"🇵🇭","France":"🇫🇷","Belgium":"🇧🇪","Italy":"🇮🇹","Austria":"🇦🇹","Wales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿","Zimbabwe":"🇿🇼","Mexico":"🇲🇽","Netherlands":"🇳🇱","Brazil":"🇧🇷","Taiwan":"🇹🇼","Chinese Taipei":"🇹🇼"};
const ECM={"USA":"USA","ENG":"England","SCO":"Scotland","IRL":"Ireland","NIR":"Northern Ireland","ESP":"Spain","GER":"Germany","DEU":"Germany","JPN":"Japan","KOR":"South Korea","AUS":"Australia","RSA":"South Africa","ZAF":"South Africa","SWE":"Sweden","NOR":"Norway","CAN":"Canada","ARG":"Argentina","CHI":"Chile","CHL":"Chile","COL":"Colombia","VEN":"Venezuela","NZL":"New Zealand","DEN":"Denmark","DNK":"Denmark","FIN":"Finland","CHN":"China","PHI":"Philippines","PHL":"Philippines","FRA":"France","BEL":"Belgium","ITA":"Italy","AUT":"Austria","WAL":"Wales","ZIM":"Zimbabwe","ZWE":"Zimbabwe","MEX":"Mexico","NED":"Netherlands","NLD":"Netherlands","BRA":"Brazil","TPE":"Taiwan"};
const PC={"Scottie Scheffler":"USA","Jon Rahm":"Spain","Rory McIlroy":"Northern Ireland","Xander Schauffele":"USA","Collin Morikawa":"USA","Viktor Hovland":"Norway","Tommy Fleetwood":"England","Shane Lowry":"Ireland","Brooks Koepka":"USA","Justin Thomas":"USA","Hideki Matsuyama":"Japan","Jordan Spieth":"USA","Patrick Cantlay":"USA","Sam Burns":"USA","Matt Fitzpatrick":"England","Jason Day":"Australia","Corey Conners":"Canada","Joaquin Niemann":"Chile","Min Woo Lee":"Australia","Sahith Theegala":"USA","Maverick McNealy":"USA","Cameron Young":"USA","Ludvig Åberg":"Sweden","Aaron Rai":"England","Max Greyserman":"USA","J.T. Poston":"USA","Nick Taylor":"Canada","Nathan Kimsey":"England","Ben Silverman":"Canada","Neal Shipley":"USA","Emiliano Grillo":"Argentina","Russell Henley":"USA","Robert MacIntyre":"Scotland","Keegan Bradley":"USA","Adam Scott":"Australia","Billy Horschel":"USA","Sepp Straka":"Austria","Bryson DeChambeau":"USA","Tyrrell Hatton":"England","Wyndham Clark":"USA","Sungjae Im":"South Korea","Brian Harman":"USA","Rickie Fowler":"USA","Akshay Bhatia":"USA","Harry Hall":"England","Carlos Ortiz":"Mexico","Padraig Harrington":"Ireland","Alex Noren":"Sweden","J.J. Spaun":"USA","Dustin Johnson":"USA","Gary Woodland":"USA","Bud Cauley":"USA","Taylor Pendrith":"Canada","Keith Mitchell":"USA","Rico Hoey":"Philippines","Ben Griffin":"USA","Chris Gotterup":"USA","Harris English":"USA","Andrew Novak":"USA","Jacob Bridgeman":"USA","Justin Rose":"England","Si Woo Kim":"South Korea","Ryo Hisatsune":"Japan","Ludvig Aberg":"Sweden"};
function gf(name,country){if(country){const mapped=ECM[country]||country;if(FLAGS[mapped])return FLAGS[mapped];}return FLAGS[PC[name]||"USA"]||"🏌️";}
function fs(v){if(v===null||v===undefined)return{t:"-",c:"score-even"};const n=typeof v==="string"?parseInt(v):v;if(isNaN(n)||n===0)return{t:"E",c:"score-even"};return n<0?{t:String(n),c:"score-under"}:{t:"+"+n,c:"score-over"};}
function fr(v){if(!v||v==="-"||v===null)return"-";const n=parseInt(v);if(isNaN(n))return String(v);if(n<70)return\`<span style="color:#15803d;font-weight:600">\${n}</span>\`;if(n>70)return\`<span style="color:#dc2626">\${n}</span>\`;return n;}
function ghr(p){if(!p)return TOTAL_HOLES;if(p.cut)return 0;const t=p.thru;if(!t||t==="-")return TOTAL_HOLES;if(t==="F")return 0;if(typeof t==="string"&&/[a-zA-Z]/.test(t)&&t.includes(":"))return TOTAL_HOLES;const rd=[p.r1,p.r2,p.r3,p.r4].filter(r=>r!==null&&r!==undefined&&r!=="-").length;const ip=parseInt(t)||0;const base=ip>0?(rd>0?(rd-1)*18:0):rd*18;return Math.max(0,TOTAL_HOLES-(ip>0?base+ip:rd*18));}
function gpd(name){if(name==="TBD")return null;const nl=name.toLowerCase();let p=lbData.find(x=>x.name&&x.name.toLowerCase()===nl);if(p)return p;const last=nl.split(" ").slice(-1)[0];return lbData.find(x=>x.name&&x.name.toLowerCase().includes(last))||null;}
function gps(name){if(!prevLbData.length)return null;const last=name.toLowerCase().split(" ").slice(-1)[0];const p=prevLbData.find(x=>x.name&&x.name.toLowerCase().includes(last));return p?p.total:null;}
function calcE(person){
  const picks=PICKS[person];
  let hr=0;
  const scored=[]; // scores of picks that have a live total
  const det=picks.map(pk=>{
    if(pk.name==="TBD")return{...pk,player:null,score:null,holesRem:TOTAL_HOLES,cut:false,counts:false};
    const p=gpd(pk.name);
    const h=ghr(p);
    hr+=h;
    const hasScore=!!(p&&p.total!==null&&p.total!==undefined);
    if(hasScore)scored.push({name:pk.name,score:p.total});
    return{...pk,player:p,score:p?p.total:null,holesRem:h,cut:p?!!p.cut:false,counts:false};
  });
  // Take the 4 BEST (lowest) scores. Need at least 4 scored picks, else N/A.
  let total=null;
  if(scored.length>=4){
    const best=[...scored].sort((a,b)=>a.score-b.score).slice(0,4);
    total=best.reduce((s,x)=>s+x.score,0);
    // mark which picks count (match by name, only first 4 best)
    const used={};
    best.forEach(b=>{used[b.name]=(used[b.name]||0)+1;});
    det.forEach(d=>{
      if(d.name!=="TBD"&&d.score!==null&&used[d.name]>0){d.counts=true;used[d.name]--;}
    });
  }
  return{total,holesRem:hr,pickDetails:det,countingNeeded:4,scoredCount:scored.length};
}
function setStatus(state,msg){["sd1","sd2"].forEach(id=>{const el=document.getElementById(id);if(el)el.className="status-dot"+(state==="loading"?" loading":state==="error"?" error":state==="paused"?" paused":"");});if(document.getElementById("st1"))document.getElementById("st1").textContent=msg;if(document.getElementById("st2"))document.getElementById("st2").textContent=msg.includes("Live")?"Synced with live data":msg;}

async function loadData(manual=false){
  if(isPaused&&!manual)return;
  setStatus("loading","Fetching live scores…");
  try{
    const res=await fetch("/api/scores");
    if(!res.ok)throw new Error("HTTP "+res.status);
    const d=await res.json();
    if(d.error)throw new Error("API: "+d.error);
    if(!d.players||!d.players.length)throw new Error("no players returned");
    prevLbData=[...lbData];
    const active=d.players.filter(p=>!p.cut).sort((a,b)=>{const ao=a.sortOrder??9999,bo=b.sortOrder??9999;if(ao!==bo)return ao-bo;if(a.total===null&&b.total===null)return 0;if(a.total===null)return 1;if(b.total===null)return -1;return a.total-b.total;});
    lbData=[...active,...d.players.filter(p=>p.cut)];
    renderLB();renderStandings();renderPicks();
    const t=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
    document.getElementById("hdr-time").textContent="Updated "+t;
    setStatus("live","Live · updates every 60s");
    checkLeader();
  }catch(err){
    setStatus("error","Could not load: "+(err.message||"unknown")+" — retrying in 60s");
    if(!lbData.length){renderFallback();renderPicks();}
  }
}
function checkLeader(){const lead=lbData.find(p=>!p.cut&&p.total!==null);if(!lead){document.getElementById("round-badge").textContent="Pre-Tournament · Thu Jun 18";return;}if(prevLeader&&prevLeader!==lead.name)fireConfetti();prevLeader=lead.name;const s=fs(lead.total);document.getElementById("round-badge").textContent=\`Leader: \${lead.name} \${s.t}\`;}
function renderLB(){
  if(!lbData.length){renderFallback();return;}
  const hasScores=lbData.some(p=>p.total!==null);
  const cutIdx=lbData.findIndex(p=>p.cut);
  const r4c=lbData.filter(p=>!p.cut&&p.r4!==null).length,r3c=lbData.filter(p=>!p.cut&&p.r3!==null).length,r2c=lbData.filter(p=>!p.cut&&p.r2!==null).length;
  document.getElementById("round-ind").textContent=r4c>5?\`R4 · \${lbData.length} players\`:r3c>5?\`R3 · \${lbData.length} players\`:r2c>5?\`R2 · \${lbData.length} players\`:hasScores?\`R1 · \${lbData.length} players\`:\`Pre-Tournament · \${lbData.length} players\`;
  let html=\`<table><thead><tr><th style="width:36px">Pos</th><th>Player</th><th style="width:50px;text-align:center">Total</th><th style="width:44px;text-align:center">Thru</th><th class="r-col" style="width:30px;text-align:center">R1</th><th class="r-col" style="width:30px;text-align:center">R2</th><th class="r-col" style="width:30px;text-align:center">R3</th><th class="r-col" style="width:30px;text-align:center">R4</th></tr></thead><tbody>\`;
  let cutShown=false;
  lbData.forEach((p,i)=>{
    if(cutIdx>0&&i===cutIdx&&!cutShown){html+=\`<tr><td colspan="8" class="cut-line">✂ CUT LINE</td></tr>\`;cutShown=true;}
    const s=fs(p.total),pc=p.pos==="1"?"pos pos-1":(p.pos==="T2"||p.pos==="2")?"pos pos-2":(p.pos==="T3"||p.pos==="3")?"pos pos-3":"pos";
    const sd=p.total===null?"-":p.cut?"CUT":s.t,sc=p.cut?"score-cut":s.c;
    const prev=gps(p.name);let mv="";if(prev!==null&&p.total!==null&&p.total!==prev){mv=p.total<prev?'<span class="move-up">▲</span>':'<span class="move-down">▼</span>';}
    html+=\`<tr><td class="\${pc}">\${p.pos||"-"}</td><td><span class="flag">\${gf(p.name,p.country)}</span><span class="player-name">\${p.name}</span>\${p.cut?'<span class="cut-badge">CUT</span>':""}</td><td style="text-align:center"><span class="\${sc}">\${sd}</span>\${mv}</td><td class="thru-cell">\${p.thru||"-"}</td><td class="r-score r-col">\${fr(p.r1)}</td><td class="r-score r-col">\${fr(p.r2)}</td><td class="r-score r-col">\${fr(p.r3)}</td><td class="r-score r-col">\${fr(p.r4)}</td></tr>\`;
  });
  document.getElementById("lb-cont").innerHTML=html+\`</tbody></table>\`;applyRCols();
}
function toggleRounds(){showRounds=!showRounds;applyRCols();const b=document.getElementById("r-toggle-btn");if(b)b.innerHTML=showRounds?'<i class="ti ti-table-off"></i> Hide':'<i class="ti ti-table"></i> Rounds';}
function applyRCols(){document.querySelectorAll(".r-col").forEach(el=>{el.style.display=showRounds?"":"";});}
function renderFallback(){const field=["Scottie Scheffler","Rory McIlroy","Jon Rahm","Xander Schauffele","Collin Morikawa","Tommy Fleetwood","Ludvig Åberg","Russell Henley","Matt Fitzpatrick","Cameron Young","Viktor Hovland","Tyrrell Hatton","Carlos Ortiz","Sam Burns","Ben Griffin","Robert MacIntyre","Justin Thomas","Aaron Rai","Wyndham Clark","Brooks Koepka","Bryson DeChambeau","J.J. Spaun","Gary Woodland","Dustin Johnson","Brian Harman","Cameron Smith","Alex Noren","Patrick Cantlay","Corey Conners","Keegan Bradley","Chris Gotterup","Akshay Bhatia","Harris English","Shane Lowry","Harry Hall","Nick Taylor","Justin Rose","Maverick McNealy","Andrew Novak","Jacob Bridgeman","Sungjae Im","Hideki Matsuyama","Sepp Straka","Padraig Harrington","Jordan Spieth","Sahith Theegala","Jason Day","Emiliano Grillo","Max Greyserman","J.T. Poston","Joaquin Niemann","Adam Scott","Billy Horschel","Rickie Fowler","Bud Cauley","Min Woo Lee","Si Woo Kim","Keith Mitchell","Ryo Hisatsune","Neal Shipley","Ben Silverman","Nathan Kimsey"];lbData=[...new Set(field)].map(name=>({pos:"-",name,country:"",total:null,thru:"-",r1:null,r2:null,r3:null,r4:null,cut:false}));document.getElementById("round-badge").textContent="Pre-Tournament · Thu Jun 18";renderLB();renderStandings();}
function setSort(m){sortMode=m;["score","holes","name"].forEach(x=>document.getElementById("sort-"+x).classList.toggle("active",x===m));renderStandings();}
function getSorted(){const all=Object.keys(PICKS).map(p=>{const e=calcE(p);return{person:p,...e};});if(sortMode==="holes")return all.sort((a,b)=>a.holesRem-b.holesRem);if(sortMode==="name")return all.sort((a,b)=>a.person.localeCompare(b.person));return[...all.filter(e=>e.total!==null).sort((a,b)=>a.total-b.total),...all.filter(e=>e.total===null)];}
function renderStandings(){
  const sorted=getSorted(),byScore=[...sorted].filter(e=>e.total!==null).sort((a,b)=>a.total-b.total);
  let html="";
  sorted.forEach((e,i)=>{
    const sr=byScore.findIndex(x=>x.person===e.person),rank=sortMode==="score"?i+1:(sr>=0?sr+1:sorted.length);
    const medal=rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":"",s=fs(e.total),st=e.total===null?"N/A":s.t,sc=e.total===null?"score-even":s.c;
    const hasTBD=e.pickDetails.some(p=>p.name==="TBD"),hasCut=e.pickDetails.some(p=>p.cut),isTied=e.total!==null&&byScore.filter(x=>x.total===e.total).length>1;
    const needNote=e.total===null?'<span class="st-tbd-note">(needs 4 scored picks)</span>':'';
    html+=\`<div class="st-card fade-in"><div class="st-row" onclick="togglePicks('\${e.person}')"><div class="st-rank-wrap">\${medal?\`<span class="st-rank-medal">\${medal}</span>\`:\`<span class="st-rank-num">\${rank}</span>\`}</div><div class="st-info"><div class="st-name">\${e.person}\${needNote}\${hasCut?'<span class="st-cut-note">⚠ pick missed cut</span>':""}</div><div class="st-sub"><span class="st-holes-rem">best 4 of 7 · \${e.holesRem} holes remaining</span>\${isTied?'<span class="st-tiebreaker">Tied · holes rem. tiebreaker</span>':""}</div></div><div class="st-meta"><span class="st-score \${sc}">\${st}</span></div><i class="ti ti-chevron-down st-chevron" id="chev-\${e.person}"></i></div><div class="st-picks-drop" id="pdrop-\${e.person}"><table class="st-pick-table"><thead><tr><th style="width:32px">Tier</th><th>Player</th><th style="width:54px;text-align:center">Score</th><th style="width:54px;text-align:center">Pos</th><th style="width:70px;text-align:center">Holes rem.</th></tr></thead><tbody>\`;
    e.pickDetails.forEach(pk=>{
      const isTBD=pk.name==="TBD",p=pk.player,s2=p&&p.total!==null?fs(p.total):null;
      const st2=isTBD?"—":p===null?"pre-tmt":p.total===null?"pre-tmt":s2.t,sc2=isTBD?"":p&&p.total!==null?s2.c:"";
      const pos=isTBD?"—":p?p.pos||"-":"-",hr=pk.holesRem,pc=isTBD?"na":hr===0?"done":"",hd=isTBD?"—":hr===0?"Done":hr,cb=pk.cut?'<span class="pick-cut-badge">CUT</span>':"";
      const counts=pk.counts===true;
      const rowStyle=counts?'background:#f0fdf4':(pk.score!==null&&!isTBD?'opacity:.45':'');
      const tag=counts?'<span style="font-size:9px;font-weight:700;color:#15803d;background:#dcfce7;padding:1px 5px;border-radius:4px;margin-left:5px">COUNTS</span>':(pk.score!==null&&!isTBD?'<span style="font-size:9px;color:#9ca3af;margin-left:5px">dropped</span>':"");
      html+=\`<tr style="\${rowStyle}"><td style="text-align:center;font-size:10px;color:#9ca3af;font-weight:600">T\${pk.tier}</td><td>\${isTBD?'<span style="color:#9ca3af;font-style:italic">TBD</span>':\`<span class="flag">\${gf(pk.name,p?.country||"")}</span>\${pk.name}\${cb}\${tag}\`}</td><td style="text-align:center"><span class="\${sc2}">\${st2}</span></td><td style="text-align:center;font-size:12px;color:#6b7280">\${pos}</td><td style="text-align:center"><span class="holes-pip \${pc}">\${hd}</span></td></tr>\`;
    });
    html+=\`</tbody></table></div></div>\`;
  });
  document.getElementById("st-cont").innerHTML=html;
}
function togglePicks(p){const el=document.getElementById("pdrop-"+p),ch=document.getElementById("chev-"+p);if(!el||!ch)return;const open=el.classList.contains("open");el.classList.toggle("open",!open);ch.classList.toggle("open",!open);}
function renderPicks(){
  const all=Object.keys(PICKS).map(p=>{const e=calcE(p);return{person:p,...e};});
  const sorted=[...all.filter(e=>e.total!==null).sort((a,b)=>a.total-b.total),...all.filter(e=>e.total===null)];
  let html="";
  sorted.forEach((e,i)=>{
    const rank=i+1,s=fs(e.total),st=e.total===null?"N/A":s.t,sc=e.total===null?"":e.total<0?"under":e.total>0?"over":"",medal=rank===1?"🥇 ":rank===2?"🥈 ":rank===3?"🥉 ":"";
    html+=\`<div class="entry-card"><div class="entry-hdr"><div><div class="entry-name">\${medal}\${e.person}</div><div class="entry-rank-sub">Rank #\${rank} · \${e.holesRem} holes rem.</div></div><div class="entry-total \${sc}">\${st}</div></div><div class="entry-picks">\`;
    e.pickDetails.forEach(pk=>{
      const isTBD=pk.name==="TBD",p=pk.player,s2=p&&p.total!==null?fs(p.total):null;
      const st2=isTBD?"TBD":p===null?"pre-tmt":p.total===null?"pre-tmt":s2.t,sc2=isTBD?"tbd":p&&p.total!==null?s2.c:"tbd";
      const pos=p&&p.pos?" · "+p.pos:"",cb=pk.cut?'<span class="pick-cut-badge">CUT</span>':"";
      const counts=pk.counts===true;
      const tag=counts?'<span style="font-size:9px;font-weight:700;color:#15803d;background:#dcfce7;padding:1px 5px;border-radius:4px;margin-left:5px">COUNTS</span>':(pk.score!==null&&!isTBD?'<span style="font-size:9px;color:#9ca3af;margin-left:5px">dropped</span>':"");
      const rowOp=(!counts&&pk.score!==null&&!isTBD)?'opacity:.5':'';
      html+=\`<div class="pick-row" style="\${rowOp}"><span class="pick-tier">T\${pk.tier}</span><span class="pick-name">\${isTBD?"":gf(pk.name,p?.country||"")+" "}\${pk.name}\${cb}\${tag}</span><span class="pick-score \${sc2}">\${st2}\${pos}</span></div>\`;
    });
    html+=\`</div></div>\`;
  });
  document.getElementById("pk-cont").innerHTML=html;
}
function showTab(n){document.querySelectorAll(".tab").forEach((t,i)=>t.classList.toggle("active",["leaderboard","standings","picks"][i]===n));document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));document.getElementById("tab-"+n).classList.add("active");}
function openAdmin(){PICKS=loadPicks();const sel=document.getElementById("adm-person");sel.innerHTML='<option value="">— Select —</option>'+Object.keys(PICKS).map(p=>\`<option value="\${p}">\${p}</option>\`).join("");document.getElementById("adm-grid").innerHTML="";document.getElementById("adm-ok").style.display="none";document.getElementById("adm-err").style.display="none";document.getElementById("adm-pw").value="";document.getElementById("admin-overlay").classList.add("open");}
function closeAdmin(){document.getElementById("admin-overlay").classList.remove("open");}
function loadAdminPicks(){const person=document.getElementById("adm-person").value;if(!person){document.getElementById("adm-grid").innerHTML="";return;}const picks=PICKS[person]||[];let html="";for(let t=1;t<=7;t++){const pk=picks.find(p=>p.tier===t)||{name:""};html+=\`<div class="admin-tier-row"><label>Tier \${t}</label><input type="text" id="at\${t}" value="\${pk.name==="TBD"?"":pk.name}" placeholder="Player name"></div>\`;}document.getElementById("adm-grid").innerHTML=html;}
function savePicksAdmin(){const pw=document.getElementById("adm-pw").value;if(pw!==ADMIN_PW){document.getElementById("adm-err").style.display="block";return;}document.getElementById("adm-err").style.display="none";const person=document.getElementById("adm-person").value;if(!person)return;const np=[];for(let t=1;t<=7;t++){const v=document.getElementById("at"+t)?.value.trim()||"";np.push({tier:t,name:v||"TBD"});}PICKS[person]=np;savePicks2();document.getElementById("adm-ok").style.display="block";renderStandings();renderPicks();setTimeout(closeAdmin,1400);}
function fireConfetti(){const cv=document.getElementById("confetti-canvas"),ctx=cv.getContext("2d");cv.width=window.innerWidth;cv.height=window.innerHeight;cv.style.display="block";const p=Array.from({length:150},()=>({x:Math.random()*cv.width,y:-20,w:Math.random()*10+4,h:Math.random()*6+3,r:Math.random()*Math.PI*2,dr:Math.random()*.2-.1,vx:Math.random()*2-1,vy:Math.random()*3+2,c:["#d4af37","#1a3a6b","#dc2626","#22c55e","#fff"][Math.floor(Math.random()*5)]}));let f=0;(function draw(){ctx.clearRect(0,0,cv.width,cv.height);p.forEach(q=>{q.x+=q.vx;q.y+=q.vy;q.r+=q.dr;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.r);ctx.fillStyle=q.c;ctx.fillRect(-q.w/2,-q.h/2,q.w,q.h);ctx.restore();});if(++f<200)requestAnimationFrame(draw);else{ctx.clearRect(0,0,cv.width,cv.height);cv.style.display="none";}})();}
document.addEventListener("visibilitychange",()=>{isPaused=document.hidden;document.getElementById("pause-chip").style.display=isPaused?"inline":"none";document.getElementById("hdr-pause").style.display=isPaused?"block":"none";if(!isPaused){setStatus("loading","Resuming…");loadData();}else setStatus("paused","Paused — tab hidden");});
loadData();
setInterval(()=>loadData(),60000);
</script>
</body>
</html>
`;

const EVENT_ID = "401811952";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ENDPOINTS = [
  `https://site.web.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
  `https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard?event=${EVENT_ID}`,
  `https://site.api.espn.com/apis/site/v2/sports/golf/pga/summary?event=${EVENT_ID}`,
  `https://site.api.espn.com/apis/site/v2/sports/golf/leaderboard?league=pga&event=${EVENT_ID}`
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const j = (obj, status=200) => new Response(JSON.stringify(obj), {
      status,
      headers: { "Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Cache-Control":"no-store" }
    });

    if (url.pathname === "/api/scores") {
      let lastError = "none";
      for (const ep of ENDPOINTS) {
        try {
          const res = await fetch(ep, { headers: { "Accept":"application/json", "User-Agent":UA } });
          if (!res.ok) { lastError = "HTTP " + res.status; continue; }
          const data = await res.json();
          const players = parseAny(data);
          if (players.length) return j({ players, count: players.length, source: ep, timestamp: new Date().toISOString() });
          lastError = "0 players @ " + ep;
        } catch (e) { lastError = e.message; }
      }
      return j({ error: lastError, players: [] });
    }

    if (url.pathname === "/api/raw") {
      const report = { endpoints: [] };
      for (const ep of ENDPOINTS) {
        const entry = { url: ep };
        try {
          const res = await fetch(ep, { headers: { "Accept":"application/json", "User-Agent":UA } });
          entry.status = res.status;
          if (!res.ok) { report.endpoints.push(entry); continue; }
          const data = await res.json();
          const paths = {
            "events[0].competitions[0].competitors": data?.events?.[0]?.competitions?.[0]?.competitors,
            "leaderboard[0].competitors": data?.leaderboard?.[0]?.competitors,
            "competitions[0].competitors": data?.competitions?.[0]?.competitors,
            "competitors": data?.competitors
          };
          entry.topLevelKeys = Object.keys(data || {});
          entry.pathCounts = {};
          let first = null;
          for (const [k,v] of Object.entries(paths)) {
            entry.pathCounts[k] = Array.isArray(v) ? v.length : (v ? "not-array" : 0);
            if (!first && Array.isArray(v) && v.length) first = v[0];
          }
          entry.firstCompetitor = first || null;
          report.endpoints.push(entry);
          if (first) break;
        } catch (e) { entry.error = e.message; report.endpoints.push(entry); }
      }
      return j(report);
    }

    // default: serve the page
    return new Response(HTML, { headers: { "Content-Type":"text/html;charset=UTF-8" } });
  }
};

function parseAny(data) {
  let comps = [];
  const tryPaths = [
    () => data?.events?.[0]?.competitions?.[0]?.competitors,
    () => data?.leaderboard?.[0]?.competitors,
    () => data?.competitions?.[0]?.competitors,
    () => data?.competitors,
    () => data?.events?.[0]?.competitors
  ];
  for (const fn of tryPaths) { try { const r = fn(); if (Array.isArray(r) && r.length) { comps = r; break; } } catch(e){} }
  if (!comps.length) return [];

  return comps.map((c) => {
    const a = c.athlete || c.competitor || {};
    const name = a.displayName || a.fullName || c.displayName || "";
    let country = "";
    if (a.flag) country = a.flag.alt || a.flag.abbreviation || "";
    if (!country && a.birthPlace) country = a.birthPlace.countryAbbreviation || a.birthPlace.country || "";

    // TOTAL to-par: prefer scoreToPar statistic (accurate for in-progress players)
    let total = null;
    const stat = c.statistics?.find?.(s => s.name === "scoreToPar");
    if (stat && stat.value !== undefined && stat.value !== null) {
      const n = parseInt(stat.value);
      total = isNaN(n) ? null : n;
    }
    if (total === null) {
      const sv = c.score?.displayValue;
      if (sv !== undefined && sv !== null && sv !== "-" && sv !== "--") {
        if (sv === "E" || sv === "0") total = 0;
        else { const n = parseInt(sv); if (!isNaN(n)) total = n; }
      }
    }

    // THRU
    let thru = "-";
    const st = c.status || {};
    if (st.type?.completed === true) thru = "F";
    else if (st.displayThru) thru = String(st.displayThru);
    else if (st.thru !== undefined && st.thru !== null && st.thru !== "") thru = String(st.thru);
    else if (st.teeTime && st.type?.state === "pre") {
      const m = /T(\d{2}):(\d{2})/.exec(st.teeTime);
      thru = m ? (m[1] + ":" + m[2]) : "-";
    }

    // POSITION
    const pos = st.position?.displayName || st.position?.id || c.order || "-";
    const ps = String(pos).toUpperCase();
    const cut = !!(st.type?.name === "cut" || ps.includes("CUT") || ps === "MC" || ps === "WD" || ps === "DQ");

    // ROUND COLUMNS: use linescores[].displayValue (to-par) keyed by period
    const lines = c.linescores || [];
    const rp = { 1: null, 2: null, 3: null, 4: null };
    lines.forEach((r) => {
      if (!r) return;
      const p = r.period;
      if (!p || p < 1 || p > 4) return;
      const dv = r.displayValue;
      if (dv === undefined || dv === null || dv === "-" || dv === "--" || dv === "") return;
      if (dv === "E") { rp[p] = 0; return; }
      const n = parseInt(dv);
      if (!isNaN(n)) rp[p] = n;
    });

    return {
      name, country, pos: String(pos), total, thru,
      r1: rp[1], r2: rp[2], r3: rp[3], r4: rp[4],
      cut,
      sortOrder: (c.sortOrder !== undefined ? c.sortOrder : 9999)
    };
  }).filter(p => p.name);
}
