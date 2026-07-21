import { useState, useRef } from 'react';
import Modal from './Modal.jsx';
import { uid } from '../../logic/uid.js';

export default function AddPastTournamentModal({ profiles, onClose, onSave }) {
  const [name,      setName]      = useState('');
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [managers,  setManagers]  = useState([]);
  const [finalist1, setFinalist1] = useState('');
  const [finalist2, setFinalist2] = useState('');
  const [score1,    setScore1]    = useState('');
  const [score2,    setScore2]    = useState('');
  const [penWinner, setPenWinner] = useState('');

  const [mgrName, setMgrName]   = useState('');
  const [mgrClub, setMgrClub]   = useState('');
  const [showSugg, setShowSugg] = useState(false);

  const s1 = parseInt(score1), s2 = parseInt(score2);
  const isDraw = !isNaN(s1) && !isNaN(s2) && s1 === s2;

  const usedNames = new Set(managers.map(m => m.name.toLowerCase()));
  const suggestions = profiles.filter(p =>
    (!mgrName || p.managerName.toLowerCase().includes(mgrName.toLowerCase())) &&
    !usedNames.has(p.managerName.toLowerCase())
  ).slice(0, 5);

  const addManager = (name = mgrName, club = mgrClub) => {
    const n = name.trim(), c = club.trim();
    if (!n) return;
    setManagers(prev => [...prev, { id: uid(), name: n, club: c || '—' }]);
    setMgrName(''); setMgrClub(''); setShowSugg(false);
  };

  const handleSubmit = () => {
    if (!name.trim() || managers.length < 2 || !finalist1 || !finalist2 || finalist1 === finalist2) return;
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) return;
    let winner = s1 > s2 ? finalist1 : s2 > s1 ? finalist2 : penWinner;
    if (!winner) return;

    onSave({
      id:          uid(),
      name:        name.trim(),
      status:      'complete',
      isManual:    true,
      createdAt:   date ? new Date(date).toISOString() : new Date().toISOString(),
      champion:    winner,
      players:     managers.map(m => ({ id: m.id, name: m.name, teamName: m.club, squad: [] })),
      final: {
        homeId:       finalist1,
        awayId:       finalist2,
        homeScore:    s1,
        awayScore:    s2,
        penaltyWinner: isDraw ? penWinner : null,
      },
      fixtures:    [],
      suspensions: [],
    }, managers);
    onClose();
  };

  const finalists = managers.filter(m => m.id === finalist1 || m.id === finalist2);

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div><h3>Add Past Tournament</h3><div className="sub">Add a retrofitted tournament record</div></div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="field">
          <label>Tournament Name</label>
          <input type="text" placeholder="e.g. Winter Cup 2025" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Date Played</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', padding: 10, color: 'var(--t1)' }} />
        </div>

        <div className="field" style={{ marginTop: 20 }}>
          <label>Participating Managers ({managers.length})</label>
          <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
            {managers.length === 0 && <p style={{ color: 'var(--t3)', fontSize: 13 }}>No managers added yet</p>}
            {managers.map((m, i) => (
              <div key={m.id} className="squad-row" style={{ padding: '8px 12px', marginBottom: 6 }}>
                <span><strong>{m.name}</strong> – {m.club}</span>
                <button className="rm-btn" onClick={() => {
                  setManagers(prev => prev.filter((_, idx) => idx !== i));
                  if (finalist1 === m.id) setFinalist1('');
                  if (finalist2 === m.id) setFinalist2('');
                }}>×</button>
              </div>
            ))}
          </div>
          <div className="add-row" style={{ position: 'relative', overflow: 'visible' }}>
            <div className="sug-wrap" style={{ flex: 1 }}>
              <input type="text" placeholder="Manager name…" value={mgrName}
                onChange={e => { setMgrName(e.target.value); setShowSugg(true); }}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 180)}
                autoComplete="off" />
              {showSugg && suggestions.length > 0 && (
                <div className="sug-dropdown" style={{ display: 'block' }}>
                  {suggestions.map(p => (
                    <div key={p.id} className="sug-item"
                      onMouseDown={() => { setMgrName(p.managerName); setMgrClub(p.preferredClub); setShowSugg(false); }}>
                      <span className="sug-name">{p.managerName}</span>
                      <span className="sug-club">{p.preferredClub}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <input type="text" placeholder="Club name…" value={mgrClub}
              onChange={e => setMgrClub(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addManager(); }}
              style={{ maxWidth: 140 }} />
            <button className="add-btn" onClick={() => addManager()}>+ Add</button>
          </div>
        </div>

        <div className="sec-title" style={{ marginTop: 25 }}>Grand Final Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginTop: 10 }}>
          {[
            { label: 'Finalist 1 (Home)', val: finalist1, set: setFinalist1, scoreVal: score1, setScore: setScore1 },
            { label: 'Finalist 2 (Away)', val: finalist2, set: setFinalist2, scoreVal: score2, setScore: setScore2 },
          ].map(({ label, val, set, scoreVal, setScore }) => (
            <div key={label} className="field">
              <label>{label}</label>
              <select value={val} onChange={e => set(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', padding: 10, color: 'var(--t1)' }}>
                <option value="">-- Select --</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="number" placeholder="Score" value={scoreVal} onChange={e => { setScore(e.target.value); setPenWinner(''); }}
                style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', padding: 10, color: 'var(--t1)', marginTop: 8, textAlign: 'center', fontWeight: 700 }} />
            </div>
          ))}
        </div>

        {isDraw && (
          <div className="field" style={{ marginTop: 10 }}>
            <label>🥅 Penalty Shootout Winner</label>
            <select value={penWinner} onChange={e => setPenWinner(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 'var(--rsm)', padding: 10, color: 'var(--t1)' }}>
              <option value="">-- Select Winner --</option>
              {finalists.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit}>💾 Save Tournament</button>
      </div>
    </Modal>
  );
}
