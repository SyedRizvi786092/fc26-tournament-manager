import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import {
  resolveManagerRequest, linkManagerEmail, saveProfile,
} from '../../services/firestoreService.js';
import { uid } from '../../logic/uid.js';

export default function NotificationsModal({
  trades = [],
  managerRequests = [],
  linkedProfile,
  profiles = [],
  currentUser,
  isAdmin,
  onClose,
  onAcceptTrade,
  onRejectTrade,
  onCancelTrade,
  onMarkRead,
}) {
  const [selectedProfileForRequest, setSelectedProfileForRequest] = useState({});

  // 1. Relevant trades for current user
  const myTrades = linkedProfile
    ? trades.filter(t =>
        t.status === 'pending' &&
        (!t.expiresAt || new Date(t.expiresAt) > new Date()) &&
        (t.toProfileId === linkedProfile.id || t.fromProfileId === linkedProfile.id)
      )
    : [];

  // 2. Pending manager requests for Admin
  const pendingRequests = isAdmin
    ? managerRequests.filter(r => r.status === 'pending')
    : [];

  // 3. User's own registration request status
  const userRequest = currentUser
    ? managerRequests.find(r => r.uid === currentUser.uid)
    : null;

  // Mark unread trades as read
  useEffect(() => {
    if (!currentUser || !linkedProfile) return;
    myTrades.forEach(t => {
      if (!t.readBy?.[currentUser.uid]) {
        onMarkRead?.(t.id);
      }
    });
  }, [myTrades.length, currentUser, linkedProfile, onMarkRead]);

  const handleAcceptRequest = async (request) => {
    const chosenProfileId = selectedProfileForRequest[request.id];
    if (chosenProfileId && chosenProfileId !== 'new') {
      // Link existing profile
      await linkManagerEmail(chosenProfileId, request.userEmail);
    } else {
      // Create new profile for this user
      const newProfile = {
        id: uid(),
        managerName: request.userName || request.userEmail.split('@')[0],
        linkedEmail: request.userEmail.toLowerCase(),
        role: 'manager',
        avatar: '⚽',
        teams: [],
      };
      await saveProfile(newProfile);
    }
    await resolveManagerRequest(request.id, 'accepted');
  };

  const handleRejectRequest = async (request) => {
    await resolveManagerRequest(request.id, 'rejected');
  };

  const hasContent = myTrades.length > 0 || pendingRequests.length > 0 || (userRequest && userRequest.status !== 'pending');

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>📬 Notifications</h3>
          <div className="sub">Trade proposals and account updates</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" style={{ minHeight: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!hasContent ? (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div className="ei">📭</div>
            <p>No notifications at the moment.</p>
          </div>
        ) : (
          <>
            {/* 1. Admin: Pending Manager Registration Requests */}
            {isAdmin && pendingRequests.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--gold)' }}>
                  👑 Manager Registration Requests ({pendingRequests.length})
                </div>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: 14,
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--t1)', marginBottom: 4 }}>
                      👤 {req.userName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 12 }}>
                      {req.userEmail} · Requested on {new Date(req.createdAt).toLocaleDateString()}
                    </div>

                    {/* Option to link to existing unlinked profile or create new */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: 'var(--t3)', display: 'block', marginBottom: 4 }}>
                        Assign to Profile:
                      </label>
                      <select
                        className="field input"
                        style={{ width: '100%', fontSize: 13, padding: '6px 10px' }}
                        value={selectedProfileForRequest[req.id] || 'new'}
                        onChange={e => setSelectedProfileForRequest({ ...selectedProfileForRequest, [req.id]: e.target.value })}
                      >
                        <option value="new">✨ Create New Profile for {req.userName}</option>
                        {profiles.filter(p => !p.linkedEmail).map(p => (
                          <option key={p.id} value={p.id}>Link to existing profile: {p.managerName}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => handleAcceptRequest(req)}>
                        ✓ Accept &amp; Upgrade
                      </button>
                      <button className="btn btn-sm btn-danger" style={{ flex: 1 }} onClick={() => handleRejectRequest(req)}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 2. User Registration Request Status Notification */}
            {userRequest && userRequest.status === 'accepted' && (
              <div style={{
                background: 'var(--green-bg)', border: '1px solid var(--green)',
                borderRadius: 'var(--r)', padding: 14, color: 'var(--green)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  🎉 Congratulations!
                </div>
                <div style={{ fontSize: 13 }}>
                  Your request to register as a Manager has been accepted by the admin. You now have full manager privileges!
                </div>
              </div>
            )}

            {userRequest && userRequest.status === 'rejected' && (
              <div style={{
                background: 'var(--red-bg)', border: '1px solid var(--red)',
                borderRadius: 'var(--r)', padding: 14, color: 'var(--red)',
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                  ❌ Registration Update
                </div>
                <div style={{ fontSize: 13 }}>
                  Your request to register as a Manager was not approved by the admin.
                </div>
              </div>
            )}

            {/* 3. Trade Proposals */}
            {myTrades.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--t2)' }}>
                  🔄 Trade Proposals ({myTrades.length})
                </div>
                {myTrades.map(trade => {
                  const isIncoming = linkedProfile && trade.toProfileId === linkedProfile.id;

                  return (
                    <div key={trade.id} style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r)', padding: 14,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: isIncoming ? 'var(--gold)' : 'var(--t2)' }}>
                          {isIncoming ? 'Incoming Trade Proposal' : 'Outgoing Trade Proposal'}
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
                })}
              </div>
            )}
          </>
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
        <strong style={{ color: 'var(--t1)' }}>{proposerName}</strong> wants your <strong style={{ color: 'var(--green)' }}>{trade.wantedPlayer}</strong>. They offer:
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
