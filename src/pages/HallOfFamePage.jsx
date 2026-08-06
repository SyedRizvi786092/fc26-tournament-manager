import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { evaluateAllManagers, BADGE_CATALOG, TIER_ORDER, TIER_META } from '../logic/achievements.js';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function HallOfFamePage() {
  const { history, tournament, profiles } = useStore();
  const [activeTab, setActiveTab] = useState('leaderboard'); // leaderboard | catalog
  const [tierFilter, setTierFilter] = useState('all');

  const evaluations = useMemo(() => evaluateAllManagers(history, tournament, profiles), [history, tournament, profiles]);

  // For Badge Catalog
  const allUnlockedBadgeIds = useMemo(() => {
    const set = new Set();
    evaluations.forEach(ev => ev.unlockedBadges.forEach(b => set.add(b.id)));
    return set;
  }, [evaluations]);

  const filteredBadges = useMemo(() => {
    if (tierFilter === 'all') return BADGE_CATALOG;
    return BADGE_CATALOG.filter(b => b.tier === tierFilter);
  }, [tierFilter]);

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">🏛️ Hall of Fame</span>
      </div>

      <div className="profiles-body" style={{ maxWidth: 840, paddingTop: 20 }}>
        <div className="stats-tabs">
          <button className={`stats-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
            🏆 Leaderboard
          </button>
          <button className={`stats-tab ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
            🏅 Badge Catalog
          </button>
        </div>

        {activeTab === 'leaderboard' && (
          <div className="setup-card">
            <div className="setup-card-title">Manager Ranking</div>
            <div className="standings-wrap">
              <table className="standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th style={{ textAlign: 'left', paddingLeft: 10 }}>Manager</th>
                    <th>Level</th>
                    <th style={{ width: '30%' }}>Progress</th>
                    <th>Badges</th>
                    <th>Titles</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluations.map((ev, i) => {
                    const p = profiles.find(pr => pr.id === ev.profileId);
                    const avatar = p?.avatar || '⚽';
                    const tierColors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#b9f2ff'];
                    const bannerColor = tierColors[Math.min(ev.level.tierIndex || 0, 4)];
                    return (
                      <tr key={ev.profileId}>
                        <td className="st-pos">{i + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 700, paddingLeft: 10 }}>
                          <Link to={`/profile/${ev.profileId}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{avatar}</span>
                            <span>{ev.managerName}</span>
                          </Link>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{ev.level.icon} Lv.{ev.level.level}</span>
                            <span style={{ fontSize: 11, color: 'var(--t2)' }}>{ev.level.title}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' }}>
                            <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: bannerColor, width: `${(ev.level.progress || 0) * 100}%`, transition: 'width 0.4s ease' }} />
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'right' }}>
                              {ev.totalXP} XP
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>🏅 {ev.unlockedBadges.length}</td>
                        <td style={{ fontWeight: 800, color: 'var(--gold)' }}>🏆 {ev.stats.titles}</td>
                      </tr>
                    );
                  })}
                  {evaluations.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: 30, color: 'var(--t3)', textAlign: 'center' }}>No managers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              <button className={`btn btn-sm ${tierFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTierFilter('all')}>
                All
              </button>
              {TIER_ORDER.map(tier => (
                <button key={tier} className={`btn btn-sm ${tierFilter === tier ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTierFilter(tier)}>
                  {TIER_META[tier].icon} {TIER_META[tier].label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {filteredBadges.map(badge => {
                const isUnlocked = allUnlockedBadgeIds.has(badge.id);
                const unlockers = evaluations.filter(ev => ev.unlockedBadges.some(b => b.id === badge.id));
                const tierInfo = TIER_META[badge.tier];

                return (
                  <div key={badge.id} style={{
                    background: 'var(--code-bg)',
                    border: `1px solid ${isUnlocked ? tierInfo.color : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    opacity: isUnlocked ? 1 : 0.4,
                    boxShadow: isUnlocked ? `0 0 8px ${tierInfo.color}33` : 'none',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 24 }}>{badge.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--bg)', color: tierInfo.color }}>
                        {badge.xp} XP
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-h)' }}>{badge.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{badge.description}</div>
                    {isUnlocked && unlockers.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {unlockers.map(u => {
                          const p = profiles.find(pr => pr.id === u.profileId);
                          return (
                            <Link to={`/profile/${u.profileId}`} key={u.profileId} title={u.managerName} style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textDecoration: 'none' }}>
                              {p?.avatar || '⚽'}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
