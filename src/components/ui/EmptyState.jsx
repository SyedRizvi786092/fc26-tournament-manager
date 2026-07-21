export default function EmptyState({ icon, title, message }) {
  return (
    <div className="empty-state">
      <div className="ei">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
