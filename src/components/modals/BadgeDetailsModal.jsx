import Modal from './Modal.jsx';
import { TIER_META } from '../../logic/achievements.js';

export default function BadgeDetailsModal({ badge, isUnlocked, onClose }) {
  if (!badge) return null;

  const tierInfo = TIER_META[badge.tier] || { label: badge.tier, icon: '🏅', color: 'var(--accent)' };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>Badge Details</h3>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
        {/* Large Badge Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: isUnlocked ? `${tierInfo.color}22` : 'var(--bg3)',
          border: `2px solid ${isUnlocked ? tierInfo.color : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, margin: '0 auto 16px',
          boxShadow: isUnlocked ? `0 0 16px ${tierInfo.color}44` : 'none',
        }}>
          {badge.icon}
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: 'var(--t1)' }}>
          {badge.name}
        </h3>

        {/* Tier & XP */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: `${tierInfo.color}22`, color: tierInfo.color, border: `1px solid ${tierInfo.color}44`,
          }}>
            {tierInfo.icon} {tierInfo.label} Tier
          </span>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
            background: 'var(--card)', color: 'var(--t1)', border: '1px solid var(--border)',
          }}>
            +{badge.xp} XP
          </span>
        </div>

        {/* Description / Task */}
        <div style={{
          background: 'var(--code-bg)', padding: '14px', borderRadius: 8,
          fontSize: 14, color: 'var(--t1)', marginBottom: 20, textAlign: 'left',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 4 }}>
            Task Requirement
          </div>
          <div>{badge.description}</div>
        </div>

        {/* Status */}
        <div style={{
          padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 700,
          background: isUnlocked ? 'var(--green-bg)' : 'var(--card)',
          color: isUnlocked ? 'var(--green)' : 'var(--t2)',
          border: `1px solid ${isUnlocked ? 'rgba(0,200,150,.3)' : 'var(--border)'}`,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          {isUnlocked ? '✅ Status: Achieved' : '🔒 Status: Locked (Yet to achieve)'}
        </div>
      </div>
    </Modal>
  );
}
