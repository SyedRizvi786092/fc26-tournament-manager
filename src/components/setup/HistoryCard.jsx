export default function HistoryCard({ entry, onView, onResume, onDelete }) {
  const isComplete  = entry.status === 'complete';
  const champ       = isComplete ? entry.players.find(p => p.id === entry.champion) : null;
  const metaText    = isComplete
    ? `Champion: ${champ ? `${champ.name} – ${champ.teamName}` : 'N/A'}`
    : null;

  return (
    <div className="history-card" onClick={isComplete ? () => onView(entry.id) : () => onResume(entry.id)}>
      <div className="trophy">{isComplete ? '🏆' : '⏳'}</div>
      <div className="history-info">
        <div className="history-name">{entry.name}</div>
        <div className="history-meta">
          {isComplete ? metaText : <span style={{ color: 'var(--gold)', fontWeight: 600 }}>⏳ In Progress</span>}
          &ensp;·&ensp;{entry.players.length} players
          &ensp;·&ensp;{new Date(entry.createdAt).toLocaleDateString()}
        </div>
      </div>
      <button
        className="history-del"
        onClick={e => { e.stopPropagation(); onDelete(entry.id); }}
        title="Delete this tournament from history"
      >🗑️</button>
    </div>
  );
}
