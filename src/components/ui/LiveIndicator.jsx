import { useNetworkStatus } from '../../hooks/useNetworkStatus.js';
import useStore from '../../store/useStore.js';

export default function LiveIndicator() {
  const isOnline = useNetworkStatus();
  const { tournament, adminPresence } = useStore();

  if (!isOnline) {
    return (
      <span
        className="live-indicator live-offline"
        title="Offline — changes queued locally"
      >
        <span className="live-dot" />
        Offline
      </span>
    );
  }

  const isLive = tournament && adminPresence?.isEditing && adminPresence?.activeTournamentId === tournament.id;

  return (
    <span
      className={`live-indicator ${isLive ? 'live-online' : 'live-paused'}`}
      title={isLive ? 'Live — Admin is actively managing this tournament' : 'Paused — Admin is on home page or away'}
    >
      <span className="live-dot" />
      {isLive ? 'Live' : 'Paused'}
    </span>
  );
}
