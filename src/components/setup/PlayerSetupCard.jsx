import { useState } from 'react';

export default function PlayerSetupCard({ index, player, profiles, usedNames, onChange }) {
  const [showSugg, setShowSugg] = useState(false);

  // Build one suggestion row per team per matching manager profile
  const suggestionItems = [];
  profiles.forEach(p => {
    if (usedNames.includes(p.managerName.trim().toLowerCase())) return;
    if (player.managerName && !p.managerName.toLowerCase().includes(player.managerName.toLowerCase())) return;
    (p.teams || []).forEach(team => {
      suggestionItems.push({
        managerName: p.managerName,
        clubName:    team.clubName,
        squad:       team.squad || [],
      });
    });
  });
  const suggestions = suggestionItems.slice(0, 8);

  const applyProfile = (item) => {
    onChange({
      managerName: item.managerName,
      clubName:    item.clubName,
      squad:       [...item.squad],
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
            onChange={e => { onChange({ managerName: e.target.value, clubName: '', squad: [] }); setShowSugg(true); }}
            onFocus={() => setShowSugg(true)}
            onBlur={() => setTimeout(() => setShowSugg(false), 180)}
          />
          {showSugg && suggestions.length > 0 && (
            <div className="sug-dropdown" style={{ display: 'block' }}>
              {suggestions.map((item, i) => (
                <div key={i} className="sug-item" onMouseDown={() => applyProfile(item)}>
                  <span className="sug-name">{item.managerName}</span>
                  <span className="sug-club">
                    {item.clubName}
                    {item.squad.length > 0 ? ` · ${item.squad.length} players` : ' · no squad'}
                  </span>
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

      {/* Squad info — shown as read-only confirmation when a profile team was loaded */}
      {player.squad.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--green)', marginTop: -6, paddingLeft: 2 }}>
          ✓ {player.squad.length} squad players loaded from profile
        </div>
      )}
    </div>
  );
}
