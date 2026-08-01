import { useState } from 'react';

export default function TradeModal({ profiles, onClose, onTrade }) {
  // Extract all team entries with non-empty squads across profiles
  const tradeableEntries = [];
  (profiles || []).forEach(p => {
    (p.teams || []).forEach(t => {
      if (t.squad && Array.isArray(t.squad) && t.squad.length > 0) {
        tradeableEntries.push({
          profileId: p.id,
          teamId: t.id,
          managerName: p.managerName,
          clubName: t.clubName,
          squad: t.squad,
          key: `${p.id}_${t.id}`,
          label: `${p.managerName} – ${t.clubName} (${t.squad.length} players)`,
        });
      }
    });
  });

  const [entryAKey, setEntryAKey] = useState(tradeableEntries[0]?.key || '');
  const [entryBKey, setEntryBKey] = useState(tradeableEntries[1]?.key || tradeableEntries[0]?.key || '');

  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');

  const entryA = tradeableEntries.find(e => e.key === entryAKey);
  const entryB = tradeableEntries.find(e => e.key === entryBKey);

  const squadA = entryA?.squad || [];
  const squadB = entryB?.squad || [];

  const handleExecuteTrade = () => {
    if (!entryA || !entryB || !playerA || !playerB || entryA.key === entryB.key) return;

    // Find profiles to update
    const profA = profiles.find(p => p.id === entryA.profileId);
    const profB = profiles.find(p => p.id === entryB.profileId);

    if (!profA || !profB) return;

    // Deep clone profiles to update team squads safely
    const updatedProfA = JSON.parse(JSON.stringify(profA));
    const updatedProfB = (profA.id === profB.id) ? updatedProfA : JSON.parse(JSON.stringify(profB));

    const teamA = updatedProfA.teams.find(t => t.id === entryA.teamId);
    const teamB = updatedProfB.teams.find(t => t.id === entryB.teamId);

    if (teamA && teamB) {
      teamA.squad = teamA.squad.filter(p => p !== playerA).concat(playerB);
      teamB.squad = teamB.squad.filter(p => p !== playerB).concat(playerA);

      onTrade(updatedProfA, updatedProfB, playerA, playerB);
      onClose();
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-hdr">
          <div>
            <h3>🔄 Player Trade Between Managers</h3>
            <div className="sub">Exchange squad players between two saved manager teams</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!tradeableEntries.length ? (
            <div style={{ textAlign: 'center', color: 'var(--t3)', padding: 30 }}>
              No manager teams with saved squad players found. Add players to team profiles first.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* Team Entry A */}
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--rsm)', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Team / Squad A
                  </label>
                  <select
                    className="h2h-select"
                    style={{ marginBottom: 12, fontSize: 13 }}
                    value={entryAKey}
                    onChange={e => { setEntryAKey(e.target.value); setPlayerA(''); }}
                  >
                    {tradeableEntries.map(e => (
                      <option key={e.key} value={e.key}>{e.label}</option>
                    ))}
                  </select>

                  <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Select Player to Trade Out:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {squadA.map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-sm ${playerA === p ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', fontSize: 13 }}
                        onClick={() => setPlayerA(p)}
                      >
                        ⚽ {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Entry B */}
                <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--rsm)', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                    Team / Squad B
                  </label>
                  <select
                    className="h2h-select"
                    style={{ marginBottom: 12, fontSize: 13 }}
                    value={entryBKey}
                    onChange={e => { setEntryBKey(e.target.value); setPlayerB(''); }}
                  >
                    {tradeableEntries.map(e => (
                      <option key={e.key} value={e.key}>{e.label}</option>
                    ))}
                  </select>

                  <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Select Player to Trade Out:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {squadB.map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`btn btn-sm ${playerB === p ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'flex-start', fontSize: 13 }}
                        onClick={() => setPlayerB(p)}
                      >
                        ⚽ {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {playerA && playerB && entryA && entryB && (
                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,200,150,.3)', borderRadius: 'var(--rsm)', padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                  Trade Summary: {entryA.managerName} ({entryA.clubName}) gives "{playerA}" ⇄ {entryB.managerName} ({entryB.clubName}) gives "{playerB}"
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!playerA || !playerB || entryAKey === entryBKey}
            onClick={handleExecuteTrade}
          >
            Confirm Trade ⇄
          </button>
        </div>
      </div>
    </div>
  );
}
