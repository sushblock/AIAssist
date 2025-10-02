import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // UI State
  sidebarOpen: boolean;
  darkMode: boolean;
  language: 'en' | 'hi';
  
  // User Preferences
  bcisafeMode: boolean;
  timezone: string;
  dateFormat: string;
  
  // Active Sessions
  activeTimer?: {
    matterId: string;
    description: string;
    startTime: number;
    duration: number;
  };
  
  // Notifications
  notifications: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }[];
  
  // Quick Access
  recentMatters: string[];
  pinnedItems: string[];
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setBCISafeMode: (enabled: boolean) => void;
  
  // Timer Actions
  startTimer: (matterId: string, description: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  updateTimerDuration: (duration: number) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Quick Access Actions
  addRecentMatter: (matterId: string) => void;
  togglePinnedItem: (itemId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: false,
      darkMode: false,
      language: 'en',
      bcisafeMode: true,
      timezone: 'Asia/Kolkata',
      dateFormat: 'dd/MM/yyyy',
      notifications: [],
      recentMatters: [],
      pinnedItems: [],
      
      // UI Actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      toggleDarkMode: () => {
        const newDarkMode = !get().darkMode;
        set({ darkMode: newDarkMode });
        
        // Update document class
        if (typeof document !== 'undefined') {
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      
      setLanguage: (lang) => set({ language: lang }),
      
      setBCISafeMode: (enabled) => set({ bcisafeMode: enabled }),
      
      // Timer Actions
      startTimer: (matterId, description) => {
        set({
          activeTimer: {
            matterId,
            description,
            startTime: Date.now(),
            duration: 0,
          }
        });
      },
      
      pauseTimer: () => {
        const timer = get().activeTimer;
        if (timer) {
          const currentDuration = timer.duration + (Date.now() - timer.startTime);
          set({
            activeTimer: {
              ...timer,
              duration: currentDuration,
              startTime: Date.now(), // Reset start time for resume
            }
          });
        }
      },
      
      stopTimer: () => {
        set({ activeTimer: undefined });
      },
      
      updateTimerDuration: (duration) => {
        const timer = get().activeTimer;
        if (timer) {
          set({
            activeTimer: {
              ...timer,
              duration,
            }
          });
        }
      },
      
      // Notification Actions
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          read: false,
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep only last 50
        }));
      },
      
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Quick Access Actions
      addRecentMatter: (matterId) => {
        set((state) => ({
          recentMatters: [
            matterId,
            ...state.recentMatters.filter(id => id !== matterId)
          ].slice(0, 10), // Keep only last 10
        }));
      },
      
      togglePinnedItem: (itemId) => {
        set((state) => ({
          pinnedItems: state.pinnedItems.includes(itemId)
            ? state.pinnedItems.filter(id => id !== itemId)
            : [...state.pinnedItems, itemId],
        }));
      },
    }),
    {
      name: 'lawmasters-app-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        language: state.language,
        bcisafeMode: state.bcisafeMode,
        timezone: state.timezone,
        dateFormat: state.dateFormat,
        recentMatters: state.recentMatters,
        pinnedItems: state.pinnedItems,
      }),
    }
  )
);

// Initialize dark mode on app start
if (typeof document !== 'undefined') {
  const store = useAppStore.getState();
  if (store.darkMode) {
    document.documentElement.classList.add('dark');
  }
}
