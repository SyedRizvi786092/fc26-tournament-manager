import Modal from './Modal.jsx';
import { THEME_PRESETS } from '../../logic/theme.js';

export default function ChangeThemeModal({ currentHex, onClose, onSelectPreset }) {
  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>🎨 App Theme Accent</h3>
          <div className="sub">Choose your personal accent color preference</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body">
        <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
          Your accent preference is saved to your cloud account and will follow you on all your devices.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {THEME_PRESETS.map(preset => {
            const isActive = (currentHex || '#00c896').toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: 10, padding: '10px 14px', fontSize: 13, justifyContent: 'flex-start' }}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
              >
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: preset.hex, display: 'inline-block', border: '1px solid rgba(255,255,255,.3)', flexShrink: 0 }} />
                <span>{preset.name}</span>
                {isActive && <span style={{ marginLeft: 'auto' }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
