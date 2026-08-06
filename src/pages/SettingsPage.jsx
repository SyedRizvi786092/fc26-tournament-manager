import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  saveProfile, deleteProfile, saveUserThemeAccent,
  linkManagerEmail, updateManagerCustomization,
  batchUpdateHistory, saveTournament,
} from '../services/firestoreService.js';
import { THEME_PRESETS, applyThemeAccent } from '../logic/theme.js';
import { evaluateAllManagers, TIER_META } from '../logic/achievements.js';
import EditProfileModal from '../components/modals/EditProfileModal.jsx';
import TradeModal from '../components/modals/TradeModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

const AVATAR_OPTIONS = ['⚽', '🦁', '👑', '⚡', '🏆', '🦅', '🔥', '🎩', '🐺', '🦈', '💎', '🎯', '🛡️', '⭐', '🐉', '🦊'];

function norm(name) { return (name || '').trim().toLowerCase(); }

export default function SettingsPage() {
  const {
    profiles, history, tournament, themeAccent, setThemeAccent,
    modal, openModal, closeModal, linkedProfile, isManager,
  } = useStore();
  const { isAdmin, signOut, currentUser } = useAuth();
  const toast = useToast();

  const [editModal, setEditModal] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [linkEmails, setLinkEmails] = useState({});
  const [migrating, setMigrating] = useState(false);

  // Get achievement data for manager summary
  const managerData = useMemo(() => {
    if (!profiles.length) return {};
    const results = evaluateAllManagers(history, tournament, profiles);
    const map = {};
    results.forEach(r => { map[r.profileId] = r; });
    return map;
  }, [profiles, history, tournament]);

  const handleSaveProfile = async (profile) => {
    await saveProfile(profile);
    toast('Team profile saved ✓', 'ok');
  };

  const handleDeleteProfile = (id) => {
    const p = profiles.find(pr => pr.id === id);
    openModal({
      type: 'confirm',
      title: `🗑️ Delete "${p?.managerName || 'Team'}"`,
      msg: 'This will permanently remove this team profile. Existing tournament history is not affected.',
      onConfirm: async () => { await deleteProfile(id); toast('Team profile deleted', 'ok'); },
    });
  };

  const handleExecuteTrade = async (profA, profB, playerA, playerB) => {
    await saveProfile(profA);
    if (profA.id !== profB.id) {
      await saveProfile(profB);
    }
    toast(`Traded "${playerA}" ⇄ "${playerB}" successfully! ✓`, 'ok');
  };

  const handleThemeChange = async (preset) => {
    if (!currentUser) return;
    setThemeAccent(preset.hex);
    applyThemeAccent(preset.hex);
    localStorage.setItem(`fc26_theme_${currentUser.uid}`, preset.hex);
    toast(`Theme accent updated to ${preset.name} ✓`, 'ok');
    try {
      await saveUserThemeAccent(currentUser.uid, preset.hex);
    } catch (err) {
      console.error('Failed to sync user theme settings to cloud:', err);
    }
  };

  const handleSignOut = () => {
    openModal({
      type: 'confirm',
      title: '👋 Sign Out',
      msg: 'Are you sure you want to sign out?',
      onConfirm: signOut,
    });
  };

  const openProfileModal = (p) =>
    setEditModal({
      type:        'editProfile',
      profileId:   p?.id          ?? null,
      managerName: p?.managerName ?? '',
      teams:       p?.teams       ? [...p.teams] : [],
    });

  // ─── Admin: Link Email ─────────────────────────────────────────────────
  const handleLinkEmail = async (profile) => {
    const email = (linkEmails[profile.id] || '').trim();
    if (!email) { toast('Enter an email address', 'err'); return; }

    // Uniqueness check
    const existingProfile = profiles.find(
      p => p.id !== profile.id && p.linkedEmail && p.linkedEmail.trim().toLowerCase() === email.toLowerCase()
    );
    if (existingProfile) {
      toast(`Email already linked to ${existingProfile.managerName}!`, 'err');
      return;
    }

    await linkManagerEmail(profile.id, email);
    setLinkEmails(prev => ({ ...prev, [profile.id]: '' }));
    toast(`${profile.managerName} linked to ${email} ✓`, 'ok');
  };

  // ─── Admin: Migrate History ──────────────────────────────────────────────
  const handleMigrateHistory = async () => {
    setMigrating(true);
    try {
      let matched = 0, total = 0;
      const updatedEntries = [];

      for (const entry of history) {
        let modified = false;
        const updatedPlayers = (entry.players || []).map(player => {
          total++;
          if (player.profileId) { matched++; return player; } // already tagged
          const profile = profiles.find(p => norm(p.managerName) === norm(player.name));
          if (profile) {
            matched++;
            modified = true;
            return { ...player, profileId: profile.id };
          }
          return player;
        });
        if (modified) {
          updatedEntries.push({ ...entry, players: updatedPlayers });
        }
      }

      // Also migrate active tournament
      if (tournament) {
        let modified = false;
        const updatedPlayers = (tournament.players || []).map(player => {
          total++;
          if (player.profileId) { matched++; return player; }
          const profile = profiles.find(p => norm(p.managerName) === norm(player.name));
          if (profile) {
            matched++;
            modified = true;
            return { ...player, profileId: profile.id };
          }
          return player;
        });
        if (modified) {
          await saveTournament({ ...tournament, players: updatedPlayers });
        }
      }

      if (updatedEntries.length > 0) {
        await batchUpdateHistory(updatedEntries);
      }

      toast(`Migration complete! Matched ${matched}/${total} player entries across ${history.length} tournaments. ✓`, 'ok');
    } catch (err) {
      console.error('Migration failed:', err);
      toast('Migration failed. See console.', 'err');
    } finally {
      setMigrating(false);
    }
  };

  // ─── Manager: Avatar / Favorite Team ────────────────────────────────────
  const handleAvatarChange = async (emoji) => {
    if (!linkedProfile) return;
    await updateManagerCustomization(linkedProfile.id, { avatar: emoji });
    toast(`Avatar updated to ${emoji} ✓`, 'ok');
  };

  const handleFavoriteTeam = async (teamId) => {
    if (!linkedProfile) return;
    const newFav = linkedProfile.favoriteTeamId === teamId ? null : teamId;
    await updateManagerCustomization(linkedProfile.id, { favoriteTeamId: newFav });
    toast(newFav ? 'Favorite team set ⭐' : 'Favorite team cleared', 'ok');
  };

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">⚙️ Settings</span>
      </div>

      <div className="profiles-body">
        {/* Account info + Sign Out */}
        <div className="setup-card">
          <div className="setup-card-title">👤 Account</div>
          <div className="file-setting">
            <div className="fsr-info">
              <div className="fsr-label">{currentUser?.email}</div>
              <div className="fsr-sub">
                {isAdmin ? '👑 Admin — full access' : isManager ? '🎮 Manager — limited access' : '👁️ Viewer — read-only access'}
              </div>
            </div>
            <div className="fsr-actions">
              <button className="btn btn-sm btn-danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* 🎮 Manager Customization (only for linked managers) */}
        {(isManager || isAdmin) && linkedProfile && (
          <div className="setup-card">
            <div className="setup-card-title">🎮 Manager Customization</div>

            {/* Avatar Emoji Selector */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, display: 'block' }}>Avatar Emoji</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {AVATAR_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className={`btn btn-sm ${linkedProfile.avatar === emoji ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: 20, padding: '6px 10px', minWidth: 42 }}
                    onClick={() => handleAvatarChange(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Favorite Team Marker */}
            {linkedProfile.teams?.length > 1 && (
              <div>
                <label style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, display: 'block' }}>⭐ Favorite Team</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {linkedProfile.teams.map(team => (
                    <button
                      key={team.id}
                      className={`btn btn-sm ${linkedProfile.favoriteTeamId === team.id ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleFavoriteTeam(team.id)}
                    >
                      {linkedProfile.favoriteTeamId === team.id && '⭐ '}{team.clubName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manager Level Summary */}
            {managerData[linkedProfile.id] && (() => {
              const md = managerData[linkedProfile.id];
              const tier = TIER_META[md.level?.tierIndex !== undefined ? ['bronze','silver','gold','platinum','diamond'][md.level.tierIndex] || 'bronze' : 'bronze'];
              return (
                <div style={{ marginTop: 16, padding: 12, background: 'var(--bg2)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{md.level?.icon}</span>
                    <span style={{ fontWeight: 700 }}>Lv. {md.level?.level}</span>
                    <span style={{ color: 'var(--t2)', fontSize: 13 }}>{md.level?.title}</span>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${(md.level?.progress || 0) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: 6, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>
                    <span>{md.totalXP} XP</span>
                    <span>🏅 {md.unlockedBadges?.length || 0}/40 badges</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* 🎨 Per-User UI Theme Accent Switcher */}
        <div className="setup-card">
          <div className="setup-card-title">🎨 My Theme Accent</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>
            Choose your personal accent color preference. Saved to your cloud account so it follows you on all your devices.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {THEME_PRESETS.map(preset => {
              const isActive = (themeAccent || '#00c896').toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ gap: 8, padding: '8px 14px', fontSize: 13 }}
                  onClick={() => handleThemeChange(preset)}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: preset.hex, display: 'inline-block', border: '1px solid rgba(255,255,255,.3)' }} />
                  {preset.name} {isActive ? '✓' : ''}
                </button>
              );
            })}
          </div>
        </div>

        {/* 🔗 Admin: Link Manager Accounts */}
        {isAdmin && (
          <div className="setup-card">
            <div className="setup-card-title">🔗 Link Manager Accounts</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>
              Pair a Google email address to each manager profile to grant them Manager privileges (avatar, favorite team, trade proposals).
            </p>

            {profiles.length ? profiles.map(p => (
              <div key={p.id} className="file-setting" style={{ marginBottom: 10 }}>
                <div className="fsr-info" style={{ minWidth: 120 }}>
                  <div className="fsr-label">{p.avatar || '⚽'} {p.managerName}</div>
                  {p.linkedEmail && (
                    <div className="fsr-sub" style={{ color: 'var(--accent)' }}>✓ {p.linkedEmail}</div>
                  )}
                </div>
                <div className="fsr-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                  <input
                    type="email"
                    placeholder="Google email"
                    value={linkEmails[p.id] ?? (p.linkedEmail || '')}
                    onChange={e => setLinkEmails(prev => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ flex: 1, minWidth: 160 }}
                  />
                  <button className="btn btn-sm btn-primary" onClick={() => handleLinkEmail(p)}>
                    {p.linkedEmail ? 'Update' : 'Link'}
                  </button>
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Create manager profiles first.</p>
            )}
          </div>
        )}

        {/* 🔄 Admin: History Migration */}
        {isAdmin && (
          <div className="setup-card">
            <div className="setup-card-title">🔄 Migrate History Data</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 14 }}>
              One-time migration: Tags all historical tournament player entries with their saved profile IDs.
              This enables the achievement engine to accurately track stats across tournaments.
            </p>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleMigrateHistory}
              disabled={migrating || !profiles.length}
            >
              {migrating ? 'Migrating…' : '🔄 Run Migration'}
            </button>
          </div>
        )}

        {/* Saved Teams */}
        <div className="setup-card">
          <div className="setup-card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>👥 Saved Profiles ({profiles.length})</span>
            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowTradeModal(true)}
                  disabled={profiles.length < 1}
                  style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}
                >
                  🔄 Trade Players
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => openProfileModal(null)}
                  style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}
                >
                  + New Profile
                </button>
              </div>
            )}
          </div>

          {profiles.length ? profiles.map(p => {
            const teamCount  = (p.teams || []).length;
            const clubLabel  = teamCount === 0 ? 'No teams'
                             : teamCount === 1 ? p.teams[0].clubName
                             : `${teamCount} teams`;
            const md = managerData[p.id];
            return (
              <div key={p.id} className="profile-card">
                <div className="profile-avatar">{p.avatar || '⚽'}</div>
                <div className="profile-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link to={`/profile/${p.id}`} className="profile-name" style={{ color: 'var(--t1)', textDecoration: 'none' }}>
                      {p.managerName}
                    </Link>
                    {md && (
                      <span style={{ fontSize: 12, color: 'var(--t2)' }}>
                        {md.level?.icon} Lv.{md.level?.level}
                      </span>
                    )}
                  </div>
                  <div className="profile-club">{clubLabel}</div>
                </div>
                <div className="profile-actions">
                  {isAdmin ? (
                    <>
                      <button className="btn btn-sm btn-secondary" onClick={() => openProfileModal(p)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-sm btn-danger btn-icon"
                        onClick={() => handleDeleteProfile(p.id)} title="Delete team">🗑️</button>
                    </>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => openProfileModal(p)}>
                      📋 Teams
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
            <EmptyState icon="👤" title="No Teams Saved Yet"
              message="Create team profiles here first. You can then select them when setting up a tournament." />
          )}
        </div>
      </div>

      {editModal && (
        <EditProfileModal
          modal={editModal}
          readOnly={!isAdmin}
          onClose={() => setEditModal(null)}
          onSave={handleSaveProfile}
        />
      )}
      {showTradeModal && (
        <TradeModal
          profiles={profiles}
          onClose={() => setShowTradeModal(false)}
          onTrade={handleExecuteTrade}
        />
      )}
      {modal?.type === 'confirm' && <ConfirmModal modal={modal} onClose={closeModal} />}
    </div>
  );
}
