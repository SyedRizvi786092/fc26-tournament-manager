# 🚀 FC 26 Tournament Manager — Release Notes

## Version 2.0 Major Update — SPA Routing, Mathematical Qualification Engine, Analytics Hub & Squad Management

This major update transforms the app into a full-fledged Single Page Application (SPA) featuring client-side routing, an automated mathematical qualification predictor, an analytics hub, squad player trading, searchable tournament history, per-user cloud theme accents, and mobile layout polish.

---

### 1. 🚦 Mathematical Qualification Engine & Standings Badges
- **Real-Time Qualification Simulation**: Evaluates remaining matchday scenarios after every saved match score using depth-first position-range calculation.
- **Standings Status Badges**: Left-aligned standings badges indicating:
  - 🟢 **Green Badge**: Guaranteed Playoff / Final qualification.
  - 🟡 **Yellow Badge**: Mathematically alive to qualify.
  - 🔴 **Red Badge**: Mathematically eliminated.
- **Dynamic Playoff Previews**: Replaces TBD in playoff matches (Eliminator / Final) with team names as soon as top/playoff positions are mathematically locked.
- **Left-Aligned Instructions**: Clean instruction text replacing cluttered legends.

---

### 2. 🔄 Match Score Reset Feature
- **Score Reversion**: Added a **"🔄 Reset Score"** button inside the Result Modal for played fixtures.
- **Safe State Reversion**: Reverts match status from `played` to `pending`, clears scores, automatically un-serves suspensions served in that match, cleans up red cards issued in it, and re-evaluates qualification badges.

---

### 3. 🌐 Client-Side SPA Page Routing (`react-router-dom`)
- **Bookmarkable Page URLs**: Migrated from internal state view-switching to `react-router-dom` v7 routes:
  - `/` — Home Page (In-Progress tournaments & Admin creation form)
  - `/history` — Tournament History List
  - `/history/:id` — Tournament History Details
  - `/stats` — Leaderboard & Stats Analytics Hub
  - `/teams` — Saved Manager Profiles, Trade Modal & Settings
  - `/tournament/:id` — Live Tournament Hub
- **Vercel SPA Configuration**: Added `vercel.json` SPA rewrite rules (`[{ "source": "/(.*)", "destination": "/index.html" }]`) to support direct URL access and browser refreshes on Vercel deployments out of the box.

---

### 4. 📊 Detailed Stats Implementation (`/stats`)
- **Lifetime Manager Standings**: Default landing view featuring Rank, Manager, Played, Wins 🏆, and Runner-Up 🥈 (Win Rate column removed).
- **Show/Hide Stats Toggle**: Dropdown button (`Show Stats ▾` / `Hide Stats ▴`) minimizing/maximizing analytics on demand.
- **5 Detailed Analytics Tabs**:
  1. 📈 **Performance Leaderboard**: W/D/L match records, last 5 match form badges (`🟢 W`, `🟡 D`, `🔴 L`), and all-time longest winning streak.
  2. ⚽ **Goals & Records**: Left-aligned sortable Goal Machine table (`GF`, `GA`, `GD`, `Avg`), Clean Sheets leaderboard, and Record Cards with matchday/phase details (`Summer Champions League 2026 · Matchday 3`).
  3. ⚔️ **Head-to-Head Rivalry Finder**: Interactive Manager A vs Manager B selector with "League Match Wins" label, goal tallies, playoff wins, and `"Never met in a playoff match before!"` fallback message + Fiercest Playoff Rivalry banner.
  4. 🏆 **Clutch Factor**: Trophy Cabinet (`Manager`, `Finals`, `Gold 🥇`, `Silver 🥈`, `Finals Win Rate %`) and Penalty Shootout Record (`Won`, `Lost`).
  5. 🟥 **Bad Boy Leaderboard**: Manager Red Cards record & Most Carded Squad Players leaderboard with accurate manager attribution.

---

### 5. 🔍 Search & Filtering in Tournament History (`/history`)
- **Instant Search Bar**: Filter completed tournaments by Tournament Name or Champion/Manager Name.
- **Multi-Parameter Dropdowns**: Filter by Player Count (`3`, `4`, `5` players) and Legs (`1` or `2` legs).
- **Empty Filter State**: Clean UI feedback when search or filter criteria return no matches.

---

### 6. 🔄 Player Trade Feature (`/teams`)
- **1-Click Squad Trade Modal**: Allows the Admin/Owner to exchange squad players between any two saved manager profiles without manually deleting and re-adding players.
- **Multi-Team Squad Parsing & Filtering**: Automatically extracts squads from multi-team profiles and filters out squadless team entries.

---

### 7. 🎨 Per-User Cloud UI Theme Accent Switcher (`/teams`)
- **5 Accent Color Presets**: 🟢 Emerald Green (`#00c896`), 🔵 Electric Blue (`#4a90e2`), 🟡 Champions Gold (`#f5a623`), 🟣 Neon Violet (`#9f7aea`), 🔴 Crimson Red (`#f56565`).
- **Per-User Cloud Sync**: Theme preferences are saved per user account in Firestore (`config/settings`) under `userThemes[uid]`, updating the UI instantly on local devices with a synchronous Toast notification and real-time syncing across all devices logged into the account.

---

### 8. 📱 Visual Refinements & Mobile Optimization
- **Compact Button Sizing**: Eliminated full-width button stretching on mobile cards for In-Progress, History, and Teams cards.
- **Centered Action Container**: Wrapped mobile action buttons in centered flex containers.
- **Score Color Distinction**: Displayed losing team score in subtle red for immediate visual contrast.
- **Manual Penalty Shootout Score Entry**: Option to record penalty shootout scores (`7-6 pen`) for knockout draws.
