import { useNavigate, Link } from 'react-router-dom';
import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { uid } from '../logic/uid.js';
import { generateFixtures } from '../logic/fixtures.js';
import {
  saveTournament, deleteFromHistory, clearActiveTournament,
  updateAdminPresence,
} from '../services/firestoreService.js';
import PlayerSetupCard from '../components/setup/PlayerSetupCard.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useEffect } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const { setup, setSetup, resetSetup, history, profiles, tournament, dataReady,
          setView, adminPresence, modal, openModal, closeModal } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();

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
      players.push({ id: uid(), name: mgr, teamName: club, squad: (p.squad || []).map(s => ({ id: uid(), name: s })) });
    }
    const names = players.map(p => p.name.toLowerCase());
    if (new Set(names).size !== names.length) { toast('Manager names must be unique!', 'err'); return; }

    const fixtures = generateFixtures(players, setup.legs);

    const newTournament = {
      id: uid(),
      name,
      createdAt: new Date().toISOString(),
      status: 'league',
      players,
      fixtures,
      suspensions: [],
      champion: null,
    };

    await saveTournament(newTournament);
    resetSetup();
    toast('Tournament created! ⚽', 'ok');
    navigate(`/tournament/${newTournament.id}`);
  };

  const handleResumeHistory = async (histEntry) => {
    openModal({
      type: 'confirm',
      title: `Resume "${histEntry.name}"?`,
      msg: 'This will set this tournament as the current active tournament. Any unsaved changes in current active tournament will be overwritten.',
      onConfirm: async () => {
        await saveTournament(histEntry);
        await deleteFromHistory(histEntry.id);
        toast(`Resumed "${histEntry.name}" ✓`, 'ok');
        navigate(`/tournament/${histEntry.id}`);
      },
    });
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

  // Collect all in-progress tournaments
  const inProgressTournaments = [];
  if (tournament && tournament.status !== 'complete') {
    inProgressTournaments.push(tournament);
  }
  history.filter(h => h.status !== 'complete' && h.id !== tournament?.id).forEach(h => {
    inProgressTournaments.push(h);
  });

  return (
    <div id="setup-screen">
      <div className="setup-hero">
        <div className="setup-icon">⚽</div>
        <h1>FC 26 <span>Tournament</span> Manager</h1>
        <p>Real-time tournament tracking &amp; standings</p>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
        <Link to="/stats" className="btn btn-secondary">📊 Leaderboard &amp; Stats</Link>
        <Link to="/teams" className="btn btn-secondary">👥 Teams &amp; Settings</Link>
        <Link to="/history" className="btn btn-secondary">🏆 Tournament History</Link>
      </div>

      {/* SECTION 1: IN PROGRESS TOURNAMENTS */}
      <div className="setup-card" style={{ maxWidth: 720 }}>
        <div className="setup-card-title">⏳ In Progress Tournaments ({inProgressTournaments.length})</div>
        {!dataReady ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--t2)', fontSize: 14 }}>
            Loading tournaments…
          </div>
        ) : inProgressTournaments.length ? (
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
                    navigate(`/tournament/${t.id}`);
                  } else if (isAdmin) {
                    handleResumeHistory(t);
                  } else {
                    navigate(`/history/${t.id}`);
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
                <div className="history-actions">
                  <button className="btn btn-sm btn-primary" style={{ pointerEvents: 'none' }}>
                    {isLive ? '👀 Spectate Live' : '▶ Open'}
                  </button>
                  {isAdmin && (
                    <button className="history-del" onClick={e => { e.stopPropagation(); handleDeleteTournament(t); }} title="Delete tournament">🗑️</button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState icon="⏳" title="No Tournament In Progress" message={isAdmin ? "Create a new tournament below to get started!" : "Ask the admin to create a new tournament!"} />
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
              <Link to="/teams" className="btn btn-sm btn-secondary"
                style={{ textTransform: 'none', letterSpacing: 0, fontSize: 13 }}>⚙️ Teams &amp; Settings</Link>
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

      {modal?.type === 'confirm' && <ConfirmModal modal={modal} onClose={closeModal} />}
    </div>
  );
}
