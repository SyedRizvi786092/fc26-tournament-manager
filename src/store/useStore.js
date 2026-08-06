import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ─── Navigation & Views ──────────────────────────────────────────────────
  activeView:           'hub', // hub | tournament | profiles | stats | historyDetails
  selectedTournamentId: null,  // ID of currently viewed tournament (active or from history)
  view:                 'standings', // standings | fixtures | suspensions | result (tabs inside tournament view)
  historyTab:           'result',   // result | standings | fixtures | redcards (tabs inside history view)

  // ─── Data (synced from Firestore) ─────────────────────────────────────
  tournament:    null,  // active in-progress tournament data from tournaments/active
  history:       [],    // history collection
  profiles:      [],    // profiles collection
  adminPresence: null,  // { activeTournamentId, isEditing } from config/settings
  themeAccent:   '#00c896', // accent color hex from config/settings
  dataReady:     false, // true once tournament + history listeners have each fired once

  // ─── Trades (synced from Firestore) ────────────────────────────────────
  trades: [],           // trades collection (all statuses)

  // ─── Manager Profile Linking ───────────────────────────────────────────
  linkedProfile:  null, // the profile object linked to the current user (via email)
  isManager:      false, // true if the current user has a linked profile

  // ─── Trade Banner Dismissal ────────────────────────────────────────────
  tradeBannerDismissed: false,

  // ─── Modal ───────────────────────────────────────────────────────────────
  modal: null,

  // ─── Setup Form State ────────────────────────────────────────────────────
  setup: {
    playerCount:    4,
    tournamentName: '',
    legs:           1,
    players: Array.from({ length: 6 }, () => ({ managerName: '', clubName: '', squad: [] })),
  },

  // ─── Actions: Navigation ─────────────────────────────────────────────────
  goToHub:        ()    => set({ activeView: 'hub' }),
  goToTournament: (id)  => set({ activeView: 'tournament', selectedTournamentId: id, view: 'standings' }),
  goToProfiles:   ()    => set({ activeView: 'profiles' }),
  goToStats:      ()    => set({ activeView: 'stats' }),
  viewHistory:    (id, defaultTab = 'result') => set({ activeView: 'historyDetails', selectedTournamentId: id, historyTab: defaultTab }),

  setView:        (view) => set({ view }),
  setHistoryTab:  (tab)  => set({ historyTab: tab }),

  // ─── Actions: Data Setters ───────────────────────────────────────────────
  setTournament:    (t) => set({ tournament: t }),
  setHistory:       (h) => set({ history: h }),
  setProfiles:      (p) => set({ profiles: p }),
  setAdminPresence: (p) => set({ adminPresence: p }),
  setThemeAccent:   (c) => set({ themeAccent: c }),
  setDataReady:     (v) => set({ dataReady: v }),
  setTrades:        (t) => set({ trades: t }),
  setLinkedProfile: (p) => set({ linkedProfile: p, isManager: !!p }),
  setTradeBannerDismissed: (v) => set({ tradeBannerDismissed: v }),

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
