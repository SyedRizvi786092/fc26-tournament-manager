import { useState } from 'react';

export default function ProfileSuggestion({ profiles, usedNames = [], onSelect }) {
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(false);

  const matches = profiles.filter(p =>
    (!val || p.managerName.toLowerCase().includes(val.toLowerCase())) &&
    !usedNames.includes(p.managerName.trim().toLowerCase())
  ).slice(0, 7);

  return (
    <div className="sug-wrap">
      <input
        type="text"
        value={val}
        placeholder="Type to search profiles…"
        autoComplete="off"
        onChange={e => { setVal(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      />
      {open && matches.length > 0 && (
        <div className="sug-dropdown" style={{ display: 'block' }}>
          {matches.map(p => (
            <div key={p.id} className="sug-item" onMouseDown={() => { onSelect(p); setOpen(false); setVal(''); }}>
              <span className="sug-name">{p.managerName}</span>
              <span className="sug-club">{p.preferredClub}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
