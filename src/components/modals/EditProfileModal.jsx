import { useState } from 'react';
import Modal from './Modal.jsx';
import { uid } from '../../logic/uid.js';

export default function EditProfileModal({ modal, onClose, onSave }) {
  const isNew = !modal.profileId;
  const [managerName,   setManagerName]   = useState(modal.managerName   || '');
  const [preferredClub, setPreferredClub] = useState(modal.preferredClub || '');
  const [squad,         setSquad]         = useState([...(modal.squad || [])]);
  const [squadInp,      setSquadInp]      = useState('');

  const addPlayer = () => {
    const name = squadInp.trim();
    if (!name) return;
    setSquad(prev => [...prev, name]);
    setSquadInp('');
  };

  const handleSave = () => {
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

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div><h3>{isNew ? 'New Team Profile' : 'Edit Team Profile'}</h3></div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
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
        <div className="field">
          <label>Squad Players</label>
          <div className="squad-scroll" style={{ maxHeight: 160 }}>
            {squad.map((s, i) => (
              <div key={i} className="squad-row">
                <span>{s}</span>
                <button className="rm-btn" onClick={() => setSquad(prev => prev.filter((_, idx) => idx !== i))}>×</button>
              </div>
            ))}
          </div>
          <div className="add-row" style={{ marginTop: 8 }}>
            <input type="text" placeholder="Player name…" value={squadInp}
              onChange={e => setSquadInp(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPlayer(); }} />
            <button className="add-btn" onClick={addPlayer}>+ Add</button>
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Team</button>
      </div>
    </Modal>
  );
}
