import { useNetworkStatus } from '../../hooks/useNetworkStatus.js';
import useStore from '../../store/useStore.js';

export default function LiveIndicator({ inline = false }) {
  const isOnline = useNetworkStatus();
  const { tournament, adminPresence } = useStore();

  if (!isOnline) {
    return (
      <span
        className={inline ? 'live-indicator-inline live-offline' : 'live-indicator live-offline'}
        title="Offline — changes queued locally"
      >
        {!inline && <span className="live-dot" />}
        Offline
      </span>
    );
  }

  if (tournament && tournament.status === 'complete') {
    return (
      <span
        className={inline ? 'live-indicator-inline live-completed' : 'live-indicator live-completed'}
        title="Completed — all matches finished"
      >
        {!inline && <span className="live-dot" style={{ animation: 'none' }} />}
        🏆 Completed
      </span>
    );
  }

  const isLive = tournament && adminPresence?.isEditing && adminPresence?.activeTournamentId === tournament.id;

  return (
    <span
      className={inline
        ? `live-indicator-inline ${isLive ? 'live-online' : 'live-paused'}`
        : `live-indicator ${isLive ? 'live-online' : 'live-paused'}`
      }
      title={isLive
        ? 'Live — Admin is actively managing this tournament'
        : 'Paused — Admin is on home page or away'
      }
    >
      {!inline && <span className="live-dot" />}
      {isLive ? '🟢 Live' : '⏸ Paused'}
    </span>
  );
}
