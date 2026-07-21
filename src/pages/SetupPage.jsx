import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { uid } from '../logic/uid.js';
import { generateFixtures } from '../logic/fixtures.js';
import {
  saveTournament, addToHistory, deleteFromHistory,
  saveProfile, deleteProfile,
} from '../services/firestoreService.js';
import PlayerSetupCard from '../components/setup/PlayerSetupCard.jsx';
import HistoryCard from '../components/setup/HistoryCard.jsx';
import AddPastTournamentModal from '../components/modals/AddPastTournamentModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useState } from 'react';

export default function SetupPage() {
  const { setup, setSetup, resetSetup, history, profiles, tournament,
          setTournament, goToProfiles, goToStats, viewHistory, modal, openModal, closeModal } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [showPastModal, setShowPastModal] = useState(false);

  const n = setup.playerCount;

  const updatePlayer = (i, changes) => {
    setSetup(prev => {
      const players = [...prev.players];
      players[i] = { ...players[i], ...changes };
      return { ...prev, players };
    });
  };

  const usedNames = setup.players.slice(0, n).map(p => p.managerName.trim().toLowerCase()).filter(Boolean);

  const handleSubmit = async () => {
    const name = setup.tournamentName.trim();
    if (!name) { toast('Enter a tournament name!', 'err'); return; }

    const players = [];
    for (let i = 0; i < n; i++) {
      const p = setup.players[i] || {};
      const mgr = (p.managerName || '').trim(), club = (p.clubName || '').trim();
      if (!mgr)  { toast(`Player ${i + 1}: manager name required!`, 'err'); return; }
      if (!club) { toast(`Player ${i + 1}: club name required!`, 'err'); return; }
      if ((p.squad || []).length < 3) { toast(`Player ${i + 1}: add at least 3 squad players!`, 'err'); return; }
      players.push({ id: uid(), name: mgr, teamName: club, squad: p.squad.map(s => ({ id: uid(), name: s })) });
    }
    const names = players.map(p => p.name.toLowerCase());
    if (new Set(names).size !== names.length) { toast('Manager names must be unique!', 'err'); return; }

    // Upsert profiles
    for (const p of players) {
      const existing = profiles.find(pr => pr.managerName.toLowerCase() === p.name.toLowerCase());
      await saveProfile({
        id:            existing?.id || uid(),
        managerName:   p.name,
        preferredClub: p.teamName,
        squad:         p.squad.map(s => s.name),
        lastUpdated:   new Date().toISOString(),
      });
    }

    const t = {
      id: uid(), name, status: 'league', legs: setup.legs,
      players, fixtures: generateFixtures(players, setup.legs),
      suspensions: [], champion: null, createdAt: new Date().toISOString(),
    };
    await saveTournament(t);
    resetSetup();
    toast('Tournament created! ⚽', 'ok');
  };

  const handleResume = async (historyId) => {
    const entry = history.find(h => h.id === historyId);
    if (!entry) return;
    await saveTournament(entry);
    await deleteFromHistory(historyId);
    toast('Tournament resumed ✓', 'ok');
  };

  const handleDeleteHistory = (id) => {
    openModal({
      type: 'confirm',
      title: '🗑️ Delete Tournament',
      msg: 'This will permanently remove this tournament from history. This action cannot be undone.',
      onConfirm: async () => { await deleteFromHistory(id); toast('Tournament removed from history', 'ok'); },
    });
  };

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

  return (
    <div id="setup-screen">
      <div className="setup-hero">
        <div className="setup-icon">⚽</div>
        <h1>FC 26 <span>Tournament</span> Manager</h1>
        <p>Custom round-robin organiser for kick-off mode</p>
      </div>

      {isAdmin && (
        <>
          <div className="setup-card">
            <div className="setup-card-title">Tournament Details</div>
            <div className="field">
              <label>Tournament Name</label>
              <input type="text" id="sname" placeholder="e.g. Summer Champions League 2026"
                value={setup.tournamentName}
                onChange={e => setSetup({ tournamentName: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
              <div className="field">
                <label>Number of Players</label>
                <div className="player-count-row">
                  {[3, 4, 5].map(x => (
                    <button key={x} className={`pc-btn ${n === x ? 'active' : ''}`}
                      onClick={() => setSetup({ playerCount: x })}>{x}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Fixtures vs Each Team</label>
                <div className="player-count-row">
                  {[1, 2].map(x => (
                    <button key={x} className={`pc-btn ${setup.legs === x ? 'active' : ''}`}
                      style={{ fontSize: 15, fontWeight: 700 }}
                      onClick={() => setSetup({ legs: x })}>{x}&ensp;Leg{x > 1 ? 's' : ''}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="setup-card">
            <div className="setup-card-title" style={{ justifyContent: 'space-between' }}>
              Player &amp; Squad Registration
              <button className="btn btn-sm btn-secondary" onClick={goToProfiles}
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>⚙️ Teams &amp; Settings</button>
            </div>
            {profiles.length > 0 && (
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
                💡 Click the manager name field to auto-fill from a saved team.
              </p>
            )}
            <div className="player-grid">
              {Array.from({ length: n }, (_, i) => (
                <PlayerSetupCard
                  key={i}
                  index={i}
                  player={setup.players[i] || { managerName: '', clubName: '', squad: [] }}
                  profiles={profiles}
                  usedNames={usedNames.filter((_, idx) => idx !== i)}
                  onChange={changes => updatePlayer(i, changes)}
                />
              ))}
            </div>
          </div>

          <div className="setup-actions">
            <button className="btn btn-primary" onClick={handleSubmit}>⚽&ensp;Create Tournament</button>
            <button className="btn btn-secondary" onClick={goToStats}>📊&ensp;Stats</button>
            <button className="btn btn-secondary" onClick={goToProfiles}>⚙️&ensp;Teams &amp; Settings</button>
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="setup-card" style={{ maxWidth: 720, textAlign: 'center' }}>
          <div className="setup-card-title" style={{ justifyContent: 'center' }}>👁️ Viewer Mode</div>
          <p style={{ color: 'var(--t2)', fontSize: 14, lineHeight: 1.65 }}>
            You are viewing as a guest. The admin will create and manage tournaments — you'll see live updates automatically.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={goToStats}>📊 Stats</button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="setup-card" style={{ maxWidth: 720 }}>
        <div className="setup-card-title" style={{ justifyContent: 'space-between' }}>
          🏆 Tournament History
          {isAdmin && (
            <button className="btn btn-sm btn-secondary" onClick={() => setShowPastModal(true)}
              style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>+ Add Past Tournament</button>
          )}
        </div>
        {history.length ? (
          history.map(h => (
            <HistoryCard key={h.id} entry={h}
              onView={viewHistory}
              onResume={isAdmin ? handleResume : () => {}}
              onDelete={isAdmin ? handleDeleteHistory : () => {}}
            />
          ))
        ) : (
          <EmptyState icon="🏆" title="No History Yet" message="Archived tournaments and manually added records will appear here." />
        )}
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
