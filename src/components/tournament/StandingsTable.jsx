import { getStandings } from '../../logic/standings.js';

export default function StandingsTable({ tournament, isHistory = false }) {
  if (!tournament) return null;
  const st = getStandings(tournament);
  const n  = tournament.players.length;

  const rows = st.map((s, i) => {
    let rowCls = '';
    if (n === 5) { if (i === 0) rowCls = 'row-final'; else if (i <= 2) rowCls = 'row-elim'; }
    else { if (i <= 1) rowCls = 'row-final'; }

    const gd    = s.GD >= 0 ? `+${s.GD}` : `${s.GD}`;
    const gdCls = s.GD > 0 ? 'st-gd-pos' : s.GD < 0 ? 'st-gd-neg' : '';

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
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
      {legend}
    </>
  );
}
