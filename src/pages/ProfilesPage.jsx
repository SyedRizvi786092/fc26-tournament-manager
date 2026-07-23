import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { saveProfile, deleteProfile } from '../services/firestoreService.js';
import EditProfileModal from '../components/modals/EditProfileModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useState } from 'react';

export default function ProfilesPage() {
  const { profiles, goToHub, modal, openModal, closeModal } = useStore();
  const { isAdmin, signOut, currentUser } = useAuth();
  const toast = useToast();
  const [editModal, setEditModal] = useState(null);

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
        <button className="btn btn-sm btn-secondary" onClick={goToHub}>← Home</button>
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

        {/* Saved Teams */}
        <div className="setup-card">
          <div className="setup-card-title" style={{ justifyContent: 'space-between' }}>
            👥 Saved Teams ({profiles.length})
            {isAdmin && (
              <button className="btn btn-sm btn-primary"
                onClick={() => openProfileModal(null)}
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>+ New Team</button>
            )}
          </div>
          {profiles.length ? profiles.map(p => {
            const teamCount  = (p.teams || []).length;
            const squadTotal = (p.teams || []).reduce((acc, t) => acc + (t.squad?.length || 0), 0);
            const clubLabel  = teamCount === 0 ? 'No teams'
                             : teamCount === 1 ? p.teams[0].clubName
                             : `${teamCount} teams`;
            return (
              <div key={p.id} className="profile-card">
                <div className="profile-avatar">⚽</div>
                <div className="profile-info">
                  <div className="profile-name">{p.managerName}</div>
                  <div className="profile-club">{clubLabel}</div>
                  <div className="profile-meta">{squadTotal} total squad players</div>
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
                      📋 Squad
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
      {modal?.type === 'confirm' && <ConfirmModal modal={modal} onClose={closeModal} />}
    </div>
  );
}
