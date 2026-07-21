import useStore from '../../store/useStore.js';

export default function AppFooter() {
  const { tournament } = useStore();
  if (!tournament) return null;
  const t = tournament;
  const lTotal  = t.fixtures.filter(f => f.phase === 'league').length;
  const lPlayed = t.fixtures.filter(f => f.phase === 'league' && f.status === 'played').length;

  return (
    <footer className="app-footer">
      <span>League: {lPlayed} / {lTotal} matches played</span>
      <span>{t.players.length} players · Pts → GD → GF → H2H</span>
    </footer>
  );
}
