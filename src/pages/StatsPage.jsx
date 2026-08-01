import { useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import {
  getAllManagerNames,
  getLifetimeStandings,
  getPerformanceStats,
  getGoalStats,
  getH2HStats,
  getFiercestRivalry,
  getClutchStats,
  getDisciplineStats,
} from '../logic/statsCalculator.js';

export default function StatsPage() {
  const { history, tournament } = useStore();
  const [showStats, setShowStats] = useState(false); // Hidden by default
  const [activeTab, setActiveTab] = useState('performance'); // performance | goals | h2h | clutch | discipline

  // Sorting state for Goal Machine
  const [goalSortKey, setGoalSortKey] = useState('GF'); // GF | GA | GD | avgGF

  // H2H Manager Selection State
  const allManagers = getAllManagerNames(history, tournament);
  const [managerA, setManagerA] = useState(allManagers[0] || '');
  const [managerB, setManagerB] = useState(allManagers[1] || allManagers[0] || '');

  // Calculate Data
  const lifetime = getLifetimeStandings(history, tournament);
  const perf     = getPerformanceStats(history, tournament);
  const goalData = getGoalStats(history, tournament);
  const h2hData  = getH2HStats(managerA, managerB, history, tournament);
  const rivalry  = getFiercestRivalry(history, tournament);
  const clutch   = getClutchStats(history, tournament);
  const disc     = getDisciplineStats(history, tournament);

  // Sorted Goal Machine
  const sortedGoalMachine = [...goalData.goalMachine].sort((a, b) => {
    if (goalSortKey === 'GA') return a.GA - b.GA; // lowest GA is better
    if (goalSortKey === 'GD') return b.GD - a.GD;
    if (goalSortKey === 'avgGF') return b.avgGF - a.avgGF;
    return b.GF - a.GF;
  });

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">Leaderboard &amp; Stats</span>
      </div>

      <div className="profiles-body" style={{ maxWidth: 840, paddingTop: 20 }}>

        {/* ── 1. DEFAULT VIEW: LIFETIME MANAGER STANDINGS ───────────────── */}
        <div className="setup-card">
          <div className="setup-card-title">📊 Lifetime Manager Standings</div>
          <div className="standings-wrap">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                  <th>Played</th>
                  <th>Wins 🏆</th>
                  <th>Runner-Up 🥈</th>
                </tr>
              </thead>
              <tbody>
                {lifetime.length ? lifetime.map((st, i) => (
                  <tr key={st.name}>
                    <td className="st-pos">{i + 1}</td>
                    <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{st.name}</td>
                    <td style={{ fontWeight: 600 }}>{st.played}</td>
                    <td style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 15 }}>🏆 {st.wins}</td>
                    <td style={{ fontWeight: 700, color: 'var(--t2)' }}>🥈 {st.runnerUps}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ padding: 30, color: 'var(--t3)', textAlign: 'center' }}>No history data found to compile stats.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 10 }}>
            * Standings are compiled from all completed tournaments in history.
          </p>
        </div>

        {/* ── 2. SHOW/HIDE STATS DROPDOWN TOGGLE BUTTON ──────────────────── */}
        <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
          <button className="btn btn-secondary" onClick={() => setShowStats(!showStats)} style={{ fontSize: 13, padding: '8px 22px' }}>
            {showStats ? 'Hide Stats ▴' : 'Show Stats ▾'}
          </button>
        </div>

        {/* ── 3. TABBED ANALYTICS SECTIONS (RENDERED WHEN SHOW STATS IS ACTIVE) ─ */}
        {showStats && (
          <>
            <div className="stats-tabs">
              <button className={`stats-tab ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
                📈 Performance
              </button>
              <button className={`stats-tab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
                ⚽ Goals &amp; Records
              </button>
              <button className={`stats-tab ${activeTab === 'h2h' ? 'active' : ''}`} onClick={() => setActiveTab('h2h')}>
                ⚔️ Head-to-Head
              </button>
              <button className={`stats-tab ${activeTab === 'clutch' ? 'active' : ''}`} onClick={() => setActiveTab('clutch')}>
                🏆 Clutch Factor
              </button>
              <button className={`stats-tab ${activeTab === 'discipline' ? 'active' : ''}`} onClick={() => setActiveTab('discipline')}>
                🟥 Bad Boy Leaderboard
              </button>
            </div>

            {/* ── TAB 1: PERFORMANCE LEADERBOARD ───────────────────────────── */}
            {activeTab === 'performance' && (
              <div>
                <div className="setup-card" style={{ marginBottom: 20 }}>
                  <div className="setup-card-title">📈 Detailed Match Record</div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>P</th><th>W</th><th>D</th><th>L</th>
                          <th>Win Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {perf.map((p, i) => (
                          <tr key={p.name}>
                            <td className="st-pos">{i + 1}</td>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{p.name}</td>
                            <td>{p.played}</td>
                            <td style={{ color: 'var(--green)', fontWeight: 700 }}>{p.wins}</td>
                            <td style={{ color: 'var(--gold)' }}>{p.draws}</td>
                            <td style={{ color: 'var(--red)' }}>{p.losses}</td>
                            <td style={{ fontWeight: 800, color: 'var(--green)', fontSize: 15 }}>{p.winRate.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="setup-card">
                  <div className="setup-card-title">🔥 Current Form &amp; Longest Win Streak</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 12 }}>
                    {perf.map(p => (
                      <div key={p.name} className="record-card">
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{p.name}</span>
                          <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700 }}>🔥 Streak: {p.longestWinStreak} W</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 12, color: 'var(--t3)', marginRight: 6 }}>Form:</span>
                          {p.form.length ? p.form.map((res, idx) => (
                            <span key={idx} className={`form-pill ${res === 'W' ? 'form-w' : res === 'D' ? 'form-d' : 'form-l'}`}>
                              {res}
                            </span>
                          )) : <span style={{ fontSize: 12, color: 'var(--t3)' }}>No matches</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: GOALS & RECORDS ────────────────────────────────────── */}
            {activeTab === 'goals' && (
              <div>
                <div className="setup-card" style={{ marginBottom: 20 }}>
                  <div className="setup-card-title" style={{ justifyContent: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>⚽ Goal Machine</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, marginLeft: 'auto' }}>
                      <span style={{ color: 'var(--t3)' }}>Sort:</span>
                      {['GF', 'GA', 'GD', 'avgGF'].map(key => (
                        <button
                          key={key}
                          className={`btn btn-sm ${goalSortKey === key ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '3px 9px', fontSize: 11 }}
                          onClick={() => setGoalSortKey(key)}
                        >
                          {key === 'avgGF' ? 'Avg' : key}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>GF</th><th>GA</th><th>GD</th><th>Avg Goals/Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGoalMachine.map((g, i) => (
                          <tr key={g.name}>
                            <td className="st-pos">{i + 1}</td>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{g.name}</td>
                            <td style={{ fontWeight: 800, color: 'var(--green)' }}>{g.GF}</td>
                            <td style={{ color: 'var(--red)' }}>{g.GA}</td>
                            <td style={{ fontWeight: 700, color: g.GD > 0 ? 'var(--green)' : g.GD < 0 ? 'var(--red)' : 'var(--t2)' }}>
                              {g.GD > 0 ? `+${g.GD}` : g.GD}
                            </td>
                            <td style={{ fontWeight: 700 }}>{g.avgGF.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="setup-card" style={{ marginBottom: 20 }}>
                  <div className="setup-card-title">🛡️ Clean Sheets Leaderboard</div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>Played</th><th>Clean Sheets</th><th>Clean Sheet %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {goalData.cleanSheets.map((c, i) => (
                          <tr key={c.name}>
                            <td className="st-pos">{i + 1}</td>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{c.name}</td>
                            <td>{c.played}</td>
                            <td style={{ fontWeight: 800, color: 'var(--green)' }}>🛡️ {c.cleanSheets}</td>
                            <td style={{ fontWeight: 800, color: 'var(--green)' }}>{c.cleanSheetPct.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="record-grid">
                  <div className="setup-card">
                    <div className="setup-card-title">🔥 Largest Margin Wins</div>
                    {goalData.largestMargin.length ? goalData.largestMargin.map(m => (
                      <div key={m.id} className="record-card" style={{ marginBottom: 8 }}>
                        <div className="record-title">{m.tournamentName} &ensp;·&ensp; {m.matchLabel}</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {m.winner} <span style={{ color: 'var(--green)' }}>{m.wScore} – {m.lScore}</span> {m.loser}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Margin: +{m.margin} Goals</div>
                      </div>
                    )) : <div style={{ fontSize: 13, color: 'var(--t3)' }}>No played matches found.</div>}
                  </div>

                  <div className="setup-card">
                    <div className="setup-card-title">⚽ Highest Scoring Matches</div>
                    {goalData.highestScoring.length ? goalData.highestScoring.map(m => (
                      <div key={m.id} className="record-card" style={{ marginBottom: 8 }}>
                        <div className="record-title">{m.tournamentName} &ensp;·&ensp; {m.matchLabel}</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {m.homeName} <span style={{ color: 'var(--gold)' }}>{m.homeScore} – {m.awayScore}</span> {m.awayName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Total: {m.totalGoals} Goals</div>
                      </div>
                    )) : <div style={{ fontSize: 13, color: 'var(--t3)' }}>No played matches found.</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: HEAD-TO-HEAD RIVALRY FINDER ───────────────────────── */}
            {activeTab === 'h2h' && (
              <div>
                {rivalry && (
                  <div className="champ-banner" style={{ padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>⚔️</div>
                    <div className="champ-label">Fiercest Playoff Rivalry</div>
                    <div className="champ-name" style={{ fontSize: 22 }}>
                      {rivalry.managerA} <span style={{ color: 'var(--gold)' }}>vs</span> {rivalry.managerB}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>
                      Met in {rivalry.playoffCount} Playoff / Final match{rivalry.playoffCount > 1 ? 'es' : ''}!
                    </div>
                  </div>
                )}

                <div className="h2h-card">
                  <div className="setup-card-title" style={{ marginBottom: 16 }}>
                    🔍 Interactive Manager Comparison
                  </div>

                  <div className="h2h-select-row">
                    <select className="h2h-select" value={managerA} onChange={e => setManagerA(e.target.value)}>
                      {allManagers.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <div className="h2h-versus">VS</div>

                    <select className="h2h-select" value={managerB} onChange={e => setManagerB(e.target.value)}>
                      {allManagers.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {h2hData ? (
                    <div>
                      <div className="h2h-stat-row">
                        <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{h2hData.aWins} W</span>
                        <span style={{ fontWeight: 600, color: 'var(--t2)' }}>League Match Wins (Total: {h2hData.totalPlayed})</span>
                        <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{h2hData.bWins} W</span>
                      </div>

                      <div className="h2h-stat-row">
                        <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{h2hData.aGoals}</span>
                        <span style={{ fontWeight: 600, color: 'var(--t2)' }}>Goals Scored Tally</span>
                        <span style={{ fontWeight: 700, color: 'var(--t1)' }}>{h2hData.bGoals}</span>
                      </div>

                      <div className="h2h-stat-row">
                        {h2hData.playoffPlayed > 0 ? (
                          <>
                            <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>{h2hData.aPlayoffWins} W</span>
                            <span style={{ fontWeight: 600, color: 'var(--t2)' }}>Playoff &amp; Final Wins (Total: {h2hData.playoffPlayed})</span>
                            <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 16 }}>{h2hData.bPlayoffWins} W</span>
                          </>
                        ) : (
                          <span style={{ width: '100%', textAlign: 'center', color: 'var(--t3)', fontStyle: 'italic', fontSize: 13 }}>
                            Never met in a playoff match before!
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--t3)', padding: 20 }}>
                      Select two different managers above to compare their head-to-head record!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 4: CLUTCH FACTOR ──────────────────────────────────────── */}
            {activeTab === 'clutch' && (
              <div>
                <div className="setup-card" style={{ marginBottom: 20 }}>
                  <div className="setup-card-title">🏆 Trophy Cabinet &amp; Finals Record</div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>Finals</th>
                          <th>Gold 🥇</th>
                          <th>Silver 🥈</th>
                          <th>Finals Win Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clutch.map((c, i) => (
                          <tr key={c.name}>
                            <td className="st-pos">{i + 1}</td>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{c.name}</td>
                            <td style={{ fontWeight: 600 }}>{c.totalFinals}</td>
                            <td style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 15 }}>🥇 {c.gold}</td>
                            <td style={{ fontWeight: 700, color: 'var(--t2)' }}>🥈 {c.silver}</td>
                            <td style={{ fontWeight: 800, color: 'var(--green)', fontSize: 15 }}>
                              {c.totalFinals > 0 ? `${c.finalsWinRate.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="setup-card">
                  <div className="setup-card-title">🥅 Penalty Shootout Record</div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>Shootouts Played</th><th>Won</th><th>Lost</th>
                          <th>Shootout Win Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clutch.map(c => (
                          <tr key={c.name}>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{c.name}</td>
                            <td>{c.shootoutsPlayed}</td>
                            <td style={{ color: 'var(--green)', fontWeight: 700 }}>{c.shootoutsWon}</td>
                            <td style={{ color: 'var(--red)' }}>{c.shootoutsLost}</td>
                            <td style={{ fontWeight: 800, color: c.shootoutsPlayed > 0 ? 'var(--gold)' : 'var(--t3)' }}>
                              {c.shootoutsPlayed > 0 ? `${c.shootoutWinRate.toFixed(1)}%` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 5: BAD BOY LEADERBOARD ────────────────────────────────── */}
            {activeTab === 'discipline' && (
              <div>
                <div className="setup-card" style={{ marginBottom: 20 }}>
                  <div className="setup-card-title">🟥 Manager Red Cards Record</div>
                  <div className="standings-wrap">
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                          <th>Matches Played</th><th>Total Red Cards 🟥</th><th>Cards / Match</th>
                        </tr>
                      </thead>
                      <tbody>
                        {disc.managerDiscipline.map((m, i) => (
                          <tr key={m.name}>
                            <td className="st-pos">{i + 1}</td>
                            <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{m.name}</td>
                            <td>{m.played}</td>
                            <td style={{ fontWeight: 800, color: 'var(--red)', fontSize: 15 }}>🟥 {m.redCards}</td>
                            <td style={{ fontWeight: 600 }}>{m.cardsPerMatch.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="setup-card">
                  <div className="setup-card-title">🥊 Most Carded Squad Players</div>
                  {disc.squadDiscipline.length ? (
                    <div className="standings-wrap">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th style={{ textAlign: 'left', paddingLeft: 10 }}>Player Name</th>
                            <th style={{ textAlign: 'left' }}>Manager</th>
                            <th>Total Red Cards 🟥</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disc.squadDiscipline.map((sp, i) => (
                            <tr key={`${sp.name}_${sp.manager}_${i}`}>
                              <td className="st-pos">{i + 1}</td>
                              <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>{sp.name}</td>
                              <td style={{ textAlign: 'left', color: 'var(--t2)' }}>{sp.manager}</td>
                              <td style={{ fontWeight: 800, color: 'var(--red)', fontSize: 15 }}>🟥 {sp.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--t3)', padding: 30 }}>
                      No squad player red cards logged yet.
                    </div>
                  )}
                </div>
              </div>
            )}

          </>
        )}

      </div>
    </div>
  );
}
