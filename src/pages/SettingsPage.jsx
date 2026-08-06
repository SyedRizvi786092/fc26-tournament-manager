import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import {
  saveProfile, deleteProfile, saveUserThemeAccent, saveUserName,
  updateManagerCustomization, sendManagerRequest,
} from '../services/firestoreService.js';
import { THEME_PRESETS, applyThemeAccent } from '../logic/theme.js';
import { evaluateAllManagers, TIER_META } from '../logic/achievements.js';

import EditProfileModal from '../components/modals/EditProfileModal.jsx';
import TradeModal from '../components/modals/TradeModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EditNameModal from '../components/modals/EditNameModal.jsx';
import ChangeAvatarModal from '../components/modals/ChangeAvatarModal.jsx';
import ChangeThemeModal from '../components/modals/ChangeThemeModal.jsx';
import RegisterManagerModal from '../components/modals/RegisterManagerModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    profiles, history, tournament, themeAccent, setThemeAccent,
    userNames, modal, openModal, closeModal, linkedProfile, isManager,
    managerRequests,
  } = useStore();
  const { isAdmin, signOut, currentUser } = useAuth();
  const toast = useToast();

  const [editProfileModal, setEditProfileModal] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Get achievement data for manager summary
  const managerData = useMemo(() => {
    if (!profiles.length) return {};
    const results = evaluateAllManagers(history, tournament, profiles);
    const map = {};
    results.forEach(r => { map[r.profileId] = r; });
    return map;
  }, [profiles, history, tournament]);

  // Current display name
  const currentDisplayName = (currentUser && userNames?.[currentUser.uid]) || currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'User');

  // Current active theme name
  const currentThemePreset = THEME_PRESETS.find(
    p => p.hex.toLowerCase() === (themeAccent || '#00c896').toLowerCase()
  ) || THEME_PRESETS[0];

  // User's manager registration request
  const userRequest = currentUser
    ? managerRequests.find(r => r.uid === currentUser.uid)
    : null;

  // Handlers
  const handleSaveName = async (newName) => {
    if (!currentUser) return;
    await saveUserName(currentUser.uid, newName);
    toast('Display name updated ✓', 'ok');
  };

  const handleSaveAvatar = async (newAvatar) => {
    if (!linkedProfile) return;
    await updateManagerCustomization(linkedProfile.id, { avatar: newAvatar });
    toast(`Avatar updated to ${newAvatar} ✓`, 'ok');
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

  const handleSignOut = () => {
    openModal({
      type: 'confirm',
      title: '👋 Sign Out',
      msg: 'Are you sure you want to sign out?',
      onConfirm: signOut,
    });
  };

  const handleSendManagerRequest = async (requestData) => {
    await sendManagerRequest(requestData);
    toast('Registration request submitted! 📩', 'ok');
  };

  const openProfileModal = (p) =>
    setEditProfileModal({
      type:        'editProfile',
      profileId:   p?.id          ?? null,
      managerName: p?.managerName ?? '',
      teams:       p?.teams       ? [...p.teams] : [],
    });

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">⚙️ Settings</span>
      </div>

      <div className="profiles-body" style={{ maxWidth: 720 }}>
        {/* Flat Single Card for Main Settings Items */}
        <div className="setup-card">

          {/* 1. Google Account */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Google Account</div>
              <div className="setting-value">{currentUser?.email}</div>
            </div>
            <div className="setting-action">
              <button className="btn btn-sm btn-danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>

          <div className="setting-divider" />

          {/* 2. Name */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Name</div>
              <div className="setting-value">{currentDisplayName}</div>
            </div>
            <div className="setting-action">
              <button className="btn btn-sm btn-secondary" onClick={() => setShowEditNameModal(true)}>✏️ Edit</button>
            </div>
          </div>

          <div className="setting-divider" />

          {/* 3. Manager Profile */}
          <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <div className="setting-label" style={{ marginBottom: 10 }}>Manager Profile</div>
            {isManager && linkedProfile ? (
              <div>
                {/* Manager Card */}
                {(() => {
                  const md = managerData[linkedProfile.id];
                  const tierColors = ['#cd7f32', '#c0c0c0', '#ffd700', '#e5e4e2', '#b9f2ff'];
                  const bannerColor = md ? tierColors[Math.min(md.level?.tierIndex || 0, 4)] : 'var(--accent)';
                  const clubLabel = linkedProfile.teams?.length === 1
                    ? linkedProfile.teams[0].clubName
                    : linkedProfile.teams?.length > 1
                    ? `${linkedProfile.teams.length} teams`
                    : 'No teams';

                  return (
                    <div style={{
                      background: 'var(--code-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 16,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ fontSize: 36, lineHeight: 1 }}>{linkedProfile.avatar || '⚽'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: 16 }}>{linkedProfile.managerName}</span>
                            {md && (
                              <span style={{ fontSize: 12, fontWeight: 700, color: bannerColor, background: `${bannerColor}22`, padding: '2px 8px', borderRadius: 10 }}>
                                {md.level?.icon} Lv.{md.level?.level} · {md.level?.title}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 2 }}>{clubLabel}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {md && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: bannerColor, width: `${(md.level?.progress || 0) * 100}%`, transition: 'width 0.4s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                            <span>{md.totalXP} XP</span>
                            <span>🏅 {md.unlockedBadges?.length || 0} badges</span>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => navigate(`/profile/${linkedProfile.id}`)}
                          style={{ fontSize: 13 }}
                        >
                          See full profile →
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                  {userRequest?.status === 'pending'
                    ? '⏳ Manager registration request is pending admin approval'
                    : 'You are currently logged in as a Viewer.'}
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => setShowRegisterModal(true)}
                >
                  Register as Manager
                </button>
              </div>
            )}
          </div>

          <div className="setting-divider" />

          {/* 4. Avatar Emoji */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Avatar Emoji</div>
              <div className="setting-value" style={{ fontSize: 22 }}>
                {linkedProfile?.avatar || '⚽'}
              </div>
            </div>
            <div className="setting-action">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setShowAvatarModal(true)}
                disabled={!isManager || !linkedProfile}
              >
                Change
              </button>
            </div>
          </div>

          <div className="setting-divider" />

          {/* 5. App Theme */}
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">App Theme</div>
              <div className="setting-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: currentThemePreset.hex, display: 'inline-block', border: '1px solid rgba(255,255,255,.3)' }} />
                <span>{currentThemePreset.name}</span>
              </div>
            </div>
            <div className="setting-action">
              <button className="btn btn-sm btn-secondary" onClick={() => setShowThemeModal(true)}>Change</button>
            </div>
          </div>

        </div>

        {/* 7. Registered Managers (ADMIN ONLY) */}
        {isAdmin && (
          <div className="setup-card" style={{ marginTop: 24 }}>
            <div className="setup-card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span>👥 Registered Managers ({profiles.length})</span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowTradeModal(true)}
                  disabled={profiles.length < 2}
                  style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}
                >
                  🔄 Trade Players
                </button>
              </div>
            </div>

            {profiles.length ? (
              <div className="registered-managers-list">
                {profiles.map(p => {
                  const teamCount  = (p.teams || []).length;
                  const clubLabel  = teamCount === 0 ? 'No teams'
                                   : teamCount === 1 ? p.teams[0].clubName
                                   : `${teamCount} teams`;
                  const md = managerData[p.id];
                  return (
                    <div key={p.id} className="manager-card-redesigned">
                      <div className="mcr-avatar">{p.avatar || '⚽'}</div>
                      <div className="mcr-details">
                        <div className="mcr-header">
                          <Link to={`/profile/${p.id}`} className="mcr-name">
                            {p.managerName}
                          </Link>
                          {md && (
                            <span className="mcr-level">
                              {md.level?.icon} Lv.{md.level?.level}
                            </span>
                          )}
                        </div>
                        <div className="mcr-club">{clubLabel}</div>
                        {p.linkedEmail && (
                          <div className="mcr-email">✓ {p.linkedEmail}</div>
                        )}
                      </div>
                      <div className="mcr-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => openProfileModal(p)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteProfile(p.id)} title="Delete manager">
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon="👤" title="No Managers Registered Yet" message="Manager profiles will appear here once registered." />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {editProfileModal && (
        <EditProfileModal
          modal={editProfileModal}
          readOnly={!isAdmin}
          onClose={() => setEditProfileModal(null)}
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

      {showEditNameModal && (
        <EditNameModal
          currentName={currentDisplayName}
          onClose={() => setShowEditNameModal(false)}
          onSave={handleSaveName}
        />
      )}

      {showAvatarModal && (
        <ChangeAvatarModal
          currentAvatar={linkedProfile?.avatar}
          onClose={() => setShowAvatarModal(false)}
          onSave={handleSaveAvatar}
        />
      )}

      {showThemeModal && (
        <ChangeThemeModal
          currentHex={themeAccent}
          onClose={() => setShowThemeModal(false)}
          onSelectPreset={handleThemeChange}
        />
      )}

      {showRegisterModal && (
        <RegisterManagerModal
          currentUser={currentUser}
          existingRequest={userRequest}
          onClose={() => setShowRegisterModal(false)}
          onSubmitRequest={handleSendManagerRequest}
        />
      )}

      {modal?.type === 'confirm' && <ConfirmModal modal={modal} onClose={closeModal} />}
    </div>
  );
}
