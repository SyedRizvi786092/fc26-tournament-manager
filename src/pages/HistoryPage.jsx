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

  // Filter States
  const [searchQuery, setSearchQuery]   = useState('');
  const [playerFilter, setPlayerFilter] = useState('all'); // all | 3 | 4 | 5
  const [legsFilter, setLegsFilter]     = useState('all'); // all | 1 | 2

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

  // Filter tournaments
  const filteredTournaments = completedTournaments.filter(h => {
    const champ = h.players.find(p => p.id === h.champion);
    const query = searchQuery.trim().toLowerCase();
    const searchMatch = !query || (
      h.name.toLowerCase().includes(query) ||
      (champ && (champ.name.toLowerCase().includes(query) || champ.teamName.toLowerCase().includes(query)))
    );

    const playerMatch = playerFilter === 'all' || h.players.length === parseInt(playerFilter, 10);

    const legs = h.legs || (h.fixtures?.filter(f => f.phase === 'league').length >= (h.players.length === 3 ? 6 : h.players.length === 4 ? 12 : 20) ? 2 : 1);
    const legsMatch = legsFilter === 'all' || legs === parseInt(legsFilter, 10);

    return searchMatch && playerMatch && legsMatch;
  });

  return (
    <div className="profiles-page">
      <div className="profiles-hdr">
        <Link to="/" className="btn btn-sm btn-secondary">← Home</Link>
        <span className="profiles-hdr-title">Tournament History</span>
      </div>

      <div className="profiles-body">
        <div className="setup-card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="setup-card-title">
            🏆 Completed Tournaments ({filteredTournaments.length})
            {isAdmin && (
              <button className="btn btn-sm btn-secondary" onClick={() => setShowPastModal(true)}
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13, marginLeft: 'auto' }}>+ Add Past Tournament</button>
            )}
          </div>

          {/* 🔍 FILTER BAR */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search by tournament or champion…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                flex: 1, minWidth: 200, padding: '8px 12px',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--rsm)', color: 'var(--t1)', fontSize: 13
              }}
            />
            <select
              value={playerFilter}
              onChange={e => setPlayerFilter(e.target.value)}
              style={{
                padding: '8px 12px', background: 'var(--bg3)',
                border: '1px solid var(--border)', borderRadius: 'var(--rsm)',
                color: 'var(--t1)', fontSize: 13
              }}
            >
              <option value="all">All Players (3, 4, 5)</option>
              <option value="3">3 Players</option>
              <option value="4">4 Players</option>
              <option value="5">5 Players</option>
            </select>
            <select
              value={legsFilter}
              onChange={e => setLegsFilter(e.target.value)}
              style={{
                padding: '8px 12px', background: 'var(--bg3)',
                border: '1px solid var(--border)', borderRadius: 'var(--rsm)',
                color: 'var(--t1)', fontSize: 13
              }}
            >
              <option value="all">All Legs (1, 2)</option>
              <option value="1">1 Leg</option>
              <option value="2">2 Legs</option>
            </select>
          </div>

          {filteredTournaments.length ? (
            filteredTournaments.map(h => {
              const champ = h.players.find(p => p.id === h.champion);
              const legs = h.legs || (h.fixtures?.filter(f => f.phase === 'league').length >= (h.players.length === 3 ? 6 : h.players.length === 4 ? 12 : 20) ? 2 : 1);

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
                      &ensp;·&ensp;{legs} Leg{legs > 1 ? 's' : ''}
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
            <EmptyState
              icon="🔍"
              title="No Matching Tournaments"
              message={completedTournaments.length ? "Try adjusting your search or filter parameters." : "Completed tournaments will appear here automatically."}
            />
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
