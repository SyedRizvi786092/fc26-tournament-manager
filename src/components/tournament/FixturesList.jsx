import { useMemo } from 'react';
import { getQualificationStatus } from '../../logic/qualification.js';
import FixtureCard from './FixtureCard.jsx';
import Badge from '../ui/Badge.jsx';

function PlayoffPreviewCard({ homePlayer, awayPlayer, homePlaceholder, awayPlaceholder, phase }) {
  const homeName = homePlayer ? homePlayer.name : (homePlaceholder || 'TBD');
  const homeClub = homePlayer ? homePlayer.teamName : '—';
  const awayName = awayPlayer ? awayPlayer.name : (awayPlaceholder || 'TBD');
  const awayClub = awayPlayer ? awayPlayer.teamName : '—';

  const phaseBadge = phase === 'final'
    ? <Badge variant="gold">⭐ Final</Badge>
    : <Badge variant="blue">🔥 Eliminator</Badge>;

  return (
    <div className={`fixture-card fc-locked fc-preview ${phase === 'final' ? 'fc-final' : 'fc-elim'}`}>
      <div className="fc-teams">
        <div className="fc-team fc-home">
          <div className="fc-manager" style={!homePlayer ? { color: 'var(--t3)', fontStyle: 'italic' } : {}}>{homeName}</div>
          <div className="fc-club">{homeClub}</div>
        </div>
        <div className="fc-score">
          <div className="fc-score-vs" style={{ fontSize: 12 }}>vs</div>
        </div>
        <div className="fc-team fc-away">
          <div className="fc-manager" style={!awayPlayer ? { color: 'var(--t3)', fontStyle: 'italic' } : {}}>{awayName}</div>
          <div className="fc-club">{awayClub}</div>
        </div>
      </div>
      <div className="fc-meta">
        {phaseBadge}
        <Badge variant="muted">Pending</Badge>
      </div>
    </div>
  );
}

export default function FixturesList({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;

  const qualInfo = useMemo(() => getQualificationStatus(tournament), [tournament]);

  const lfix = tournament.fixtures.filter(f => f.phase === 'league');
  const days = [...new Set(lfix.map(f => f.matchday))].sort((a, b) => a - b);

  const elim = tournament.fixtures.find(f => f.phase === 'eliminator');
  const fin  = tournament.fixtures.find(f => f.phase === 'final');
  const inPlayoffPhase = tournament.status === 'playoffs' || tournament.status === 'complete';

  const n = tournament.players.length;
  const is5Team = n === 5;

  // Resolve position-locked players during league phase
  const getPlayerByPos = (pos) => {
    const pId = qualInfo?.lockedPositions?.[pos];
    return pId ? tournament.players.find(p => p.id === pId) : null;
  };

  const pos1Player = getPlayerByPos(1);
  const pos2Player = getPlayerByPos(2);
  const pos3Player = getPlayerByPos(3);

  return (
    <>
      <div className="sec-title">League Fixtures</div>
      {days.map(md => {
        const matches = lfix.filter(f => f.matchday === md);
        const done    = matches.every(m => m.status === 'played');
        return (
          <div key={md} className="matchday-group">
            <div className="matchday-hdr">
              <span className="matchday-pill">Matchday {md}</span>
              {done && <span className="md-done">✓ Completed</span>}
            </div>
            {matches.map(f => (
              <FixtureCard key={f.id} fixture={f} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
            ))}
          </div>
        );
      })}

      {/* Playoffs section — ALWAYS shown */}
      <div className="matchday-group" style={{ marginTop: 30 }}>
        <div className="sec-title">Playoffs</div>

        {/* 5-Team Tournament: Eliminator */}
        {is5Team && (
          <div style={{ marginBottom: 20 }}>
            <div className="bracket-round-title">🔥 Eliminator</div>
            {elim ? (
              <>
                <FixtureCard fixture={elim} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
                {elim.status === 'locked' && (
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for league phase to end…</p>
                )}
              </>
            ) : (
              <PlayoffPreviewCard
                phase="eliminator"
                homePlayer={pos2Player}
                awayPlayer={pos3Player}
                homePlaceholder="2nd Place (TBD)"
                awayPlaceholder="3rd Place (TBD)"
              />
            )}
          </div>
        )}

        {/* Grand Final */}
        <div>
          <div className="bracket-round-title">⭐ Grand Final</div>
          {fin ? (
            <>
              <FixtureCard fixture={fin} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
              {fin.status === 'locked' && (
                <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for Eliminator result…</p>
              )}
            </>
          ) : (
            <PlayoffPreviewCard
              phase="final"
              homePlayer={pos1Player}
              awayPlayer={is5Team ? null : pos2Player}
              homePlaceholder="1st Place (TBD)"
              awayPlaceholder={is5Team ? 'Winner of Eliminator' : '2nd Place (TBD)'}
            />
          )}
        </div>

        {!inPlayoffPhase && (
          <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12 }}>
            💡 Playoff teams will update automatically as positions are mathematically locked.
          </p>
        )}
      </div>

      {!isHistory && (
        <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12 }}>
          Click any fixture to enter or edit the score &amp; red cards
        </p>
      )}
    </>
  );
}
