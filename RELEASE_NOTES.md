# 🏆 FC 26 Tournament Manager — Release Notes

## Version Update: Playoff Qualification Engine, Penalty Scores & Mobile UI Polish

This release introduces major feature enhancements, mathematical qualification calculations, UI/UX polish, and mobile layout optimizations.

---

### 1. 🥅 Penalty Shootout Scores
- **Manual Penalty Score Entry**: Tied playoff matches (Eliminator / Grand Final) now require and record exact penalty shootout goal counts for both teams.
- **Fixture Display**: Penalty scores are formatted cleanly on fixture cards (e.g., `(7–6 pen)`).
- **Historical Retrofit**: Preserved and added historical penalty shootout scores for past tournaments (Tournament 3: `7–6`, Tournament 10: `5–3`).

---

### 2. 🧮 Mathematical Qualification Engine & Badges
- **Exact Qualification Engine**: Built a DFS backtracking engine (`qualification.js`) with position-range analysis to determine team qualification status after every completed match.
- **Goal Difference (GD) & Tie-Breaker Handling**: Correctly handles unbounded GD variance alongside Points, Goals For (GF), and Head-to-Head (H2H) rules.
- **Standings Status Badges**: Added status badges to the leftmost column of the Standings Table:
  - 🟢 **Qualified**: 100% mathematical guarantee for Playoffs / Final.
  - 🟡 **Alive**: Still in contention.
  - 🔴 **Eliminated**: Mathematically impossible to qualify.
- **Standings Instructions**: Left-aligned instruction text below the table ("Top 2 qualifies for the Final" / "Top team directly qualifies for the Final, 2nd and 3rd plays the Eliminator").

---

### 3. 🔥 Always-Visible Playoffs Preview
- **Playoffs Bracket Preview**: The Playoffs section is now always visible during the league phase using dashed preview cards.
- **Dynamic Slot Resolution**:
  - **3–4 Team Tournaments**: Any green-badged qualified team populates a Grand Final preview slot immediately.
  - **5-Team Tournaments**: Grand Final home slot locks when 1st place is mathematically locked; Eliminator slots populate with qualified teams guaranteed not to finish 1st.

---

### 4. 🔄 Match Score Reset Feature
- **Reset Saved Results**: Added a **"🔄 Reset Score"** button inside the match result modal for played fixtures.
- **Safe Reversion**: Reverts match status back to `PENDING`, clears scores and red cards, restores served suspensions, and safely cleans up premature playoff brackets.
- **Confirmation Guard**: Integrated confirmation modal to prevent accidental score resets.

---

### 5. 🎨 Visual Refinements & Mobile Optimization
- **Scores Display**: Losing team's goal count renders in red (`var(--red)`) across all match scores.
- **Terminology Updates**: Renamed "Saved Teams" and "+New Team" to "Saved Profiles" and "+New Profile".
- **Mobile Card Button Polish**:
  - Removed stretched `100%` full-width buttons on mobile cards (`@media (max-width: 640px)`).
  - Standardized compact button padding for `Spectate Live`, `Open`, `Delete`, and `Teams` buttons.
  - Centered action buttons horizontally (`.history-actions`), fixing off-center 8px shifts on mobile cards.
- **UI Polish**: Displayed Manager Name in profile dialogs for Viewers and improved text contrast for club names in dialogs.

---
