# ⚽ FC 26 Tournament Manager

A state-of-the-art, real-time web application built for managing EA SPORTS FC / FIFA tournaments, tracking standings, predicting mathematical playoff qualification, analyzing detailed manager statistics, and trading squad players.

Deployed seamlessly as a Single Page Application (SPA) on Vercel with real-time Firebase cloud synchronization.

---

## 🔥 Key Features

### 1. 🚦 Real-Time Mathematical Qualification Engine
- **Position-Range Simulation**: Automatically calculates mathematical qualification scenarios after every recorded match using a depth-first simulation engine.
- **Visual Status Badges**:
  - 🟢 **Green Badge**: Guaranteed Playoff / Final qualification.
  - 🟡 **Yellow Badge**: Mathematically alive to qualify.
  - 🔴 **Red Badge**: Mathematically eliminated.
- **Dynamic Playoff Preview Cards**: Automatically locks and updates team names in playoff fixtures (Eliminator / Final) as soon as qualification positions are mathematically guaranteed.

### 2. 📊 Comprehensive Leaderboard & Analytics Hub (`/stats`)
- **Default View**: Lifetime Manager Standings table (Rank, Manager, Played, Wins 🏆, Runner-Up 🥈).
- **Interactive Show/Hide Toggle**: Minimize/maximize detailed analytics on demand.
- **5 Detailed Analytics Categories**:
  1. 📈 **Performance Leaderboard**: Match W/D/L records sorted by win %, 5-match form badges (`🟢 W`, `🟡 D`, `🔴 L`), and longest winning streak.
  2. ⚽ **Goals & Records**: Sortable Goal Machine standings (`GF`, `GA`, `GD`, `Avg`), Clean Sheets leaderboard with CS %, and Top 5 Largest Margin Wins / Highest Scoring Fixtures.
  3. ⚔️ **Head-to-Head Rivalry Finder**: Interactive Manager A vs Manager B selector with direct match records, goal tallies, and playoff wins + automatic Fiercest Rivalry banner callout.
  4. 🏆 **Clutch Factor**: Trophy Cabinet (Gold 🥇, Silver 🥈, Total Finals, Finals Win Rate %) and Penalty Shootout W-L record.
  5. 🟥 **Bad Boy Leaderboard**: Manager Red Cards record & Top Carded Squad Players leaderboard.

### 3. 🔍 Searchable & Filterable Tournament History (`/history`)
- **Instant Search**: Search completed tournaments by Tournament Name or Champion/Manager Name.
- **Multi-Parameter Filters**: Filter by Player Count (`3`, `4`, `5` players) and Legs (`1` or `2` legs).
- **Retrofit Past Tournaments**: Admin capability to retroactively add historical past tournaments.

### 4. 🔄 Owner Player Trade Feature (`/teams`)
- **1-Click Squad Trade Modal**: Allows the Admin/Owner to exchange squad players between any two saved manager profiles without manually deleting and re-adding players.
- **Smart Multi-Team Parsing**: Automatically filters out squadless entries and lists active team squads.

### 5. 🎨 Per-User Cloud Theme Accent Switcher (`/teams`)
- **Custom Accent Presets**: 🟢 Emerald Green, 🔵 Electric Blue, 🟡 Champions Gold, 🟣 Neon Violet, 🔴 Crimson Red.
- **Per-User Cloud Sync**: Theme preferences are saved per user account in Firestore (`config/settings`) so your personal theme choice follows you across all your devices in real-time.

### 6. ⚽ Advanced Match & Suspension Management
- **Manual Penalty Shootout Scores**: Track penalty shootout results (`7-6 pen`) for knockout draws.
- **Match Score Reset**: 1-click score reset button reverting played matches to pending status with automatic suspension and qualification re-evaluations.
- **Automatic Red Card Suspensions**: Automatically tracks red cards and enforces 1-matchday suspensions across league and playoff phases.

### 7. 📱 Mobile-First Responsive UI
- Styled with modern dark mode aesthetic, smooth HSL color gradients, glassmorphism, and responsive compact button layouts.

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, Javascript (ES6+)
- **Build Tool**: Vite 8
- **Routing**: `react-router-dom` v7 (Client-side SPA routes: `/`, `/history`, `/stats`, `/teams`, `/tournament/:id`)
- **State Management**: Zustand
- **Database & Sync**: Firebase Firestore (Real-time `onSnapshot` subscriptions)
- **Authentication**: Firebase Auth (Google Sign-In with Admin / Viewer roles)
- **Styling**: Custom Vanilla CSS Tokens & Utility classes (`index.css`)
- **Deployment**: Vercel (`vercel.json` SPA rewrite rules)

---

## 📁 Page Routes Structure

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage.jsx` | Main Hub, In-Progress Tournaments, Admin Creation Form |
| `/history` | `HistoryPage.jsx` | Searchable & Filterable Past Tournament History |
| `/history/:id` | `HistoryDetailsPage.jsx` | Deep-dive summary for completed tournaments |
| `/stats` | `StatsPage.jsx` | Leaderboard & 5 Analytics Tabs |
| `/teams` | `ProfilesPage.jsx` | Saved Manager Profiles, Squads, Trade Modal & Theme Settings |
| `/tournament/:id` | `MainPage.jsx` | Live/Active Tournament Hub (Standings, Matches, Suspensions) |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SyedRizvi786092/fc26-tournament-manager.git
   cd fc26-tournament-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
