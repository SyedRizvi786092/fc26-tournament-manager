import { useState } from 'react';
import Modal from './Modal.jsx';

const AVATARS = ['⚽', '🦁', '👑', '⚡', '🏆', '🦅', '🔥', '🎩', '🐺', '🦈', '💎', '🎯', '🛡️', '⭐', '🐉', '🦊', '🚀', '🌟', '🥊', '🤖'];

export default function ChangeAvatarModal({ currentAvatar, onClose, onSave }) {
  const [selected, setSelected] = useState(currentAvatar || '⚽');

  const handleSelect = (emoji) => {
    setSelected(emoji);
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>🦁 Change Avatar Emoji</h3>
          <div className="sub">Pick an avatar emoji for your profile</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: '10px 0' }}>
          {AVATARS.map(emoji => {
            const isActive = selected === emoji;
            return (
              <button
                key={emoji}
                type="button"
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 24, padding: 12, borderRadius: 10, border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)' }}
                onClick={() => handleSelect(emoji)}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>Save Avatar</button>
        </div>
      </div>
    </Modal>
  );
}
