import { activeSuspensions } from '../../logic/suspensions.js';
import EmptyState from '../ui/EmptyState.jsx';

export default function SuspensionsList({ tournament }) {
  if (!tournament) return null;
  const active = activeSuspensions(tournament.suspensions);

  if (!active.length) {
    return (
      <EmptyState
        icon="✅"
        title="No Active Suspensions"
        message="All clear. Red-card bans appear here automatically when issued."
      />
    );
  }

  return (
    <>
      <div className="sec-title">Active Suspensions ({active.length})</div>
      {active.map(s => {
        const team = tournament.players.find(p => p.id === s.teamId);
        const nf   = tournament.fixtures.find(f => f.id === s.servesInFixtureId);
        let   md   = '—';
        if (nf) {
          const h  = tournament.players.find(p => p.id === nf.homeId);
          const a  = tournament.players.find(p => p.id === nf.awayId);
          const pl = nf.phase === 'final' ? '⭐ Final'
                   : nf.phase === 'eliminator' ? '🔥 Eliminator'
                   : `Matchday ${nf.matchday}`;
          md = `${pl}: ${h?.name || '?'} vs ${a?.name || '?'}`;
        }
        return (
          <div key={s.id} className="susp-item">
            <div>
              <div className="susp-player">🟥 {s.playerName}</div>
              <div className="susp-team">{team ? `${team.name} – ${team.teamName}` : '—'}</div>
            </div>
            <div className="susp-serves">
              <div className="susp-serves-lbl">Misses</div>
              <div className="susp-serves-match">{md}</div>
            </div>
          </div>
        );
      })}
      <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 10 }}>
        Suspensions clear automatically when the relevant match is played.
      </p>
    </>
  );
}
