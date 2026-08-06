import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';

export default function NotificationsModal({ trades, linkedProfile, profiles, currentUser, onClose, onAcceptTrade, onRejectTrade, onCancelTrade, onMarkRead }) {
  // Filter relevant trades (pending, not expired, involving current user)
  const myTrades = linkedProfile
    ? trades.filter(t =>
        t.status === 'pending' &&
        (!t.expiresAt || new Date(t.expiresAt) > new Date()) &&
        (t.toProfileId === linkedProfile.id || t.fromProfileId === linkedProfile.id)
      )
    : [];

  // Mark unread trades as read
  useEffect(() => {
    if (!currentUser || !linkedProfile) return;
    myTrades.forEach(t => {
      if (!t.readBy?.[currentUser.uid]) {
        onMarkRead?.(t.id);
      }
    });
  }, [myTrades.length, currentUser, linkedProfile, onMarkRead]);

  if (!linkedProfile) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-hdr">
          <div>
            <h3>📬 Notifications</h3>
            <div className="sub">Your account is not linked to a manager profile</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding: 40, textAlign: 'center', color: 'var(--t2)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
          <p>Ask the admin to link your email to your manager profile to see trade proposals.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>📬 Trade Notifications</h3>
          <div className="sub">Manage incoming and outgoing proposals</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {myTrades.length === 0 ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="ei">📭</div>
            <p>No trade proposals at the moment.</p>
          </div>
        ) : (
          myTrades.map(trade => {
            const isIncoming = trade.toProfileId === linkedProfile.id;

            return (
              <div key={trade.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: isIncoming ? 'var(--gold)' : 'var(--t2)' }}>
                    {isIncoming ? 'Incoming Proposal' : 'Outgoing Proposal'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                    {new Date(trade.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {isIncoming ? (
                  <IncomingTrade trade={trade} onAccept={onAcceptTrade} onReject={onRejectTrade} profiles={profiles} />
                ) : (
                  <OutgoingTrade trade={trade} onCancel={onCancelTrade} profiles={profiles} />
                )}
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

function IncomingTrade({ trade, onAccept, onReject, profiles }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const proposer = profiles.find(p => p.id === trade.fromProfileId);
  const proposerName = proposer?.managerName || 'Unknown Manager';

  if (showConfirm) {
    return (
      <div style={{ animation: 'fadeIn 0.2s ease' }}>
        <p style={{ fontSize: 14, color: 'var(--t1)', marginBottom: 16 }}>
          Trade your <strong style={{ color: 'var(--green)' }}>{trade.wantedPlayer}</strong> for <strong style={{ color: 'var(--gold)' }}>{selectedPlayer}</strong>?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-sm btn-secondary" style={{ flex: 1 }} onClick={() => setShowConfirm(false)}>Back</button>
          <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => onAccept(trade.id, selectedPlayer)}>Accept Trade</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--t1)', marginBottom: 12 }}>
        <strong style={{ color: 'var(--t1)' }}>{proposerName}</strong> wants your <strong style={{ color: 'var(--green)' }}>{trade.wantedPlayer}</strong>.
        They offer:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 16 }}>
        {trade.offeredPlayers.map(p => (
          <button
            key={p}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: 13, padding: '8px' }}
            onClick={() => {
              setSelectedPlayer(p);
              setShowConfirm(true);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-sm btn-danger" style={{ width: '100%' }} onClick={() => onReject(trade.id)}>Reject Proposal</button>
      </div>
    </div>
  );
}

function OutgoingTrade({ trade, onCancel, profiles }) {
  const recipient = profiles.find(p => p.id === trade.toProfileId);
  const recipientName = recipient?.managerName || 'Unknown Manager';

  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--t1)', marginBottom: 12 }}>
        You proposed to trade for <strong style={{ color: 'var(--green)' }}>{trade.wantedPlayer}</strong> from <strong style={{ color: 'var(--t1)' }}>{recipientName}</strong>.
      </p>
      <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
        You offered one of: {trade.offeredPlayers.join(', ')}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-sm btn-secondary" style={{ width: '100%' }} onClick={() => onCancel(trade.id)}>Cancel Proposal</button>
      </div>
    </div>
  );
}
