import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { uid } from '../logic/uid.js';
import { generateFixtures } from '../logic/fixtures.js';
import {
  saveTournament, addToHistory, deleteFromHistory,
  saveProfile, updateAdminPresence,
} from '../services/firestoreService.js';
import PlayerSetupCard from '../components/setup/PlayerSetupCard.jsx';
import AddPastTournamentModal from '../components/modals/AddPastTournamentModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useState, useEffect } from 'react';

export default function SetupPage() {
  const { setup, setSetup, resetSetup, history, profiles, tournament,
          goToProfiles, goToStats, goToTournament, setView, viewHistory, adminPresence,
          modal, openModal, closeModal } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [showPastModal, setShowPastModal] = useState(false);

  // Set admin presence to paused when on Home Hub
  useEffect(() => {
    if (isAdmin && tournament && tournament.status !== 'complete') {
      updateAdminPresence(tournament.id, false);
    }
  }, [isAdmin, tournament]);

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

    // Save profiles
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

    const newT = {
      id: uid(), name, status: 'league', legs: setup.legs,
      players, fixtures: generateFixtures(players, setup.legs),
      suspensions: [], champion: null, createdAt: new Date().toISOString(),
    };

    // If there is an active tournament, move it to history first
    if (tournament) {
      await addToHistory({ ...tournament });
    }

    await saveTournament(newT);
    if (isAdmin) await updateAdminPresence(newT.id, true);
    resetSetup();
    toast('Tournament created! ⚽', 'ok');
    goToTournament(newT.id);
  };

  const handleResumeHistory = async (entry) => {
    // Resume an in-progress tournament from history
    if (tournament && tournament.id !== entry.id) {
      await addToHistory({ ...tournament });
    }
    await saveTournament(entry);
    await deleteFromHistory(entry.id);
    if (isAdmin) await updateAdminPresence(entry.id, true);
    toast('Tournament resumed ✓', 'ok');
    goToTournament(entry.id);
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

  // Collect all in-progress tournaments
  const inProgressTournaments = [];
  if (tournament && tournament.status !== 'complete') {
    inProgressTournaments.push(tournament);
  }
  history.filter(h => h.status !== 'complete' && h.id !== tournament?.id).forEach(h => {
    inProgressTournaments.push(h);
  });

  // Collect completed tournaments (from history AND active if complete)
  const completedTournaments = [...history.filter(h => h.status === 'complete')];
  if (tournament && tournament.status === 'complete' && !completedTournaments.some(h => h.id === tournament.id)) {
    completedTournaments.unshift(tournament);
  }

  return (
    <div id="setup-screen">
      <div className="setup-hero">
        <div className="setup-icon">⚽</div>
        <h1>FC 26 <span>Tournament</span> Hub</h1>
        <p>Real-time tournament tracking &amp; standings</p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={goToStats}>📊 Leaderboard &amp; Stats</button>
        <button className="btn btn-secondary" onClick={goToProfiles}>👥 Teams &amp; Settings</button>
      </div>

      {/* SECTION 1: IN PROGRESS TOURNAMENTS */}
      <div className="setup-card" style={{ maxWidth: 720 }}>
        <div className="setup-card-title">⏳ In Progress Tournaments ({inProgressTournaments.length})</div>
        {inProgressTournaments.length ? (
          inProgressTournaments.map(t => {
            const isCurrentActive = tournament?.id === t.id;
            const isLive = isCurrentActive && adminPresence?.isEditing;
            const badgeLabel = isLive ? '🟢 Live' : '⏸️ Paused';
            const badgeVariant = isLive ? 'green' : 'gold';

            return (
              <div
                key={t.id}
                className="history-card"
                onClick={() => {
                  if (isCurrentActive) {
                    goToTournament(t.id);
                  } else {
                    handleResumeHistory(t);
                  }
                }}
              >
                <div className="trophy">⚽</div>
                <div className="history-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="history-name">{t.name}</span>
                    <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                  </div>
                  <div className="history-meta">
                    {t.players.length} players &ensp;·&ensp; {t.fixtures.filter(f => f.status === 'played').length}/{t.fixtures.length} matches played
                    &ensp;·&ensp; Started {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button className="btn btn-sm btn-primary" style={{ pointerEvents: 'none' }}>
                  {isLive ? '👀 Spectate Live' : '▶ Open'}
                </button>
              </div>
            );
          })
        ) : (
          <EmptyState icon="⏳" title="No Tournament In Progress" message="Create a new tournament below to get started!" />
        )}
      </div>

      {/* SECTION 2: CREATE NEW TOURNAMENT (ADMIN ONLY) */}
      {isAdmin && (
        <>
          <div className="setup-card" style={{ maxWidth: 720 }}>
            <div className="setup-card-title">Create New Tournament</div>
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

          <div className="setup-card" style={{ maxWidth: 720 }}>
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

          <div className="setup-actions" style={{ marginBottom: 24 }}>
            <button className="btn btn-primary" onClick={handleSubmit}>⚽&ensp;Create Tournament</button>
          </div>
        </>
      )}

      {/* SECTION 3: COMPLETED TOURNAMENTS HISTORY */}
      <div className="setup-card" style={{ maxWidth: 720 }}>
        <div className="setup-card-title" style={{ justifyContent: 'space-between' }}>
          🏆 Completed Tournaments ({completedTournaments.length})
          {isAdmin && (
            <button className="btn btn-sm btn-secondary" onClick={() => setShowPastModal(true)}
              style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>+ Add Past Tournament</button>
          )}
        </div>
        {completedTournaments.length ? (
          completedTournaments.map(h => {
            const champ = h.players.find(p => p.id === h.champion);
            const isCurrentActive = tournament?.id === h.id;
            return (
              <div
                key={h.id}
                className="history-card"
                onClick={() => {
                  if (isCurrentActive) {
                    goToTournament(h.id);
                    setView('result');
                  } else {
                    viewHistory(h.id);
                  }
                }}
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
                {isAdmin && !isCurrentActive && (
                  <button className="history-del" onClick={e => { e.stopPropagation(); handleDeleteHistory(h.id); }} title="Delete tournament">🗑️</button>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState icon="🏆" title="No Completed History Yet" message="Completed tournaments will appear here automatically." />
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
