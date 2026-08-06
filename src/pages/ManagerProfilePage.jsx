import { useParams, Link } from 'react';
import { useMemo, useState } from 'react';
import useStore from '../store/useStore.js';
import { evaluateAllManagers, BADGE_CATALOG, TIER_META } from '../logic/achievements.js';
import { createTradeProposal } from '../services/firestoreService.js';
import { useToast } from '../contexts/ToastContext.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import BadgeDetailsModal from '../components/modals/BadgeDetailsModal.jsx';
import TradeProposalModal from '../components/modals/TradeProposalModal.jsx';

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export default function ManagerProfilePage() {
  const { id } = useParams();
  const { history, tournament, profiles, linkedProfile, isManager } = useStore();
  const toast = useToast();

  const [tierFilter, setTierFilter] = useState('all');
  const [selectedBadgeModal, setSelectedBadgeModal] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);

  const profile = useMemo(() => profiles.find(p => p.id === id), [profiles, id]);
  const evaluation = useMemo(() => {
    if (!profile) return null;
    return evaluateAllManagers(history, tournament, profiles).find(e => e.profileId === id);
  }, [history, tournament, profiles, id, profile]);

  if (!profile || !evaluation) {
    return (
      <div className="profiles-page">
        <div className="profiles-hdr">
          <Link to="/hall-of-fame" className="btn btn-sm btn-secondary">← Back</Link>
          <span className="profiles-hdr-title">Profile Not Found</span>
        </div>
        <div className="profiles-body">
          <EmptyState icon="❓" title="Manager Not Found" message="The requested manager profile does not exist." />
        </div>
      </div>
    );
  }

  const { level, stats, unlockedBadges, totalXP } = evaluation;
  const avatar = profile.avatar || '⚽';

  const tierColors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#b9f2ff'];
  const bannerColor = tierColors[Math.min(level.tierIndex, 4)];

  const filteredBadges = useMemo(() => {
    if (tierFilter === 'all') return BADGE_CATALOG;
    return BADGE_CATALOG.filter(b => b.tier === tierFilter);
  }, [tierFilter]);

  const canProposeTrade = isManager && linkedProfile && linkedProfile.id !== id;

  const handleProposeTrade = async (tradeData) => {
    await createTradeProposal({
      ...tradeData,
      fromProfileId: linkedProfile.id,
      fromManagerName: linkedProfile.managerName,
    });
    toast('Trade proposal sent! 📤', 'ok');
    setShowTradeModal(false);
  };

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/hall-of-fame" className="btn btn-sm btn-secondary">← Hall of Fame</Link>
        <span className="profiles-hdr-title">{profile.managerName}'s Profile</span>
      </div>

      <div className="profiles-body" style={{ maxWidth: 840, paddingTop: 20 }}>

        {/* Banner */}
        <div style={{
          background: `linear-gradient(135deg, var(--bg) 0%, ${bannerColor}33 100%)`,
          border: `1px solid ${bannerColor}66`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          boxShadow: `0 4px 12px ${bannerColor}11`
        }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>{avatar}</div>
          <h2 style={{ margin: 0 }}>{profile.managerName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: bannerColor }}>
            <span>{level.icon} Lv.{level.level}</span>
            <span>·</span>
            <span>{level.title}</span>
          </div>
          <div style={{ width: '100%', maxWidth: 400, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text)' }}>XP: {totalXP}</span>
              <span style={{ color: 'var(--text)' }}>Next: {level.xpRemainingForNextLevel}</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: bannerColor, width: `${(level.progress || 0) * 100}%` }} />
            </div>
          </div>
          {canProposeTrade && (
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-primary" onClick={() => setShowTradeModal(true)}>📤 Propose Trade</button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="setup-card" style={{ marginBottom: 24 }}>
          <div className="setup-card-title">Career Stats Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 12 }}>
            <StatBox label="Matches" value={stats.totalPlayed} />
            <StatBox label="Wins" value={stats.totalWins} color="var(--green)" />
            <StatBox label="Win Rate" value={`${stats.totalPlayed ? ((stats.totalWins/stats.totalPlayed)*100).toFixed(1) : 0}%`} color="var(--green)" />
            <StatBox label="Goals" value={stats.totalGF} />
            <StatBox label="Clean Sheets" value={stats.totalCleanSheets} color="var(--green)" />
            <StatBox label="Red Cards" value={stats.totalRedCards} color="var(--red)" />
            <StatBox label="Titles" value={stats.titles} color="var(--gold)" />
            <StatBox label="Runner-Ups" value={stats.runnerUps} color="var(--t2)" />
            <StatBox label="Longest Win Streak" value={stats.longestWinStreak} color="var(--gold)" />
          </div>
        </div>

        {/* Teams Section */}
        <div className="setup-card" style={{ marginBottom: 24 }}>
          <div className="setup-card-title">Teams</div>
          {profile.teams && profile.teams.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {profile.teams
                .slice()
                .sort((a, b) => (b.id === profile.favoriteTeamId ? 1 : 0) - (a.id === profile.favoriteTeamId ? 1 : 0))
                .map((t, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--code-bg)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>
                      {t.id === profile.favoriteTeamId && <span style={{ color: 'var(--gold)', marginRight: 6 }}>⭐</span>}
                      {t.clubName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text)' }}>
                      {t.squad ? t.squad.length : 0} Players
                    </div>
                  </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text)', fontSize: 13, padding: 12, textAlign: 'center' }}>No teams managed.</div>
          )}
        </div>

        {/* Badge Showcase */}
        <div className="setup-card">
          <div className="setup-card-title">Badge Showcase</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
            <button className={`btn btn-sm ${tierFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTierFilter('all')}>
              All
            </button>
            {TIER_ORDER.map(tier => (
              <button key={tier} className={`btn btn-sm ${tierFilter === tier ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTierFilter(tier)}>
                {TIER_META[tier].icon} {TIER_META[tier].label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {filteredBadges.map(badge => {
              const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
              const tierInfo = TIER_META[badge.tier];

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadgeModal({ badge, isUnlocked })}
                  style={{
                    background: 'var(--code-bg)',
                    border: `1px solid ${isUnlocked ? tierInfo.color : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    opacity: isUnlocked ? 1 : 0.35,
                    boxShadow: isUnlocked ? `0 0 8px ${tierInfo.color}33` : 'none',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <div style={{ fontSize: 32 }}>{badge.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-h)' }}>{badge.name}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Modals */}
      {selectedBadgeModal && (
        <BadgeDetailsModal
          badge={selectedBadgeModal.badge}
          isUnlocked={selectedBadgeModal.isUnlocked}
          onClose={() => setSelectedBadgeModal(null)}
        />
      )}

      {showTradeModal && (
        <TradeProposalModal
          profiles={profiles}
          linkedProfile={linkedProfile}
          onClose={() => setShowTradeModal(false)}
          onPropose={handleProposeTrade}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: 'var(--code-bg)', padding: '12px 8px', borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--text-h)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
