import { useState } from 'react';
import Modal from './Modal.jsx';

export default function TradeProposalModal({ profiles, linkedProfile, onClose, onPropose }) {
  const [step, setStep] = useState(1);
  
  const [targetProfileId, setTargetProfileId] = useState(null);
  const [targetTeamId, setTargetTeamId] = useState(null);
  
  const [wantedPlayer, setWantedPlayer] = useState(null);
  
  const [offeredTeamId, setOfferedTeamId] = useState(null);
  const [offeredPlayers, setOfferedPlayers] = useState([]);

  // Filter profiles to those with squad players, excluding self
  const otherProfiles = profiles.filter(p => 
    p.id !== linkedProfile?.id && 
    p.teams?.some(t => t.squad?.length > 0)
  );

  const myTeams = linkedProfile?.teams?.filter(t => t.squad?.length > 0) || [];

  const targetProfile = profiles.find(p => p.id === targetProfileId);
  const targetTeam = targetProfile?.teams?.find(t => t.id === targetTeamId);
  const myTeam = linkedProfile?.teams?.find(t => t.id === offeredTeamId);

  const handlePropose = () => {
    onPropose({
      toProfileId: targetProfileId,
      toManagerName: targetProfile.managerName,
      wantedPlayer,
      wantedFromTeamId: targetTeamId,
      offeredPlayers,
      offeredFromTeamId: offeredTeamId
    });
  };

  const toggleOfferedPlayer = (p) => {
    setOfferedPlayers(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div>
          <h3>🤝 Propose Trade</h3>
          <div className="sub">Step {step} of 4</div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body" style={{ minHeight: 300, display: 'flex', flexDirection: 'column' }}>
        
        {step === 1 && (
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Select Target Manager & Team</h4>
            {otherProfiles.length === 0 ? (
              <div className="empty-state">
                <div className="ei">🤷</div>
                <p>No other managers with squad players found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherProfiles.map(p => {
                  const isSelected = targetProfileId === p.id;
                  return (
                    <div key={p.id} style={{ 
                      background: 'var(--card)', 
                      border: `1px solid ${isSelected ? 'var(--green)' : 'var(--border)'}`, 
                      borderRadius: 'var(--r)', 
                      overflow: 'hidden',
                      transition: 'border-color 0.2s'
                    }}>
                      <div 
                        style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: isSelected ? 'var(--card-h)' : 'transparent' }}
                        onClick={() => {
                          setTargetProfileId(isSelected ? null : p.id);
                          setTargetTeamId(null);
                        }}
                      >
                        <div className="profile-avatar" style={{ width: 36, height: 36, fontSize: 16 }}>👤</div>
                        <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{p.managerName}</div>
                        <div style={{ color: 'var(--t3)', fontSize: 12 }}>{isSelected ? '▾' : '▸'}</div>
                      </div>
                      
                      {isSelected && (
                        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8, fontWeight: 600 }}>SELECT TEAM:</div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {p.teams.filter(t => t.squad?.length > 0).map(t => (
                              <button 
                                key={t.id}
                                className={`btn btn-sm ${targetTeamId === t.id ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ justifyContent: 'space-between', width: '100%' }}
                                onClick={() => setTargetTeamId(t.id)}
                              >
                                <span>{t.clubName}</span>
                                <span style={{ opacity: 0.8, fontSize: 11 }}>{t.squad.length} players</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Select Player You Want</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {targetTeam?.squad?.map(p => (
                <button 
                  key={p}
                  className={`btn ${wantedPlayer === p ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '12px', fontSize: 14 }}
                  onClick={() => setWantedPlayer(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ flex: 1 }}>
            <h4 style={{ marginBottom: 16, color: 'var(--t2)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Select Your Offer (At least 1)</h4>
            
            {myTeams.length === 0 ? (
              <div className="empty-state"><p>You don't have any teams with players to offer.</p></div>
            ) : (
              <>
                <select 
                  className="h2h-select" 
                  style={{ marginBottom: 16 }}
                  value={offeredTeamId || ''}
                  onChange={(e) => {
                    setOfferedTeamId(e.target.value);
                    setOfferedPlayers([]); // Reset selection when team changes
                  }}
                >
                  <option value="" disabled>Select your team...</option>
                  {myTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.clubName} ({t.squad.length} players)</option>
                  ))}
                </select>

                {myTeam && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                    {myTeam.squad.map(p => (
                      <button 
                        key={p}
                        className={`btn ${offeredPlayers.includes(p) ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '12px', fontSize: 14 }}
                        onClick={() => toggleOfferedPlayer(p)}
                      >
                        {offeredPlayers.includes(p) ? '✓ ' : ''}{p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
            <div style={{ background: 'var(--card)', padding: 20, borderRadius: 'var(--r)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--t2)', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 }}>You Want</h4>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)', marginBottom: 4 }}>{wantedPlayer}</div>
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>from {targetProfile.managerName} ({targetTeam.clubName})</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--t3)', fontSize: 20 }}>⇄</div>

            <div style={{ background: 'var(--card)', padding: 20, borderRadius: 'var(--r)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--t2)', fontSize: 12, textTransform: 'uppercase', marginBottom: 12 }}>You Offer</h4>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
                {offeredPlayers.join(', ')}
              </div>
              <div style={{ fontSize: 13, color: 'var(--t3)' }}>from {myTeam.clubName}</div>
            </div>
          </div>
        )}

      </div>

      <div className="modal-foot">
        {step > 1 ? (
          <button className="btn btn-secondary" style={{ marginRight: 'auto' }} onClick={() => setStep(step - 1)}>← Back</button>
        ) : (
          <button className="btn btn-secondary" style={{ marginRight: 'auto' }} onClick={onClose}>Cancel</button>
        )}
        
        {step === 1 && (
          <button className="btn btn-primary" disabled={!targetProfileId || !targetTeamId} onClick={() => setStep(2)}>Next →</button>
        )}
        {step === 2 && (
          <button className="btn btn-primary" disabled={!wantedPlayer} onClick={() => setStep(3)}>Next →</button>
        )}
        {step === 3 && (
          <button className="btn btn-primary" disabled={offeredPlayers.length === 0} onClick={() => setStep(4)}>Review →</button>
        )}
        {step === 4 && (
          <button className="btn btn-primary" onClick={handlePropose}>Submit Proposal ✨</button>
        )}
      </div>
    </Modal>
  );
}
