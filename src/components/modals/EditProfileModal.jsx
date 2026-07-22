import { useState } from 'react';
import Modal from './Modal.jsx';
import { uid } from '../../logic/uid.js';

export default function EditProfileModal({ modal, readOnly = false, onClose, onSave }) {
  const isNew = !modal.profileId;
  const [managerName,   setManagerName]   = useState(modal.managerName   || '');
  const [preferredClub, setPreferredClub] = useState(modal.preferredClub || '');
  const [squad,         setSquad]         = useState([...(modal.squad || [])]);
  const [squadInp,      setSquadInp]      = useState('');
  // Track which player index is being renamed (null = none)
  const [renamingIdx,   setRenamingIdx]   = useState(null);
  const [renameVal,     setRenameVal]     = useState('');

  const addPlayer = () => {
    if (readOnly) return;
    const name = squadInp.trim();
    if (!name) return;
    setSquad(prev => [...prev, name]);
    setSquadInp('');
  };

  const startRename = (i) => {
    setRenamingIdx(i);
    setRenameVal(squad[i]);
  };

  const commitRename = (i) => {
    const val = renameVal.trim();
    if (val) {
      setSquad(prev => prev.map((s, idx) => idx === i ? val : s));
    }
    setRenamingIdx(null);
    setRenameVal('');
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

  // Title logic per requirements:
  // - readOnly (user): "Team Profile"
  // - admin new:       "New Team Profile"
  // - admin edit:      "Edit Team Profile"
  const title = readOnly
    ? 'Team Profile'
    : isNew ? 'New Team Profile' : 'Edit Team Profile';

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>{title}</h3>
          {/* No subheading for readOnly — card already shows club & squad count */}
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
              {/* Removed "(Preferred)" from the label */}
              <label>FC 26 Club</label>
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
              <div key={i} className="squad-row" style={{ padding: '6px 12px', gap: 8 }}>
                {/* Inline rename: only for admin */}
                {!readOnly && renamingIdx === i ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      value={renameVal}
                      onChange={e => setRenameVal(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') commitRename(i); if (e.key === 'Escape') { setRenamingIdx(null); } }}
                      style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid var(--green)', borderRadius: 6, padding: '4px 8px', color: 'var(--t1)', fontSize: 13 }}
                    />
                    <button
                      className="add-btn"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                      onClick={() => commitRename(i)}
                    >✓</button>
                    <button
                      className="rm-btn"
                      style={{ background: 'var(--card)', color: 'var(--t2)' }}
                      onClick={() => setRenamingIdx(null)}
                    >✕</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontWeight: 500, flex: 1 }}>{s}</span>
                    {!readOnly && (
                      <>
                        {/* Rename button */}
                        <button
                          title="Rename player"
                          style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', flexShrink: 0, border: '1px solid rgba(74,144,226,.2)' }}
                          onClick={() => startRename(i)}
                        >✏️</button>
                        {/* Remove button */}
                        <button className="rm-btn" onClick={() => setSquad(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                      </>
                    )}
                  </>
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
