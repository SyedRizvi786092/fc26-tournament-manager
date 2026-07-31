import { useMemo } from 'react';
import FixtureCard from './FixtureCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Badge from '../ui/Badge.jsx';
import { getQualificationStatus } from '../../logic/qualification.js';

/* ── Playoff preview card (rendered inline during league phase) ─────── */
function PreviewCard({ home, away, awayLabel, variant }) {
  const cls = `playoff-preview ${variant === 'final' ? 'pv-final' : 'pv-elim'}`;
  return (
    <div className={cls}>
      <div className="pv-teams">
        <div className="pv-side pv-home">
          {home ? (
            <>
              <div className="pv-name">{home.name}</div>
              <div className="pv-club">{home.teamName}</div>
            </>
          ) : (
            <div className="pv-tbd">TBD</div>
          )}
        </div>
        <div className="pv-vs">vs</div>
        <div className="pv-side pv-away">
          {away ? (
            <>
              <div className="pv-name">{away.name}</div>
              <div className="pv-club">{away.teamName}</div>
            </>
          ) : (
            <div className="pv-tbd">{awayLabel || 'TBD'}</div>
          )}
        </div>
      </div>
      <div className="fc-meta">
        <Badge variant="muted">Preview</Badge>
      </div>
    </div>
  );
}

export default function FixturesList({ tournament, isHistory = false, onOpen }) {
  if (!tournament) return null;

  const n    = tournament.players.length;
  const lfix = tournament.fixtures.filter(f => f.phase === 'league');
  const days = [...new Set(lfix.map(f => f.matchday))].sort((a, b) => a - b);

  const elim = tournament.fixtures.find(f => f.phase === 'eliminator');
  const fin  = tournament.fixtures.find(f => f.phase === 'final');
  const hasPlayoffs    = elim || fin;
  const inPlayoffPhase = tournament.status === 'playoffs' || tournament.status === 'complete';
  const inLeague       = tournament.status === 'league';

  // Qualification data for playoff preview (league phase only)
  const qual = useMemo(() => {
    if (!inLeague || isHistory) return null;
    return getQualificationStatus(tournament);
  }, [tournament, inLeague, isHistory]);

  // Resolve team for a given playoff slot (1-indexed).
  // Resolution hierarchy:
  //   1. lockedPositions[pos] — exact position is mathematically certain
  //   2. qualifiedInOrder[pos-1] — all qualifying spots are green-badged;
  //      ordering is best-estimate by current standings (not exact, but
  //      the card is labelled "Preview" so this is acceptable)
  //   3. null → render TBD
  const lockedTeam = (pos) => {
    if (!qual) return null;
    const lockedId = qual.lockedPositions[pos];
    if (lockedId) return tournament.players.find(p => p.id === lockedId) || null;
    if (qual.qualifiedInOrder.length > 0) {
      const id = qual.qualifiedInOrder[pos - 1];
      if (id) return tournament.players.find(p => p.id === id) || null;
    }
    return null;
  };

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

      {/* ── Playoffs section — always visible ──────────────────────────── */}
      <div className="matchday-group" style={{ marginTop: 30 }}>
        <div className="sec-title">Playoffs</div>

        {/* Actual playoff fixtures (playoffs/complete phase or fixtures exist) */}
        {(hasPlayoffs || inPlayoffPhase) && (
          <>
            {elim && (
              <div style={{ marginBottom: 20 }}>
                <div className="bracket-round-title">🔥 Eliminator</div>
                <FixtureCard fixture={elim} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
                {elim.status === 'locked' && (
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for league phase to end…</p>
                )}
              </div>
            )}
            {fin && (
              <div>
                <div className="bracket-round-title">⭐ Grand Final</div>
                <FixtureCard fixture={fin} tournament={tournament} isHistory={isHistory} onOpen={onOpen} />
                {fin.status === 'locked' && (
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 7 }}>Waiting for Eliminator result…</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Preview cards (league phase, no actual playoff fixtures yet) */}
        {inLeague && !hasPlayoffs && (
          <>
            {n === 5 && (
              <div style={{ marginBottom: 20 }}>
                <div className="bracket-round-title">🔥 Eliminator</div>
                <PreviewCard
                  home={lockedTeam(2)}
                  away={lockedTeam(3)}
                  variant="elim"
                />
              </div>
            )}
            <div>
              <div className="bracket-round-title">⭐ Grand Final</div>
              {n === 5 ? (
                <PreviewCard
                  home={lockedTeam(1)}
                  away={null}
                  awayLabel="Winner of Eliminator"
                  variant="final"
                />
              ) : (
                <PreviewCard
                  home={lockedTeam(1)}
                  away={lockedTeam(2)}
                  variant="final"
                />
              )}
            </div>
            <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12, fontStyle: 'italic' }}>
              Matches will be determined when league phase ends
            </p>
          </>
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
