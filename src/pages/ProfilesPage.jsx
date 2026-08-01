import { useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { saveProfile, deleteProfile, saveUserSettings } from '../services/firestoreService.js';
import { THEME_PRESETS } from '../logic/theme.js';
import EditProfileModal from '../components/modals/EditProfileModal.jsx';
import TradeModal from '../components/modals/TradeModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function ProfilesPage() {
  const { profiles, themeAccent, modal, openModal, closeModal } = useStore();
  const { isAdmin, signOut, currentUser } = useAuth();
  const toast = useToast();

  const [editModal, setEditModal] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);

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
    await saveUserSettings(currentUser.uid, { themeAccent: preset.hex });
    toast(`Theme accent updated to ${preset.name} ✓`, 'ok');
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

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">Teams &amp; Settings</span>
      </div>

      <div className="profiles-body">
        {/* Account info + Sign Out */}
        <div className="setup-card">
          <div className="setup-card-title">👤 Account</div>
          <div className="file-setting">
            <div className="fsr-info">
              <div className="fsr-label">{currentUser?.email}</div>
              <div className="fsr-sub">{isAdmin ? '👑 Admin — full access' : '👁️ Viewer — read-only access'}</div>
            </div>
            <div className="fsr-actions">
              <button className="btn btn-sm btn-danger" onClick={handleSignOut}>Sign Out</button>
            </div>
          </div>
        </div>

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
            return (
              <div key={p.id} className="profile-card">
                <div className="profile-avatar">⚽</div>
                <div className="profile-info">
                  <div className="profile-name">{p.managerName}</div>
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
