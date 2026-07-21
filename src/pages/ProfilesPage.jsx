import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { saveProfile, deleteProfile } from '../services/firestoreService.js';
import { importDataToFirestore } from '../services/importService.js';
import EditProfileModal from '../components/modals/EditProfileModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useState } from 'react';

export default function ProfilesPage() {
  const { profiles, goToHub, modal, openModal, closeModal } = useStore();
  const { isAdmin, signOut, currentUser } = useAuth();
  const toast = useToast();
  const [editModal, setEditModal] = useState(null);
  const [importing, setImporting] = useState(false);

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

  const handleFileImport = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const data = JSON.parse(e.target.result);
        const count = await importDataToFirestore(data);
        toast(`Imported ${count} items into Cloud Firestore ✓`, 'ok');
      } catch (err) {
        console.error(err);
        toast('Failed to import JSON file. Invalid format!', 'err');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <button className="btn btn-sm btn-secondary" onClick={goToHub}>← Home</button>
        <span className="profiles-hdr-title">Teams &amp; Settings</span>
        <button className="btn btn-sm btn-danger" onClick={signOut} style={{ marginLeft: 'auto' }}>
          Sign Out
        </button>
      </div>

      <div className="profiles-body">
        {/* Account info */}
        <div className="setup-card">
          <div className="setup-card-title">👤 Account</div>
          <div className="file-setting">
            <div className="fsr-info">
              <div className="fsr-label">{currentUser?.email}</div>
              <div className="fsr-sub">{isAdmin ? '👑 Admin — full access' : '👁️ Viewer — read-only access'}</div>
            </div>
          </div>
        </div>

        {/* Data Import for Admin */}
        {isAdmin && (
          <div className="setup-card">
            <div className="setup-card-title">☁️ Cloud Migration &amp; Import</div>
            <div className="file-setting">
              <div className="fsr-info">
                <div className="fsr-label">Import JSON Data to Firestore</div>
                <div className="fsr-sub">Select fc26-tournament-data-all.json to seed tournaments &amp; team rosters</div>
              </div>
              <div className="fsr-actions">
                <label className="btn btn-sm btn-primary" style={{ cursor: 'pointer' }}>
                  {importing ? '⏳ Importing…' : '📂 Select JSON File'}
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    disabled={importing}
                    onChange={e => handleFileImport(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Saved Teams */}
        <div className="setup-card">
          <div className="setup-card-title" style={{ justifyContent: 'space-between' }}>
            👥 Saved Teams ({profiles.length})
            {isAdmin && (
              <button className="btn btn-sm btn-primary"
                onClick={() => setEditModal({ type: 'editProfile', profileId: null, managerName: '', preferredClub: '', squad: [] })}
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>+ New Team</button>
            )}
          </div>
          {profiles.length ? profiles.map(p => (
            <div
              key={p.id}
              className="profile-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setEditModal({ type: 'editProfile', profileId: p.id, managerName: p.managerName, preferredClub: p.preferredClub, squad: [...(p.squad || [])] })}
            >
              <div className="profile-avatar">⚽</div>
              <div className="profile-info">
                <div className="profile-name">{p.managerName}</div>
                <div className="profile-club">{p.preferredClub}</div>
                <div className="profile-meta">
                  {(p.squad || []).length} squad players &ensp;·&ensp; <span style={{ color: 'var(--green)', fontWeight: 600 }}>📋 Tap to view squad</span>
                </div>
              </div>
              <div className="profile-actions" onClick={e => e.stopPropagation()}>
                {isAdmin ? (
                  <>
                    <button className="btn btn-sm btn-secondary"
                      onClick={() => setEditModal({ type: 'editProfile', profileId: p.id, managerName: p.managerName, preferredClub: p.preferredClub, squad: [...(p.squad || [])] })}>
                      ✏️ Edit
                    </button>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDeleteProfile(p.id)} title="Delete team">🗑️</button>
                  </>
                ) : (
                  <button className="btn btn-sm btn-secondary"
                    onClick={() => setEditModal({ type: 'editProfile', profileId: p.id, managerName: p.managerName, preferredClub: p.preferredClub, squad: [...(p.squad || [])] })}>
                    📋 Squad
                  </button>
                )}
              </div>
            </div>
          )) : (
            <EmptyState icon="👤" title="No Teams Saved Yet"
              message="Team profiles are saved automatically when a tournament is created, or added manually above." />
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
