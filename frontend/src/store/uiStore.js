// UI/Theme Store
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isDarkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: true,
  commandPaletteOpen: false,
  isMobile: window.innerWidth <= 768,
  showCallModal: false,
  incomingCall: null,
  activeCall: null,

  toggleDarkMode: () => {
    set(state => {
      const newMode = !state.isDarkMode;
      localStorage.setItem('darkMode', newMode);
      document.documentElement.classList.toggle('dark');
      return { isDarkMode: newMode };
    });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  setIsMobile: (isMobile) => set({ isMobile }),

  setShowCallModal: (show) => set({ showCallModal: show }),

  setIncomingCall: (call) => set({ incomingCall: call, showCallModal: !!call }),

  setActiveCall: (call) => set({ activeCall: call }),

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}));
