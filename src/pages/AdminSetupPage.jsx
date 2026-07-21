import { useAuth } from '../contexts/AuthContext.jsx';

export default function AdminSetupPage() {
  const { currentUser, claimAdmin, signOut } = useAuth();

  return (
    <div id="setup-screen" style={{ justifyContent: 'center' }}>
      <div className="setup-hero">
        <div className="setup-icon">🔑</div>
        <h1>Admin <span>Setup</span></h1>
        <p>First-time configuration</p>
      </div>

      <div className="setup-card" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div className="setup-card-title" style={{ justifyContent: 'center' }}>👑 Claim Admin Privileges</div>
        <p style={{ color: 'var(--t2)', fontSize: 14, marginBottom: 8, lineHeight: 1.65 }}>
          No admin has been set up yet. Click below to register <strong style={{ color: 'var(--t1)' }}>{currentUser?.email}</strong> as the admin.
        </p>
        <p style={{ color: 'var(--t3)', fontSize: 12, marginBottom: 24, lineHeight: 1.65 }}>
          Only the admin can create tournaments, enter scores, and edit team profiles. All other signed-in users can view live data in read-only mode.
        </p>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} onClick={claimAdmin}>
          👑 Claim Admin — {currentUser?.email}
        </button>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={signOut}>
          Sign Out &amp; Use Different Account
        </button>
      </div>
    </div>
  );
}
