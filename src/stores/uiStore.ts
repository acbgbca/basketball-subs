import { create } from 'zustand';

interface ModalState {
  substitution: { 
    show: boolean; 
    editMode: boolean; 
    eventId?: string; 
  };
  foul: { 
    show: boolean; 
    playerId?: string; 
  };
  endPeriod: { 
    show: boolean; 
  };
  editSubstitution: {
    show: boolean;
    eventId?: string;
    eventTime?: number;
  };
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

interface UIState {
  modals: ModalState;
  notifications: Notification[];
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

interface UIActions {
  // Modal actions
  showSubstitutionModal: (editMode?: boolean, eventId?: string) => void;
  hideSubstitutionModal: () => void;
  showFoulModal: (playerId?: string) => void;
  hideFoulModal: () => void;
  showEndPeriodModal: () => void;
  hideEndPeriodModal: () => void;
  showEditSubstitutionModal: (eventId: string, eventTime?: number) => void;
  hideEditSubstitutionModal: () => void;
  hideAllModals: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // UI state actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Utility actions
  resetUIState: () => void;
}

type UIStore = UIState & UIActions;

const initialModalState: ModalState = {
  substitution: { show: false, editMode: false },
  foul: { show: false },
  endPeriod: { show: false },
  editSubstitution: { show: false },
};

const initialState: UIState = {
  modals: initialModalState,
  notifications: [],
  sidebarCollapsed: false,
  theme: 'light',
};

let notificationCounter = 0;

export const useUIStore = create<UIStore>((set, get) => ({
  ...initialState,

  // Modal actions
  showSubstitutionModal: (editMode = false, eventId?: string) => {
    set(state => ({
      modals: {
        ...state.modals,
        substitution: { show: true, editMode, eventId }
      }
    }));
  },

  hideSubstitutionModal: () => {
    set(state => ({
      modals: {
        ...state.modals,
        substitution: { show: false, editMode: false, eventId: undefined }
      }
    }));
  },

  showFoulModal: (playerId?: string) => {
    set(state => ({
      modals: {
        ...state.modals,
        foul: { show: true, playerId }
      }
    }));
  },

  hideFoulModal: () => {
    set(state => ({
      modals: {
        ...state.modals,
        foul: { show: false, playerId: undefined }
      }
    }));
  },

  showEndPeriodModal: () => {
    set(state => ({
      modals: {
        ...state.modals,
        endPeriod: { show: true }
      }
    }));
  },

  hideEndPeriodModal: () => {
    set(state => ({
      modals: {
        ...state.modals,
        endPeriod: { show: false }
      }
    }));
  },

  showEditSubstitutionModal: (eventId: string, eventTime?: number) => {
    set(state => ({
      modals: {
        ...state.modals,
        editSubstitution: { show: true, eventId, eventTime }
      }
    }));
  },

  hideEditSubstitutionModal: () => {
    set(state => ({
      modals: {
        ...state.modals,
        editSubstitution: { show: false, eventId: undefined, eventTime: undefined }
      }
    }));
  },

  hideAllModals: () => {
    set({ modals: initialModalState });
  },

  // Notification actions
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${++notificationCounter}`;
    const newNotification: Notification = {
      id,
      autoClose: true,
      duration: 5000, // 5 seconds default
      ...notification,
    };

    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove notification if autoClose is true
    if (newNotification.autoClose) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // UI state actions
  toggleSidebar: () => {
    set(state => ({
      sidebarCollapsed: !state.sidebarCollapsed
    }));
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed });
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Persist theme preference to localStorage
    localStorage.setItem('basketball-subs-theme', theme);
  },

  // Utility actions
  resetUIState: () => {
    set(initialState);
  },
}));

// Helper functions for common notification patterns
export const useNotifications = () => {
  const addNotification = useUIStore(state => state.addNotification);
  
  return {
    success: (message: string, autoClose = true) => 
      addNotification({ type: 'success', message, autoClose }),
    
    error: (message: string, autoClose = false) => 
      addNotification({ type: 'error', message, autoClose }),
    
    info: (message: string, autoClose = true) => 
      addNotification({ type: 'info', message, autoClose }),
    
    warning: (message: string, autoClose = true) => 
      addNotification({ type: 'warning', message, autoClose }),
  };
};

// Initialize theme from localStorage on app start
const savedTheme = localStorage.getItem('basketball-subs-theme') as 'light' | 'dark' | null;
if (savedTheme) {
  useUIStore.getState().setTheme(savedTheme);
}