import { useMemo } from 'react';
import { getStandings } from '../../logic/standings.js';
import { getQualificationStatus } from '../../logic/qualification.js';

export default function StandingsTable({ tournament, isHistory = false }) {
  if (!tournament) return null;
  const st = getStandings(tournament);
  const n  = tournament.players.length;

  const qualInfo = useMemo(() => getQualificationStatus(tournament), [tournament]);
  const isLeaguePhase = tournament.status === 'league' && !isHistory && qualInfo != null;

  const rows = st.map((s, i) => {
    let rowCls = '';
    if (n === 5) { if (i === 0) rowCls = 'row-final'; else if (i <= 2) rowCls = 'row-elim'; }
    else { if (i <= 1) rowCls = 'row-final'; }

    const gd    = s.GD >= 0 ? `+${s.GD}` : `${s.GD}`;
    const gdCls = s.GD > 0 ? 'st-gd-pos' : s.GD < 0 ? 'st-gd-neg' : '';

    let statusBadge = null;
    if (isLeaguePhase && qualInfo.status[s.id]) {
      const qStat = qualInfo.status[s.id];
      if (qStat === 'qualified') {
        const isFinalDirect = (n === 5 && qualInfo.lockedPositions[1] === s.id);
        const label = n === 5 && !isFinalDirect ? 'Qualified for Eliminator' : 'Qualified for Final';
        statusBadge = <span className="qual-tag qual-tag-q">🟢 {label}</span>;
      } else if (qStat === 'eliminated') {
        statusBadge = <span className="qual-tag qual-tag-e">🔴 Eliminated</span>;
      } else {
        statusBadge = <span className="qual-tag qual-tag-a">🟡 Still in Contention</span>;
      }
    }

    return (
      <tr key={s.id} className={rowCls}>
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
        {isLeaguePhase && <td style={{ textAlign: 'center' }}>{statusBadge}</td>}
      </tr>
    );
  });

  const legend = n === 5 ? (
    <div className="qual-legend">
      <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--green)' }} />Direct to Final (1st)</div>
      <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--blue)' }} />Eliminator (2nd–3rd)</div>
    </div>
  ) : (
    <div className="qual-legend">
      <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--green)' }} />Qualify for Final (Top 2)</div>
    </div>
  );

  return (
    <>
      <div className="standings-wrap">
        <table className="standings-table">
          <thead>
            <tr>
              <th /><th style={{ textAlign: 'left', paddingLeft: 13 }}>Player / Club</th>
              <th title="Played">P</th><th title="Won">W</th><th title="Drawn">D</th><th title="Lost">L</th>
              <th title="Goals For">GF</th><th title="Goals Against">GA</th>
              <th title="Goal Difference">GD</th><th title="Points">Pts</th>
              {isLeaguePhase && <th title="Qualification Status" style={{ textAlign: 'center' }}>Status</th>}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      {legend}
    </>
  );
}
