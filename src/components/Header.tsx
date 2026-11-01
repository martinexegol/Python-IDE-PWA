import React from 'react';
import { PythonTheme, PythonDiagnostic } from '../types';
import { THEMES } from '../themes';
import { Play, AlignLeft, Palette, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { PWAInstallButton, CIcon } from './PWAInstallButton';

interface HeaderProps {
  activeTheme: PythonTheme;
  onSelectTheme: (theme: PythonTheme) => void;
  onOpenThemeModal: () => void;
  onRunCode: () => void;
  isRunning: boolean;
  onFormatCode: () => void;
  diagnostics?: PythonDiagnostic[];
  onOpenDiagnostics?: () => void;
  activeFilePath?: string;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTheme,
  onSelectTheme,
  onOpenThemeModal,
  onRunCode,
  isRunning,
  onFormatCode,
  activeFilePath,
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  return (
    <header
      className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 border-b select-none transition-colors duration-150 text-sm gap-1.5 sm:gap-2 w-full max-w-full min-w-0"
      style={{
        backgroundColor: activeTheme.colors.headerBg,
        borderColor: activeTheme.colors.border,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* Brand Zone */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded border transition-colors hover:opacity-80 shrink-0 cursor-pointer"
          style={{
            backgroundColor: activeTheme.colors.tabInactiveBg,
            borderColor: activeTheme.colors.border,
          }}
          title={isSidebarCollapsed ? "Afficher l'explorateur de fichiers" : "Réduire l'explorateur de fichiers"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" style={{ color: activeTheme.colors.accent }} />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* IDE Brand Title */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* C Logo Icon */}
          <CIcon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 drop-shadow-xs" />
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-bold tracking-tight text-sm sm:text-base whitespace-nowrap">C IDE</span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded opacity-75 hidden sm:inline" style={{ backgroundColor: activeTheme.colors.tabInactiveBg }}>
              GCC 13.2 / C11
            </span>
          </div>
        </div>

        {/* Current Active File breadcrumb */}
        {activeFilePath && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ml-2 border shrink-0 opacity-80"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.textSecondary,
            }}
          >
            <span>{activeFilePath}</span>
          </div>
        )}
      </div>

      {/* Actions Zone */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        {/* Quick Theme Selector Dropdown (22 Themes) */}
        <div className="hidden md:flex items-center">
          <select
            value={activeTheme.id}
            onChange={(e) => {
              const theme = THEMES.find((t) => t.id === e.target.value);
              if (theme) onSelectTheme(theme);
            }}
            className="text-xs px-2 py-1.5 rounded border font-medium cursor-pointer outline-none focus:ring-1 max-w-[105px] lg:max-w-[145px] truncate"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.textPrimary,
            }}
            title="Changer de thème visuel"
          >
            <optgroup label="⚡ Accessibilité (AAA)">
              {THEMES.filter((t) => t.category === 'high-contrast').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Accessibilité)
                </option>
              ))}
            </optgroup>
            <optgroup label="🌙 Thèmes Sombres">
              {THEMES.filter((t) => t.category === 'dark').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="☀️ Thèmes Clairs">
              {THEMES.filter((t) => t.category === 'light').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Theme Palette Modal Button */}
        <button
          onClick={onOpenThemeModal}
          className="p-1.5 sm:p-2 rounded border transition-colors hover:opacity-80 shrink-0 cursor-pointer"
          style={{
            backgroundColor: activeTheme.colors.tabInactiveBg,
            borderColor: activeTheme.colors.border,
          }}
          title="Catalogue des 22 thèmes (avec aperçu visuel)"
        >
          <Palette className="w-4 h-4 shrink-0" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton activeTheme={activeTheme} />

        {/* Format Code button */}
        <button
          onClick={onFormatCode}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded text-xs font-medium border transition-colors hover:opacity-85 shrink-0 cursor-pointer"
          style={{
            backgroundColor: activeTheme.colors.tabInactiveBg,
            borderColor: activeTheme.colors.border,
            color: activeTheme.colors.textPrimary,
          }}
          title="Formater le code C (indentation 4 espaces)"
        >
          <AlignLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline">Formater C</span>
          <span className="inline xl:hidden">Formater</span>
        </button>

        {/* Primary Run Button - Never clipped */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: activeTheme.colors.accent,
            color: activeTheme.colors.accentText,
          }}
          title="Compiler et exécuter avec GCC 13.2 [F5]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>Compilation...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="hidden xl:inline">Compiler & Exécuter</span>
              <span className="inline xl:hidden">Exécuter C</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
