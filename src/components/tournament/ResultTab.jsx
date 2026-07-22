import useStore from '../../store/useStore.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { addToHistory, clearActiveTournament, updateAdminPresence } from '../../services/firestoreService.js';

export default function ResultTab({ tournament, isHistory = false, onBack }) {
  const { setView, setHistoryTab, goToHub } = useStore();
  const { isAdmin } = useAuth();
  const toast = useToast();

  if (!tournament) return null;

  const t = tournament;
  const champ = t.players.find(p => p.id === t.champion);

  const handleSeeFinalMatch = () => {
    if (isHistory) {
      setHistoryTab('fixtures');
    } else {
      setView('fixtures');
    }
    // Scroll to the final match card after state update
    setTimeout(() => {
      const finalCard = document.querySelector('.fc-final') || document.querySelector('.fc-elim');
      if (finalCard) {
        finalCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleFinishTournament = async () => {
    try {
      if (isAdmin) await updateAdminPresence(null, false);
      await addToHistory({ ...t });
      await clearActiveTournament();
      toast('Tournament finished & archived to history 🏆', 'ok');
      goToHub();
    } catch (err) {
      console.error(err);
      toast('Failed to finish tournament', 'err');
    }
  };

  return (
    <div className="result-tab-container">
      <div className="champ-banner">
        <div className="champ-trophy">🏆</div>
        <div className="champ-label">Tournament Champion</div>
        <div className="champ-name">{champ?.name || 'Unknown Champion'}</div>
        <div className="champ-club">{champ?.teamName || '—'}</div>
      </div>

      <div style={{ textAlign: 'center', margin: '24px 0' }}>
        <button
          className="btn btn-secondary"
          onClick={handleSeeFinalMatch}
          style={{ fontSize: 14, padding: '10px 20px' }}
        >
          ⚽ See Final Match Result
        </button>
      </div>

      {!isHistory && (
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          {isAdmin ? (
            <button
              className="btn btn-primary"
              onClick={handleFinishTournament}
              style={{ width: '100%', maxWidth: 320, padding: '14px 20px', fontSize: 15, justifyContent: 'center' }}
            >
              🏁 Finish Tournament
            </button>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={goToHub}
              style={{ width: '100%', maxWidth: 320, padding: '12px 20px', fontSize: 15, justifyContent: 'center' }}
            >
              🏠 Return to Home
            </button>
          )}
        </div>
      )}
    </div>
  );
}
