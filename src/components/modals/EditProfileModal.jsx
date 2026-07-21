import { useState } from 'react';
import Modal from './Modal.jsx';
import { uid } from '../../logic/uid.js';

export default function EditProfileModal({ modal, readOnly = false, onClose, onSave }) {
  const isNew = !modal.profileId;
  const [managerName,   setManagerName]   = useState(modal.managerName   || '');
  const [preferredClub, setPreferredClub] = useState(modal.preferredClub || '');
  const [squad,         setSquad]         = useState([...(modal.squad || [])]);
  const [squadInp,      setSquadInp]      = useState('');

  const addPlayer = () => {
    if (readOnly) return;
    const name = squadInp.trim();
    if (!name) return;
    setSquad(prev => [...prev, name]);
    setSquadInp('');
  };

  const handleSave = () => {
    if (readOnly) return;
    if (!managerName.trim() || !preferredClub.trim()) return;
    onSave({
      id:            modal.profileId || uid(),
      managerName:   managerName.trim(),
      preferredClub: preferredClub.trim(),
      squad,
      lastUpdated:   new Date().toISOString(),
    });
    onClose();
  };

  const title = readOnly
    ? `${managerName || 'Team'} Roster`
    : isNew ? 'New Team Profile' : 'Edit Team Profile';

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>{title}</h3>
          {readOnly && <div className="sub">{preferredClub} · {squad.length} Squad Players</div>}
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        {!readOnly ? (
          <>
            <div className="field">
              <label>Manager Name</label>
              <input type="text" placeholder="e.g. Alex" value={managerName}
                onChange={e => setManagerName(e.target.value)} />
            </div>
            <div className="field">
              <label>FC 26 Club (Preferred)</label>
              <input type="text" placeholder="e.g. Real Madrid" value={preferredClub}
                onChange={e => setPreferredClub(e.target.value)} />
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 15, padding: '12px 16px', background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{managerName}</div>
            <div style={{ color: 'var(--t2)', fontSize: 13 }}>{preferredClub}</div>
          </div>
        )}

        <div className="field">
          <label>Squad Players ({squad.length})</label>
          <div className="squad-scroll" style={{ maxHeight: 220 }}>
            {squad.length ? squad.map((s, i) => (
              <div key={i} className="squad-row" style={{ padding: '8px 12px' }}>
                <span style={{ fontWeight: 500 }}>{s}</span>
                {!readOnly && (
                  <button className="rm-btn" onClick={() => setSquad(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                )}
              </div>
            )) : (
              <p style={{ color: 'var(--t3)', fontSize: 13, padding: 12 }}>No squad players registered for this team.</p>
            )}
          </div>

          {!readOnly && (
            <div className="add-row" style={{ marginTop: 12 }}>
              <input type="text" placeholder="Player name…" value={squadInp}
                onChange={e => setSquadInp(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addPlayer(); }} />
              <button className="add-btn" onClick={addPlayer}>+ Add</button>
            </div>
          )}
        </div>
      </div>

      <div className="modal-foot">
        {readOnly ? (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>💾 Save Team</button>
          </>
        )}
      </div>
    </Modal>
  );
}
