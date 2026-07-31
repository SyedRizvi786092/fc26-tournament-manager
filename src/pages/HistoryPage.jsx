import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { saveProfile, addToHistory, deleteFromHistory, clearActiveTournament, updateAdminPresence } from '../services/firestoreService.js';
import { uid } from '../logic/uid.js';
import AddPastTournamentModal from '../components/modals/AddPastTournamentModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, tournament, profiles, modal, openModal, closeModal } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [showPastModal, setShowPastModal] = useState(false);

  const handleAddPast = async (histEntry, managers) => {
    for (const m of managers) {
      const existing = profiles.find(p => p.managerName.toLowerCase() === m.name.toLowerCase());
      await saveProfile({
        id:            existing?.id || uid(),
        managerName:   m.name,
        preferredClub: m.club,
        squad:         existing?.squad || [],
        lastUpdated:   new Date().toISOString(),
      });
    }
    await addToHistory(histEntry);
    toast('Past tournament added to history ✓', 'ok');
  };

  const handleDeleteTournament = (tToDelete) => {
    openModal({
      type: 'confirm',
      title: `🗑️ Delete "${tToDelete.name}"?`,
      msg: 'This will permanently remove this tournament and all its match data. This action cannot be undone.',
      onConfirm: async () => {
        if (tournament?.id === tToDelete.id) {
          await clearActiveTournament();
          await updateAdminPresence(null, false);
        }
        await deleteFromHistory(tToDelete.id);
        toast('Tournament deleted ✓', 'ok');
      },
    });
  };

  // Collect completed tournaments
  const completedTournaments = [...history.filter(h => h.status === 'complete')];
  if (tournament && tournament.status === 'complete' && !completedTournaments.some(h => h.id === tournament.id)) {
    completedTournaments.unshift(tournament);
  }

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">Tournament History</span>
      </div>

      <div className="profiles-body">
        <div className="setup-card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="setup-card-title">
            🏆 Completed Tournaments ({completedTournaments.length})
            {isAdmin && (
              <button className="btn btn-sm btn-secondary" onClick={() => setShowPastModal(true)}
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, marginLeft: 'auto' }}>+ Add Past Tournament</button>
            )}
          </div>
          {completedTournaments.length ? (
            completedTournaments.map(h => {
              const champ = h.players.find(p => p.id === h.champion);
              return (
                <div
                  key={h.id}
                  className="history-card"
                  onClick={() => navigate(`/history/${h.id}`)}
                >
                  <div className="trophy">🏆</div>
                  <div className="history-info">
                    <div className="history-name">{h.name}</div>
                    <div className="history-meta">
                      Champion: {champ ? `${champ.name} – ${champ.teamName}` : 'N/A'}
                      &ensp;·&ensp;{h.players.length} players
                      &ensp;·&ensp;{new Date(h.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="history-actions">
                      <button className="history-del" onClick={e => { e.stopPropagation(); handleDeleteTournament(h); }} title="Delete tournament">🗑️</button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState icon="🏆" title="No Completed History Yet" message="Completed tournaments will appear here automatically." />
          )}
        </div>
      </div>

      {modal?.type === 'confirm' && <ConfirmModal modal={modal} onClose={closeModal} />}
      {showPastModal && (
        <AddPastTournamentModal
          profiles={profiles}
          onClose={() => setShowPastModal(false)}
          onSave={handleAddPast}
        />
      )}
    </div>
  );
}
