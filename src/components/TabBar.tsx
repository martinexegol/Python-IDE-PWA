import React from 'react';
import { TabItem, PythonTheme } from '../types';
import { FileCode, FileText, X } from 'lucide-react';

interface TabBarProps {
  tabs: TabItem[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  activeTheme: PythonTheme;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeFileId,
  onSelectTab,
  onCloseTab,
  activeTheme,
}) => {
  return (
    <div
      className="flex items-center overflow-x-auto select-none border-b shrink-0 h-9 scrollbar-none"
      style={{
        backgroundColor: activeTheme.colors.tabBarBg,
        borderColor: activeTheme.colors.border,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.fileId === activeFileId;
        const isPython = tab.name.endsWith('.py');

        return (
          <div
            key={tab.fileId}
            onClick={() => onSelectTab(tab.fileId)}
            className={`flex items-center gap-2 px-3 py-1.5 h-full text-xs font-mono border-r cursor-pointer transition-colors group shrink-0 ${
              isActive ? 'font-medium' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: isActive
                ? activeTheme.colors.tabActiveBg
                : activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              borderTop: isActive ? `2px solid ${activeTheme.colors.tabBorder}` : '2px solid transparent',
              color: isActive ? activeTheme.colors.textPrimary : activeTheme.colors.textSecondary,
            }}
          >
            {isPython ? (
              <FileCode
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: activeTheme.colors.accent }}
              />
            ) : (
              <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
            )}

            <span className="truncate max-w-[140px]">{tab.name}</span>

            {/* Modified indicator dot */}
            {tab.isModified && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: activeTheme.colors.accent }}
                title="Modifications non sauvegardées"
              />
            )}

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.fileId);
              }}
              className="p-0.5 rounded-sm opacity-50 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ml-1"
              title="Fermer l'onglet"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {tabs.length === 0 && (
        <div className="px-4 text-xs opacity-50 italic">
          Aucun fichier ouvert
        </div>
      )}
    </div>
  );
};
