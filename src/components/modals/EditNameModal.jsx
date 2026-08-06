import { useState } from 'react';
import Modal from './Modal.jsx';

export default function EditNameModal({ currentName, onClose, onSave }) {
  const [name, setName] = useState(currentName || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>✏️ Edit Your Name</h3>
          <div className="sub">Set your display name in the app</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <form onSubmit={handleSubmit} className="modal-body">
        <div className="field">
          <label>Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Faisal"
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Save Name</button>
        </div>
      </form>
    </Modal>
  );
}
