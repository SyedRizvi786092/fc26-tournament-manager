import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ─── View State ──────────────────────────────────────────────────────────
  view:           'standings', // standings | fixtures | suspensions | playoffs
  showProfiles:   false,
  showStats:      false,
  viewHistoryId:  null,
  historyTab:     'standings',

  // ─── Data (synced from Firestore) ─────────────────────────────────────
  tournament: null,
  history:    [],
  profiles:   [],

  // ─── Modal ───────────────────────────────────────────────────────────────
  modal: null,

  // ─── Setup Form State ────────────────────────────────────────────────────
  setup: {
    playerCount:    4,
    tournamentName: '',
    legs:           1,
    players: Array.from({ length: 6 }, () => ({ managerName: '', clubName: '', squad: [] })),
  },

  // ─── Actions: View Navigation ────────────────────────────────────────────
  setView:           (view)          => set({ view }),
  goToProfiles:      ()              => set({ showProfiles: true }),
  backFromProfiles:  ()              => set({ showProfiles: false }),
  goToStats:         ()              => set({ showStats: true }),
  backFromStats:     ()              => set({ showStats: false }),
  viewHistory:       (id)            => set({ viewHistoryId: id, historyTab: 'standings' }),
  backToSetup:       ()              => set({ viewHistoryId: null }),
  setHistoryTab:     (tab)           => set({ historyTab: tab }),

  // ─── Actions: Data Setters (called by useLiveData hook) ─────────────────
  setTournament: (t) => set({ tournament: t }),
  setHistory:    (h) => set({ history: h }),
  setProfiles:   (p) => set({ profiles: p }),

  // ─── Actions: Modal ──────────────────────────────────────────────────────
  openModal:  (modal) => set({ modal }),
  closeModal: ()      => set({ modal: null }),

  // ─── Actions: Setup Form ─────────────────────────────────────────────────
  setSetup: (updater) => set(state => ({
    setup: typeof updater === 'function' ? updater(state.setup) : { ...state.setup, ...updater },
  })),
  resetSetup: () => set({
    setup: {
      playerCount:    4,
      tournamentName: '',
      legs:           1,
      players: Array.from({ length: 6 }, () => ({ managerName: '', clubName: '', squad: [] })),
    },
  }),
}));

export default useStore;
