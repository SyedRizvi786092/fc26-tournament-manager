import { useState } from 'react';

export default function PlayerSetupCard({ index, player, profiles, usedNames, onChange }) {
  const [squadInp, setSquadInp] = useState('');
  const [showSugg, setShowSugg] = useState(false);

  const suggestions = profiles.filter(p =>
    (!player.managerName || p.managerName.toLowerCase().includes(player.managerName.toLowerCase())) &&
    !usedNames.includes(p.managerName.trim().toLowerCase())
  ).slice(0, 7);

  const addSquad = () => {
    const name = squadInp.trim();
    if (!name) return;
    onChange({ squad: [...player.squad, name] });
    setSquadInp('');
  };

  const applyProfile = (p) => {
    onChange({
      managerName: p.managerName,
      clubName:    p.preferredClub,
      squad:       [...p.squad],
    });
    setShowSugg(false);
  };

  return (
    <div className="player-item">
      <div className="player-label">⚽ Player {index + 1}</div>

      <div className="field">
        <label>Manager Name</label>
        <div className="sug-wrap">
          <input
            type="text" id={`sm-${index}`} placeholder="e.g. Alex"
            value={player.managerName} autoComplete="off"
            onChange={e => { onChange({ managerName: e.target.value }); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 180)}
          />
          {showSugg && suggestions.length > 0 && (
            <div className="sug-dropdown" style={{ display: 'block' }}>
              {suggestions.map(p => (
                <div key={p.id} className="sug-item" onMouseDown={() => applyProfile(p)}>
                  <span className="sug-name">{p.managerName}</span>
                  <span className="sug-club">{p.preferredClub}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="field">
        <label>FC 26 Club</label>
        <input type="text" id={`sc-${index}`} placeholder="e.g. Real Madrid"
          value={player.clubName} onChange={e => onChange({ clubName: e.target.value })} />
      </div>

      <div className="field">
        <label>Squad Players <span style={{ color: 'var(--t3)', fontWeight: 400, fontSize: 11 }}>(min 3)</span></label>
        <div className="squad-scroll" style={{ maxHeight: 140 }}>
          {player.squad.map((s, si) => (
            <div key={si} className="squad-row">
              <span>{s}</span>
              <button className="rm-btn" onClick={() => onChange({ squad: player.squad.filter((_, idx) => idx !== si) })}>×</button>
            </div>
          ))}
        </div>
        <div className="add-row">
          <input type="text" id={`sp-${index}`} placeholder="Player name…"
            value={squadInp} onChange={e => setSquadInp(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSquad(); }} />
          <button className="add-btn" onClick={addSquad}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
