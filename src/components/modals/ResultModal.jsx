import { useState } from 'react';
import Modal from './Modal.jsx';

export default function ResultModal({ modal, tournament, onClose, onSave }) {
  const fixture = tournament.fixtures.find(f => f.id === modal.fixtureId);
  const home    = tournament.players.find(p => p.id === fixture?.homeId);
  const away    = tournament.players.find(p => p.id === fixture?.awayId);

  const [homeScore,    setHomeScore]    = useState(fixture?.homeScore    ?? '');
  const [awayScore,    setAwayScore]    = useState(fixture?.awayScore    ?? '');
  const [redCards,     setRedCards]     = useState(JSON.parse(JSON.stringify(fixture?.redCards || [])));
  const [penaltyWinner, setPenaltyWinner] = useState(fixture?.penaltyWinner || null);

  if (!fixture || !home || !away) return null;

  const isPO   = fixture.phase !== 'league';
  const hs     = parseInt(homeScore);
  const as_    = parseInt(awayScore);
  const isDraw = !isNaN(hs) && !isNaN(as_) && hs === as_;
  const phLbl  = fixture.phase === 'final' ? '⭐ Grand Final'
               : fixture.phase === 'eliminator' ? '🔥 Eliminator'
               : `Matchday ${fixture.matchday}`;

  const toggleRC = (playerId, playerName, teamId) => {
    setRedCards(prev => {
      const idx = prev.findIndex(r => r.playerId === playerId && r.teamId === teamId);
      if (idx >= 0) { const next = [...prev]; next.splice(idx, 1); return next; }
      return [...prev, { playerId, playerName, teamId }];
    });
  };

  const rcIds = (teamId) => redCards.filter(r => r.teamId === teamId).map(r => r.playerId);

  const pills = (squad, teamId) => squad.map(s => {
    const sel = rcIds(teamId).includes(s.id);
    return (
      <div
        key={s.id}
        className={`player-pill ${sel ? 'sel' : ''}`}
        onMouseDown={() => toggleRC(s.id, s.name, teamId)}
      >
        <input type="checkbox" checked={sel} onChange={() => {}} onClick={e => e.preventDefault()} />
        {s.name}
      </div>
    );
  });

  const handleSave = () => {
    const hs2 = parseInt(homeScore), as2 = parseInt(awayScore);
    if (isNaN(hs2) || isNaN(as2) || hs2 < 0 || as2 < 0) return;
    if (isPO && hs2 === as2 && !penaltyWinner) return;
    onSave(fixture.id, hs2, as2, redCards, penaltyWinner);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-hdr">
        <div><h3>Match Result</h3><div className="sub">{phLbl}</div></div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="score-wrap">
          <div className="score-side">
            <div className="score-side-name">{home.name}</div>
            <div className="score-side-club">{home.teamName}</div>
            <input
              type="number" className="score-inp" min="0" max="99"
              value={homeScore} placeholder="0"
              onChange={e => { setHomeScore(e.target.value); setPenaltyWinner(null); }}
            />
          </div>
          <span className="score-sep">—</span>
          <div className="score-side">
            <div className="score-side-name">{away.name}</div>
            <div className="score-side-club">{away.teamName}</div>
            <input
              type="number" className="score-inp" min="0" max="99"
              value={awayScore} placeholder="0"
              onChange={e => { setAwayScore(e.target.value); setPenaltyWinner(null); }}
            />
          </div>
        </div>

        {isPO && isDraw && (
          <div className="pen-section">
            <h4>🥅 Penalty Shootout Winner</h4>
            <div className="pen-btns">
              {[home, away].map(p => (
                <button
                  key={p.id}
                  className={`pen-btn ${penaltyWinner === p.id ? 'sel' : ''}`}
                  onMouseDown={() => setPenaltyWinner(p.id)}
                >
                  {p.name} ({p.id === home.id ? 'Home' : 'Away'}) wins
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rc-section">
          <div className="rc-section-title">
            🟥 Red Cards <span style={{ fontWeight: 400, color: 'var(--t3)', textTransform: 'none', fontSize: 12 }}>(tap a player to toggle)</span>
          </div>
          <div className="rc-teams">
            <div>
              <div className="rc-team"><h5>{home.name}</h5></div>
              <div className="rc-players">
                {home.squad.length ? pills(home.squad, home.id) : <p style={{ fontSize: 13, color: 'var(--t3)' }}>No squad</p>}
              </div>
            </div>
            <div>
              <div className="rc-team"><h5>{away.name}</h5></div>
              <div className="rc-players">
                {away.squad.length ? pills(away.squad, away.id) : <p style={{ fontSize: 13, color: 'var(--t3)' }}>No squad</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Result</button>
      </div>
    </Modal>
  );
}
