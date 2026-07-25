import { useState } from 'react';
import Modal from './Modal.jsx';
import { uid } from '../../logic/uid.js';

export default function EditProfileModal({ modal, readOnly = false, onClose, onSave }) {
  const isNew = !modal.profileId;

  // ── Core state ──────────────────────────────────────────────────────────
  const [managerName,    setManagerName]    = useState(modal.managerName || '');
  const [teams,          setTeams]          = useState(modal.teams || []);

  // ── Admin: inline team editing state ────────────────────────────────────
  const [editingTeamId,  setEditingTeamId]  = useState(null);
  const [editClubName,   setEditClubName]   = useState('');
  const [editSquad,      setEditSquad]      = useState([]);
  const [squadInp,       setSquadInp]       = useState('');
  const [renamingIdx,    setRenamingIdx]    = useState(null);
  const [renameVal,      setRenameVal]      = useState('');

  // ── Viewer: which team is expanded ──────────────────────────────────────
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // ── Team management ──────────────────────────────────────────────────────
  const addNewTeam = () => {
    if (editingTeamId) return; // don't allow adding while another is open
    const newId = uid();
    setTeams(prev => [...prev, { id: newId, clubName: '', squad: [] }]);
    setEditingTeamId(newId);
    setEditClubName('');
    setEditSquad([]);
    setSquadInp('');
    setRenamingIdx(null);
  };

  const startEditTeam = (team) => {
    setEditingTeamId(team.id);
    setEditClubName(team.clubName);
    setEditSquad([...team.squad]);
    setSquadInp('');
    setRenamingIdx(null);
  };

  const cancelEditTeam = () => {
    // Remove if it was a newly-added team (clubName still empty in the teams array)
    const team = teams.find(t => t.id === editingTeamId);
    if (team && !team.clubName) {
      setTeams(prev => prev.filter(t => t.id !== editingTeamId));
    }
    setEditingTeamId(null);
  };

  const saveTeamEdit = () => {
    if (!editClubName.trim()) return;
    setTeams(prev => prev.map(t =>
      t.id === editingTeamId ? { ...t, clubName: editClubName.trim(), squad: editSquad } : t
    ));
    setEditingTeamId(null);
  };

  const removeTeam = (teamId) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
    if (editingTeamId === teamId) setEditingTeamId(null);
  };

  // ── Squad management within the inline editor ────────────────────────────
  const addSquadPlayer = () => {
    const name = squadInp.trim();
    if (!name) return;
    setEditSquad(prev => [...prev, name]);
    setSquadInp('');
  };

  const removeSquadPlayer = (idx) => {
    setEditSquad(prev => prev.filter((_, i) => i !== idx));
    if (renamingIdx === idx) setRenamingIdx(null);
  };

  const startRename = (idx) => {
    setRenamingIdx(idx);
    setRenameVal(editSquad[idx]);
  };

  const commitRename = (idx) => {
    const val = renameVal.trim();
    if (val) setEditSquad(prev => prev.map((s, i) => i === idx ? val : s));
    setRenamingIdx(null);
  };

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!managerName.trim()) return;

    // Auto-commit any open team edit before saving
    let finalTeams = teams;
    if (editingTeamId) {
      if (editClubName.trim()) {
        finalTeams = teams.map(t =>
          t.id === editingTeamId ? { ...t, clubName: editClubName.trim(), squad: editSquad } : t
        );
      } else {
        finalTeams = teams.filter(t => t.id !== editingTeamId || t.clubName !== '');
      }
    }

    onSave({
      id:          modal.profileId || uid(),
      managerName: managerName.trim(),
      teams:       finalTeams,
      lastUpdated: new Date().toISOString(),
    });
    onClose();
  };

  const title = readOnly ? 'Team Profile' : isNew ? 'New Team Profile' : 'Edit Team Profile';

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div><h3>{title}</h3></div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>

      <div className="modal-body">
        {/* Manager Name */}
        {!readOnly ? (
          <div className="field">
            <label>Manager Name</label>
            <input type="text" placeholder="e.g. Alex" value={managerName}
              onChange={e => setManagerName(e.target.value)} />
          </div>
        ) : (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,255,255,.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{managerName}</div>
          </div>
        )}

        {/* Teams list */}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Teams ({teams.length})</label>

          {teams.length === 0 && (
            <p style={{ color: 'var(--t3)', fontSize: 13, padding: '6px 0 10px' }}>
              {readOnly ? 'No teams registered.' : 'No teams added yet. Click "+ Add Team" below.'}
            </p>
          )}

          {teams.map(team => (
            <div key={team.id} style={{ marginBottom: 8 }}>

              {/* ── Inline team editor (admin) ── */}
              {!readOnly && editingTeamId === team.id ? (
                <div style={{ background: 'rgba(0,200,150,.04)', border: '1px solid rgba(0,200,150,.22)', borderRadius: 12, padding: '14px 16px' }}>
                  <div className="field" style={{ marginBottom: 12 }}>
                    <label>Club Name</label>
                    <input type="text" placeholder="e.g. Real Madrid" value={editClubName}
                      onChange={e => setEditClubName(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--t2)' }}>
                      Squad Players ({editSquad.length}) — optional
                    </label>
                  </div>

                  <div className="squad-scroll" style={{ maxHeight: 170, marginBottom: 8 }}>
                    {editSquad.length ? editSquad.map((s, i) => (
                      <div key={i} className="squad-row" style={{ padding: '6px 10px', gap: 6 }}>
                        {renamingIdx === i ? (
                          <>
                            <input
                              autoFocus type="text" value={renameVal}
                              onChange={e => setRenameVal(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter')  commitRename(i);
                                if (e.key === 'Escape') setRenamingIdx(null);
                              }}
                              style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid var(--green)', borderRadius: 6, padding: '3px 8px', color: 'var(--t1)', fontSize: 13 }}
                            />
                            <button className="add-btn" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => commitRename(i)}>✓</button>
                            <button className="rm-btn" style={{ background: 'var(--card)', color: 'var(--t2)' }} onClick={() => setRenamingIdx(null)}>✕</button>
                          </>
                        ) : (
                          <>
                            <span style={{ fontWeight: 500, flex: 1, fontSize: 13 }}>{s}</span>
                            <button title="Rename player" onClick={() => startRename(i)}
                              style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(74,144,226,.2)', flexShrink: 0 }}>
                              ✏️
                            </button>
                            <button className="rm-btn" onClick={() => removeSquadPlayer(i)}>×</button>
                          </>
                        )}
                      </div>
                    )) : (
                      <p style={{ color: 'var(--t3)', fontSize: 13, padding: '6px 12px' }}>No squad players added. Squad is optional.</p>
                    )}
                  </div>

                  <div className="add-row">
                    <input type="text" placeholder="Player name…" value={squadInp}
                      onChange={e => setSquadInp(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addSquadPlayer(); }} />
                    <button className="add-btn" onClick={addSquadPlayer}>+ Add</button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-secondary" onClick={cancelEditTeam}>Cancel</button>
                    <button className="btn btn-sm btn-primary" onClick={saveTeamEdit}
                      style={{ opacity: editClubName.trim() ? 1 : 0.4 }}>
                      ✓ Save Team
                    </button>
                  </div>
                </div>

              ) : (
                /* ── Team row (display mode) ── */
                <div style={{ borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: expandedTeamId === team.id ? '10px 10px 0 0' : 10, transition: 'border-radius .2s' }}>
                    {readOnly ? (
                      <button
                        style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', background: 'none', cursor: 'pointer' }}
                        onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                      >
                        <span style={{ fontSize: 13, color: 'var(--t2)', width: 14, flexShrink: 0 }}>
                          {expandedTeamId === team.id ? '▾' : '▸'}
                        </span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{team.clubName}</div>
                          <div style={{ fontSize: 12, color: 'var(--t2)' }}>
                            {team.squad.length > 0 ? `${team.squad.length} squad players` : 'No squad'}
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{team.clubName || 'Unnamed Team'}</div>
                        <div style={{ fontSize: 12, color: 'var(--t2)' }}>
                          {team.squad.length > 0 ? `${team.squad.length} squad players` : 'No squad'}
                        </div>
                      </div>
                    )}
                    {!readOnly && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => startEditTeam(team)}
                          disabled={!!editingTeamId}>✏️ Edit</button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => removeTeam(team.id)}>🗑️</button>
                      </>
                    )}
                  </div>

                  {/* Viewer: expanded squad */}
                  {readOnly && expandedTeamId === team.id && (
                    <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 14px' }}>
                      {team.squad.length > 0 ? team.squad.map((s, i) => (
                        <div key={i} style={{ fontSize: 13, padding: '4px 0', color: 'var(--t1)', borderBottom: i < team.squad.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                          {i + 1}. {s}
                        </div>
                      )) : (
                        <p style={{ fontSize: 13, color: 'var(--t3)' }}>No squad players for this team.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {!readOnly && (
            <button className="btn btn-secondary" onClick={addNewTeam}
              disabled={!!editingTeamId}
              style={{ width: '100%', marginTop: 4, fontSize: 13, justifyContent: 'center', opacity: editingTeamId ? 0.4 : 1 }}>
              + Add Team
            </button>
          )}
        </div>
      </div>

      <div className="modal-foot">
        {readOnly ? (
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>💾 Save Profile</button>
          </>
        )}
      </div>
    </Modal>
  );
}
