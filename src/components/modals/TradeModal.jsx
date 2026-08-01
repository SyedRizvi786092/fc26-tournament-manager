import { useState } from 'react';

export default function TradeModal({ profiles, onClose, onTrade }) {
  const [managerAId, setManagerAId] = useState(profiles[0]?.id || '');
  const [managerBId, setManagerBId] = useState(profiles[1]?.id || profiles[0]?.id || '');

  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');

  const profA = profiles.find(p => p.id === managerAId);
  const profB = profiles.find(p => p.id === managerBId);

  const squadA = profA?.squad || [];
  const squadB = profB?.squad || [];

  const handleExecuteTrade = () => {
    if (!profA || !profB || !playerA || !playerB || profA.id === profB.id) return;

    // Build updated squads
    const newSquadA = squadA.filter(p => p !== playerA).concat(playerB);
    const newSquadB = squadB.filter(p => p !== playerB).concat(playerA);

    const updatedA = { ...profA, squad: newSquadA, lastUpdated: new Date().toISOString() };
    const updatedB = { ...profB, squad: newSquadB, lastUpdated: new Date().toISOString() };

    onTrade(updatedA, updatedB, playerA, playerB);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-hdr">
          <span className="modal-title">🔄 Player Trade Between Managers</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>
            Select two managers and choose one player from each manager's squad to exchange them directly.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Manager A */}
            <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--rsm)', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Manager A
              </label>
              <select
                className="h2h-select"
                style={{ marginBottom: 12 }}
                value={managerAId}
                onChange={e => { setManagerAId(e.target.value); setPlayerA(''); }}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.managerName} ({p.preferredClub || 'No Club'})</option>
                ))}
              </select>

              <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Select Player to Trade Out:
              </label>
              {squadA.length ? (
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
              ) : (
                <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', padding: 8 }}>Squad is empty.</div>
              )}
            </div>

            {/* Manager B */}
            <div style={{ background: 'var(--card)', padding: 12, borderRadius: 'var(--rsm)', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                Manager B
              </label>
              <select
                className="h2h-select"
                style={{ marginBottom: 12 }}
                value={managerBId}
                onChange={e => { setManagerBId(e.target.value); setPlayerB(''); }}
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.managerName} ({p.preferredClub || 'No Club'})</option>
                ))}
              </select>

              <label style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Select Player to Trade Out:
              </label>
              {squadB.length ? (
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
              ) : (
                <div style={{ fontSize: 12, color: 'var(--t3)', fontStyle: 'italic', padding: 8 }}>Squad is empty.</div>
              )}
            </div>
          </div>

          {playerA && playerB && (
            <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(0,200,150,.3)', borderRadius: 'var(--rsm)', padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
              Trade Summary: {profA?.managerName} gives "{playerA}" ⇄ {profB?.managerName} gives "{playerB}"
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!playerA || !playerB || managerAId === managerBId}
            onClick={handleExecuteTrade}
          >
            Confirm Trade ⇄
          </button>
        </div>
      </div>
    </div>
  );
}
