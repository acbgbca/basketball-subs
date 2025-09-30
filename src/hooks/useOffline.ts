import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  operation: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  isOfflineCapable: boolean;
  queuedOperations: OfflineQueueItem[];
  syncInProgress: boolean;
}

/**
 * Hook for managing offline functionality and sync
 */
export const useOffline = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOfflineCapable: 'serviceWorker' in navigator,
    queuedOperations: [],
    syncInProgress: false,
  });

  // Load queued operations from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('offlineQueue');
    if (savedQueue) {
      try {
        const queuedOperations = JSON.parse(savedQueue);
        setOfflineState(prev => ({ ...prev, queuedOperations }));
      } catch (error) {
        console.error('Failed to load offline queue:', error);
        localStorage.removeItem('offlineQueue');
      }
    }
  }, []);

  // Save queued operations to localStorage whenever queue changes
  useEffect(() => {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineState.queuedOperations));
  }, [offlineState.queuedOperations]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      // Automatically sync when coming back online
      syncQueuedOperations();
    };

    const handleOffline = () => {
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Queue an operation for offline sync
  const queueOperation = useCallback((operation: string, data: any) => {
    const queueItem: OfflineQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setOfflineState(prev => ({
      ...prev,
      queuedOperations: [...prev.queuedOperations, queueItem],
    }));

    return queueItem.id;
  }, []);

  // Remove operation from queue
  const removeFromQueue = useCallback((operationId: string) => {
    setOfflineState(prev => ({
      ...prev,
      queuedOperations: prev.queuedOperations.filter(op => op.id !== operationId),
    }));
  }, []);

  // Sync queued operations when online
  const syncQueuedOperations = useCallback(async () => {
    if (!offlineState.isOnline || offlineState.syncInProgress || offlineState.queuedOperations.length === 0) {
      return;
    }

    setOfflineState(prev => ({ ...prev, syncInProgress: true }));

    const maxRetries = 3;
    const operationsToSync = [...offlineState.queuedOperations];

    for (const operation of operationsToSync) {
      try {
        // Execute the operation based on type
        await executeOperation(operation);
        
        // Remove successful operation from queue
        removeFromQueue(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        if (operation.retryCount < maxRetries) {
          setOfflineState(prev => ({
            ...prev,
            queuedOperations: prev.queuedOperations.map(op =>
              op.id === operation.id
                ? { ...op, retryCount: op.retryCount + 1 }
                : op
            ),
          }));
        } else {
          // Remove failed operation after max retries
          removeFromQueue(operation.id);
          console.error(`Operation ${operation.id} failed after ${maxRetries} retries`);
        }
      }
    }

    setOfflineState(prev => ({ ...prev, syncInProgress: false }));
  }, [offlineState.isOnline, offlineState.syncInProgress, offlineState.queuedOperations, removeFromQueue]);

  // Execute a specific operation
  const executeOperation = async (operation: OfflineQueueItem) => {
    // This would be implemented based on your specific operations
    // For example:
    switch (operation.operation) {
      case 'updateGame':
        // await gameService.updateGame(operation.data);
        break;
      case 'addSubstitution':
        // await gameService.addSubstitution(operation.data);
        break;
      case 'addFoul':
        // await gameService.addFoul(operation.data);
        break;
      default:
        throw new Error(`Unknown operation: ${operation.operation}`);
    }
  };

  // Clear all queued operations
  const clearQueue = useCallback(() => {
    setOfflineState(prev => ({ ...prev, queuedOperations: [] }));
    localStorage.removeItem('offlineQueue');
  }, []);

  // Get queue status
  const getQueueStatus = useCallback(() => {
    const total = offlineState.queuedOperations.length;
    const failed = offlineState.queuedOperations.filter(op => op.retryCount >= 3).length;
    const pending = total - failed;

    return { total, failed, pending };
  }, [offlineState.queuedOperations]);

  return {
    isOnline: offlineState.isOnline,
    isOfflineCapable: offlineState.isOfflineCapable,
    queuedOperations: offlineState.queuedOperations,
    syncInProgress: offlineState.syncInProgress,
    queueOperation,
    removeFromQueue,
    syncQueuedOperations,
    clearQueue,
    getQueueStatus,
  };
};

/**
 * Hook for detecting network quality
 */
export const useNetworkQuality = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({});

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  const isSlowConnection = networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g';
  const shouldOptimizeForBandwidth = networkInfo.saveData || isSlowConnection;

  return {
    ...networkInfo,
    isSlowConnection,
    shouldOptimizeForBandwidth,
  };
};

/**
 * Component for offline status indicator
 */
export const OfflineIndicator: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { isOnline, queuedOperations, syncInProgress } = useOffline();
  const queueCount = queuedOperations.length;

  if (isOnline && queueCount === 0) {
    return null;
  }

  return (
    <div className={`alert alert-${isOnline ? 'warning' : 'danger'} ${className}`} role="alert">
      <div className="d-flex align-items-center">
        <i className={`fas fa-${isOnline ? 'wifi' : 'wifi-slash'} me-2`} />
        <div className="flex-grow-1">
          {!isOnline && (
            <strong>You're offline</strong>
          )}
          {isOnline && queueCount > 0 && (
            <strong>Syncing offline changes...</strong>
          )}
        </div>
        
        {queueCount > 0 && (
          <div className="ms-2">
            <span className="badge bg-secondary">
              {queueCount} pending
            </span>
            {syncInProgress && (
              <div className="spinner-border spinner-border-sm ms-2" role="status">
                <span className="visually-hidden">Syncing...</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!isOnline && (
        <div className="mt-2 small">
          Changes will be saved locally and synced when you're back online.
        </div>
      )}
    </div>
  );
};

// Add missing React import
import React from 'react';