import { useState } from 'react';
import Modal from './Modal.jsx';

export default function RegisterManagerModal({
  currentUser,
  existingRequest,
  onClose,
  onSubmitRequest,
}) {
  const [loading, setLoading] = useState(false);

  const isPending = existingRequest?.status === 'pending';
  const isRejected = existingRequest?.status === 'rejected';

  const handleRegister = async () => {
    if (isPending || loading) return;
    setLoading(true);
    try {
      const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
      await onSubmitRequest({
        uid: currentUser.uid,
        userEmail: currentUser.email,
        userName: name,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>🎮 Register as Manager</h3>
          <div className="sub">Request manager privileges from admin</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 14, color: 'var(--t1)', marginBottom: 16 }}>
          Registering as a Manager allows you to pick your custom Avatar Emoji, mark your ⭐ Favorite Team, and propose player trades with other managers!
        </p>

        {isRejected && (
          <div style={{ padding: 12, background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16 }}>
            ❌ Your previous registration request was not approved by the admin. You can try submitting a new request.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', maxWidth: 280 }}
            onClick={handleRegister}
            disabled={isPending || loading}
          >
            {loading ? 'Submitting…' : isPending ? 'Request Submitted' : 'Submit Registration Request'}
          </button>

          {isPending && (
            <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span>⏳</span> Registration request pending!
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
