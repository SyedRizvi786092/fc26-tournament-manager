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

  // ── Resolve preview slot teams from qualification data ──────────────
  //
  // 3-4 team tournaments (Final only):
  //   Any qualified team fills a slot immediately (position irrelevant).
  //
  // 5-team tournaments (Eliminator + Final):
  //   Final home:     only if a team is locked to position 1
  //   Eliminator:     qualified teams guaranteed NOT to finish 1st
  //   Otherwise:      TBD (qualified but could still be 1st)
  const findPlayer = (id) => tournament.players.find(p => p.id === id) || null;

  // All currently qualified teams (green badge)
  const qualifiedPlayers = qual
    ? tournament.players.filter(p => qual.status[p.id] === 'qualified')
    : [];

  // 5-team specific: team locked to 1st, and eliminator-bound teams
  const finalTeam5 = qual && qual.lockedPositions[1]
    ? findPlayer(qual.lockedPositions[1])
    : null;
  const elimTeams5 = qual
    ? qualifiedPlayers.filter(p => qual.canBeFirst[p.id] === false)
    : [];

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
                  home={elimTeams5[0] || null}
                  away={elimTeams5[1] || null}
                  variant="elim"
                />
              </div>
            )}
            <div>
              <div className="bracket-round-title">⭐ Grand Final</div>
              {n === 5 ? (
                <PreviewCard
                  home={finalTeam5}
                  away={null}
                  awayLabel="Winner of Eliminator"
                  variant="final"
                />
              ) : (
                <PreviewCard
                  home={qualifiedPlayers[0] || null}
                  away={qualifiedPlayers[1] || null}
                  variant="final"
                />
              )}
            </div>
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
