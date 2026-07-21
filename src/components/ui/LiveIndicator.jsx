import { useNetworkStatus } from '../../hooks/useNetworkStatus.js';

export default function LiveIndicator() {
  const isOnline = useNetworkStatus();
  return (
    <span
      className={`live-indicator ${isOnline ? 'live-online' : 'live-offline'}`}
      title={isOnline ? 'Live — real-time sync active' : 'Offline — will sync when reconnected'}
    >
      <span className="live-dot" />
      {isOnline ? 'Live' : 'Offline'}
    </span>
  );
}
