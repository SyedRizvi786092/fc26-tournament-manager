import useStore from '../store/useStore.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { createSuspensions, resolvePendingSuspensions, serveFixtureSuspensions } from '../logic/suspensions.js';
import { createPlayoffs, resolveEliminator } from '../logic/playoffs.js';
import { saveTournament } from '../services/firestoreService.js';
import AppHeader from '../components/layout/AppHeader.jsx';
import AppFooter from '../components/layout/AppFooter.jsx';
import StandingsTable from '../components/tournament/StandingsTable.jsx';
import FixturesList from '../components/tournament/FixturesList.jsx';
import SuspensionsList from '../components/tournament/SuspensionsList.jsx';
import PlayoffBracket from '../components/tournament/PlayoffBracket.jsx';
import ResultTab from '../components/tournament/ResultTab.jsx';
import ResultModal from '../components/modals/ResultModal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';

export default function MainPage() {
  const { tournament, view, setView, modal, openModal, closeModal } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();

  if (!tournament) return null;

  const handleOpenResult = (fixtureId) => {
    if (!isAdmin) return;
    const fixture = tournament.fixtures.find(f => f.id === fixtureId);
    if (!fixture || fixture.status === 'locked') return;
    openModal({ type: 'result', fixtureId });
  };

  const handleSaveResult = async (fixtureId, homeScore, awayScore, redCards, penaltyWinner) => {
    let t = JSON.parse(JSON.stringify(tournament));
    const fixture = t.fixtures.find(f => f.id === fixtureId);
    const isEdit  = fixture.status === 'played';

    if (isEdit) {
      t.suspensions = t.suspensions.filter(s => !(s.givenInFixtureId === fixtureId && !s.served));
    }

    fixture.homeScore     = homeScore;
    fixture.awayScore     = awayScore;
    fixture.redCards      = redCards;
    fixture.penaltyWinner = penaltyWinner || null;

    if (!isEdit) {
      fixture.status = 'played';
      t.suspensions = serveFixtureSuspensions(t.suspensions, fixtureId);
    }

    if (fixture.phase === 'eliminator') {
      t.fixtures = resolveEliminator(t.fixtures, fixture);
    }

    const lgFix = t.fixtures.filter(f => f.phase === 'league');
    if (lgFix.every(f => f.status === 'played') && t.status === 'league') {
      t = createPlayoffs(t);
    }

    t.suspensions = createSuspensions(t.suspensions, t.fixtures, redCards, fixtureId);
    t.suspensions = resolvePendingSuspensions(t.suspensions, t.fixtures);

    const fin = t.fixtures.find(f => f.phase === 'final');
    if (fin && fin.status === 'played') {
      let champ;
      if      (fin.homeScore > fin.awayScore) champ = fin.homeId;
      else if (fin.awayScore > fin.homeScore) champ = fin.awayId;
      else    champ = fin.penaltyWinner;
      t.champion = champ;
      t.status   = 'complete';
      // Automatically navigate owner & all watching users to Result tab!
      setView('result');
    }

    await saveTournament(t);
    toast('Result saved ✓', 'ok');
  };

  const content = {
    result:      <ResultTab      tournament={tournament} />,
    standings:   <StandingsTable tournament={tournament} />,
    fixtures:    <FixturesList   tournament={tournament} onOpen={isAdmin ? handleOpenResult : null} />,
    suspensions: <SuspensionsList tournament={tournament} />,
    playoffs:    <PlayoffBracket  tournament={tournament} onOpen={isAdmin ? handleOpenResult : null} />,
  }[view] || (tournament.status === 'complete' ? <ResultTab tournament={tournament} /> : <StandingsTable tournament={tournament} />);

  return (
    <div id="main-screen">
      <AppHeader />
      <main className="app-content">{content}</main>
      <AppFooter />

      {modal?.type === 'result' && (
        <ResultModal modal={modal} tournament={tournament} onClose={closeModal} onSave={handleSaveResult} />
      )}
      {modal?.type === 'confirm' && (
        <ConfirmModal modal={modal} onClose={closeModal} />
      )}
    </div>
  );
}
