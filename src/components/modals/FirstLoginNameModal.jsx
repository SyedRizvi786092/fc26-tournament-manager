import { useState } from 'react';
import Modal from './Modal.jsx';

export default function FirstLoginNameModal({ defaultName, onSave }) {
  const [name, setName] = useState(defaultName || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <Modal onClose={() => {}}>
      <div className="modal-hdr">
        <div>
          <h3>👋 Welcome to FC 26 Tournament Manager!</h3>
          <div className="sub">What should we call you?</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="modal-body">
        <p style={{ fontSize: 14, color: 'var(--t2)', marginBottom: 16 }}>
          Set your display name below. You can change this anytime from the Settings page.
        </p>

        <div className="field">
          <label>Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Faisal"
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Continue →
          </button>
        </div>
      </form>
    </Modal>
  );
}
