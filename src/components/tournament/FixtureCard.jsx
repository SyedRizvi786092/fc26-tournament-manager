import { suspensionsForFixture } from '../../logic/suspensions.js';
import Badge from '../ui/Badge.jsx';

export default function FixtureCard({ fixture, tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;
  const home    = tournament.players.find(p => p.id === fixture.homeId);
  const away    = tournament.players.find(p => p.id === fixture.awayId) || { name: 'TBD', teamName: '—' };
  if (!home) return null;

  const susps  = suspensionsForFixture(tournament.suspensions, fixture.id);
  const homeSu = susps.filter(s => s.teamId === fixture.homeId);
  const awaySu = susps.filter(s => s.teamId === fixture.awayId);

  const isPlayed = fixture.status === 'played';
  const isLocked = fixture.status === 'locked';

  let hCol = '', aCol = '';
  if (isPlayed) {
    if      (fixture.homeScore > fixture.awayScore) { hCol = 'color:var(--green)'; aCol = 'color:var(--red)'; }
    else if (fixture.awayScore > fixture.homeScore) { aCol = 'color:var(--green)'; hCol = 'color:var(--red)'; }
  }

  const scoreEl = isPlayed ? (
    <div className="fc-score">
      <div className="fc-score-nums">
        <span style={{ color: hCol ? 'var(--green)' : undefined }}>{fixture.homeScore}</span>
        <span className="fc-score-sep">–</span>
        <span style={{ color: aCol ? 'var(--green)' : undefined }}>{fixture.awayScore}</span>
      </div>
      {fixture.penaltyWinner && <div className="fc-pen-tag">Penalties</div>}
    </div>
  ) : isLocked ? (
    <div className="fc-score"><div className="fc-score-vs" style={{ fontSize: 12 }}>TBD</div></div>
  ) : (
    <div className="fc-score"><div className="fc-score-vs">vs</div></div>
  );

  const phaseBadge =
    fixture.phase === 'final'      ? <Badge variant="gold">⭐ Final</Badge> :
    fixture.phase === 'eliminator' ? <Badge variant="blue">🔥 Eliminator</Badge> : null;

  const statusBadge = isPlayed ? <Badge variant="green">✓ Played</Badge> :
                      isLocked ? null : <Badge variant="muted">Pending</Badge>;

  const cardCls = [
    'fixture-card',
    isPlayed ? 'fc-played' : '',
    fixture.phase === 'final'      ? 'fc-final' : '',
    fixture.phase === 'eliminator' ? 'fc-elim'  : '',
    isLocked ? 'fc-locked' : '',
  ].filter(Boolean).join(' ');

  const handleClick = (!isLocked && !isHistory && onOpen)
    ? () => onOpen(fixture.id)
    : undefined;

  return (
    <div className={cardCls} onClick={handleClick}>
      <div className="fc-teams">
        <div className="fc-team fc-home">
          <div className="fc-manager">{home.name}</div>
          <div className="fc-club">{home.teamName}</div>
          {homeSu.length > 0 && (
            <div className="fc-susp">⚠️ {homeSu.map(s => s.playerName).join(', ')} suspended</div>
          )}
        </div>
        {scoreEl}
        <div className="fc-team fc-away">
          <div className="fc-manager">{away.name}</div>
          <div className="fc-club">{away.teamName}</div>
          {awaySu.length > 0 && (
            <div className="fc-susp fc-susp-away">⚠️ {awaySu.map(s => s.playerName).join(', ')} suspended</div>
          )}
        </div>
      </div>
      <div className="fc-meta">{phaseBadge}{statusBadge}</div>
    </div>
  );
}
