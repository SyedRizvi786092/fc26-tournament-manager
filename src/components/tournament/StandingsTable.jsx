import { useMemo } from 'react';
import { getStandings } from '../../logic/standings.js';
import { getQualificationStatus } from '../../logic/qualification.js';

export default function StandingsTable({ tournament, isHistory = false }) {
  if (!tournament) return null;
  const st = getStandings(tournament);
  const n  = tournament.players.length;

  // Compute qualification status (only during league phase of active tournament)
  const qual = useMemo(() => {
    if (isHistory) return null;
    return getQualificationStatus(tournament);
  }, [tournament, isHistory]);

  const showQual = qual !== null;
  const played   = tournament.fixtures.filter(f => f.phase === 'league' && f.status === 'played').length;

  const rows = st.map((s, i) => {
    let rowCls = '';
    if (n === 5) { if (i === 0) rowCls = 'row-final'; else if (i <= 2) rowCls = 'row-elim'; }
    else { if (i <= 1) rowCls = 'row-final'; }

    const gd    = s.GD >= 0 ? `+${s.GD}` : `${s.GD}`;
    const gdCls = s.GD > 0 ? 'st-gd-pos' : s.GD < 0 ? 'st-gd-neg' : '';

    // Qualification badge
    let qualBadge = null;
    if (showQual && played > 0) {
      const qs = qual.status[s.id];
      qualBadge = qs === 'qualified'  ? <span className="qual-tag" title="Qualified for Final">🟢</span>
               : qs === 'eliminated' ? <span className="qual-tag" title="Eliminated">🔴</span>
               :                       <span className="qual-tag" title="Still in Contention">🟡</span>;
    }

    return (
      <tr key={s.id} className={rowCls}>
        {showQual && <td className="qual-status">{qualBadge}</td>}
        <td className="st-pos">{i + 1}</td>
        <td>
          <div className="st-team">
            <span className="st-manager">{s.name}</span>
            <span className="st-club">{s.teamName}</span>
          </div>
        </td>
        <td>{s.P}</td><td>{s.W}</td><td>{s.D}</td><td>{s.L}</td>
        <td>{s.GF}</td><td>{s.GA}</td>
        <td className={gdCls}>{gd}</td>
        <td className="st-pts">{s.Pts}</td>
      </tr>
    );
  });

  // Qualification status legend (only during league phase with matches played)
  const qualLegend = showQual && played > 0 ? (
    <div className="qual-legend">
      <div className="leg-item">🟢 Qualified for {n === 5 ? 'Playoffs' : 'Final'}</div>
      <div className="leg-item">🟡 Still in Contention</div>
      <div className="leg-item">🔴 Eliminated</div>
    </div>
  ) : null;

  return (
    <>
      <div className="standings-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              {showQual && <th className="qual-status" title="Qualification Status" />}
              <th /><th style={{ textAlign: 'left', paddingLeft: 13 }}>Player / Club</th>
              <th title="Played">P</th><th title="Won">W</th><th title="Drawn">D</th><th title="Lost">L</th>
              <th title="Goals For">GF</th><th title="Goals Against">GA</th>
              <th title="Goal Difference">GD</th><th title="Points">Pts</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      {qualLegend}
      <p style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginTop: 12 }}>
        {n === 5
          ? 'Top team directly qualifies for the Final, 2nd and 3rd plays the Eliminator'
          : 'Top 2 qualifes for the Final'}
      </p>
    </>
  );
}
