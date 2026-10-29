import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-8 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 text-white px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-xs border border-amber-400/40 animate-bounce">
      <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
      <span>Mode hors-ligne : IDE Python fonctionne en cache local complet.</span>
    </div>
  );
};
