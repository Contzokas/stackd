// Offline/Sync Status Indicator Component
'use client';
import { useState, useEffect } from 'react';
import { syncManager } from '@/lib/syncManager';
import { isBrowser } from '@/lib/db';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(isBrowser ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!isBrowser) return;
    
    // Get initial pending count
    syncManager.getPendingCount().then(setPendingCount);

    // Subscribe to sync status changes
    const unsubscribe = syncManager.subscribe((status) => {
      if (status.online !== undefined) {
        setIsOnline(status.online);
        
        // Show toast when status changes
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
      if (status.syncing !== undefined) {
        setIsSyncing(status.syncing);
      }
      if (status.pendingCount !== undefined) {
        setPendingCount(status.pendingCount);
      }
    });

    // Also listen to native online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic pending count update
    const interval = setInterval(async () => {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Manual sync trigger
  const handleManualSync = async () => {
    if (isOnline && !isSyncing) {
      setIsSyncing(true);
      await syncManager.processSyncQueue();
    }
  };

  // Show persistent indicator if offline or has pending syncs
  const showPersistent = !isOnline || pendingCount > 0;

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 ${
            isOnline 
              ? 'bg-green-600 text-white' 
              : 'bg-yellow-600 text-white'
          }`}>
            <span className="text-xl">
              {isOnline ? '🟢' : '🔴'}
            </span>
            <div>
              <div className="font-semibold">
                {isOnline ? 'Back Online' : 'Offline Mode'}
              </div>
              <div className="text-sm opacity-90">
                {isOnline 
                  ? 'Syncing your changes...' 
                  : 'Changes will sync when you\'re back online'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent status indicator */}
      {showPersistent && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className={`rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 backdrop-blur-sm ${
            !isOnline 
              ? 'bg-yellow-600/95 text-white' 
              : isSyncing
                ? 'bg-blue-600/95 text-white'
                : 'bg-gray-800/95 text-gray-200'
          }`}>
            <span className="text-xl">
              {!isOnline ? '🔴' : isSyncing ? '🔄' : '⏳'}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-sm">
                {!isOnline 
                  ? 'Offline Mode' 
                  : isSyncing 
                    ? 'Syncing...'
                    : 'Pending Sync'
                }
              </div>
              {pendingCount > 0 && (
                <div className="text-xs opacity-90">
                  {pendingCount} change{pendingCount !== 1 ? 's' : ''} to sync
                </div>
              )}
            </div>
            {isOnline && !isSyncing && pendingCount > 0 && (
              <button
                onClick={handleManualSync}
                className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
              >
                Sync Now
              </button>
            )}
            {isSyncing && (
              <div className="ml-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
