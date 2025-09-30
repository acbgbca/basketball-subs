import { useCallback, useMemo } from 'react';
import { useUIStore } from '../stores/uiStore';

type ModalName = 'substitution' | 'foul' | 'endPeriod' | 'editSubstitution';

interface ModalHook {
  isOpen: boolean;
  open: (options?: any) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing individual modal state
 * @param modalName - The name of the modal to manage
 */
export const useModal = (modalName: ModalName): ModalHook => {
  const { modals } = useUIStore();
  const modal = modals[modalName];

  // Modal-specific actions from the store - memoized to prevent re-renders
  const actions = useMemo(() => {
    const state = useUIStore.getState();
    switch (modalName) {
      case 'substitution':
        return {
          show: state.showSubstitutionModal,
          hide: state.hideSubstitutionModal,
        };
      case 'foul':
        return {
          show: state.showFoulModal,
          hide: state.hideFoulModal,
        };
      case 'endPeriod':
        return {
          show: state.showEndPeriodModal,
          hide: state.hideEndPeriodModal,
        };
      case 'editSubstitution':
        return {
          show: state.showEditSubstitutionModal,
          hide: state.hideEditSubstitutionModal,
        };
      default:
        return {
          show: () => {},
          hide: () => {},
        };
    }
  }, [modalName]);

  const isOpen = modal.show;

  const open = useCallback((options?: any) => {
    switch (modalName) {
      case 'substitution':
        actions.show(options?.editMode, options?.eventId);
        break;
      case 'foul':
        actions.show(options?.playerId);
        break;
      case 'endPeriod':
        actions.show();
        break;
      case 'editSubstitution':
        actions.show(options?.eventId, options?.eventTime);
        break;
    }
  }, [modalName, actions]);

  const close = useCallback(() => {
    actions.hide();
  }, [actions]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

/**
 * Hook for managing all modals at once
 */
export const useModals = () => {
  const {
    modals,
    showSubstitutionModal,
    hideSubstitutionModal,
    showFoulModal,
    hideFoulModal,
    showEndPeriodModal,
    hideEndPeriodModal,
    showEditSubstitutionModal,
    hideEditSubstitutionModal,
    hideAllModals,
  } = useUIStore();

  return {
    modals,
    actions: {
      substitution: {
        show: showSubstitutionModal,
        hide: hideSubstitutionModal,
      },
      foul: {
        show: showFoulModal,
        hide: hideFoulModal,
      },
      endPeriod: {
        show: showEndPeriodModal,
        hide: hideEndPeriodModal,
      },
      editSubstitution: {
        show: showEditSubstitutionModal,
        hide: hideEditSubstitutionModal,
      },
      hideAll: hideAllModals,
    },
  };
};

/**
 * Hook for managing modal keyboard shortcuts
 */
export const useModalKeyboard = () => {
  const { hideAllModals } = useUIStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Close all modals on Escape key
    if (event.key === 'Escape') {
      hideAllModals();
    }
  }, [hideAllModals]);

  return {
    handleKeyDown,
  };
};