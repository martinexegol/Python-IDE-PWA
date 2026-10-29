import React from 'react';
import { PythonTheme, PythonDiagnostic } from '../types';
import { THEMES } from '../themes';
import { Play, AlignLeft, Palette, Loader2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
      className="flex items-center justify-between px-3 py-2 border-b select-none transition-colors duration-150 text-sm overflow-x-auto"
      style={{
        backgroundColor: activeTheme.colors.headerBg,
        borderColor: activeTheme.colors.border,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* Brand Zone */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded border transition-colors hover:opacity-80"
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
        {/* Python Brand Icon */}
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 shrink-0" viewBox="0 0 128 128">
            <path fill="url(#python-blue)" d="M63.02 0c-16.74 0-31.14 6.74-31.14 20.31v15.2h31.85v4.56H19.5C6.46 40.07 0 49.33 0 63.65c0 14.73 7.85 23.3 20.9 23.3h9.81v-13.68c0-9.84 8.76-18.25 18.25-18.25h31.84c8.03 0 14.59-6.84 14.59-14.82V20.31C95.39 6.74 80.34 0 63.02 0zm-17.1 9.12a5.7 5.7 0 1 1 0 11.4 5.7 5.7 0 0 1 0-11.4z" />
            <path fill="url(#python-yellow)" d="M64.98 128c16.74 0 31.14-6.74 31.14-20.31v-15.2H64.27v-4.56h44.23c13.04 0 19.5-9.26 19.5-23.58 0-14.73-7.85-23.3-20.9-23.3h-9.81v13.68c0 9.84-8.76 18.25-18.25 18.25H47.2c-8.03 0-14.59 6.84-14.59 14.82v19.89c0 13.57 15.05 20.31 32.37 20.31zm17.1-9.12a5.7 5.7 0 1 1 0-11.4 5.7 5.7 0 0 1 0 11.4z" />
            <defs>
              <linearGradient id="python-blue" x1="18.9%" y1="9.7%" x2="80.6%" y2="85.7%">
                <stop offset="0%" stopColor="#387EB8" />
                <stop offset="100%" stopColor="#366994" />
              </linearGradient>
              <linearGradient id="python-yellow" x1="19.8%" y1="13.2%" x2="82.4%" y2="88.3%">
                <stop offset="0%" stopColor="#FFE873" />
                <stop offset="100%" stopColor="#FFD43B" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex items-baseline gap-2">
            <span className="font-bold tracking-tight text-base whitespace-nowrap">IDE Python</span>
            <span className="text-[11px] font-mono opacity-60">Python 3.12</span>
          </div>
        </div>

        {/* Current Active File breadcrumb */}
        {activeFilePath && (
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono ml-3 border shrink-0"
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
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {/* Quick Theme Selector Dropdown (22 Themes) - Tablet and Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <select
            value={activeTheme.id}
            onChange={(e) => {
              const theme = THEMES.find((t) => t.id === e.target.value);
              if (theme) onSelectTheme(theme);
            }}
            className="text-xs px-2.5 py-1.5 rounded border font-medium cursor-pointer outline-none focus:ring-1"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.textPrimary,
            }}
            title="Changer de thème visuel"
          >
            <optgroup label="⚡ Modes Haute Accessibilité (AAA)">
              {THEMES.filter((t) => t.category === 'high-contrast').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Accessibilité)
                </option>
              ))}
            </optgroup>
            <optgroup label="🌙 Thèmes Sombres (Dark)">
              {THEMES.filter((t) => t.category === 'dark').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="☀️ Thèmes Clairs (Light)">
              {THEMES.filter((t) => t.category === 'light').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Theme Palette Modal Button - Accessible on all screen sizes */}
        <button
          onClick={onOpenThemeModal}
          className="p-1.5 sm:p-2 rounded border transition-colors hover:opacity-80 shrink-0"
          style={{
            backgroundColor: activeTheme.colors.tabInactiveBg,
            borderColor: activeTheme.colors.border,
          }}
          title="Catalogue des 22 thèmes (avec aperçu visuel)"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton activeTheme={activeTheme} />

        {/* Format Code button */}
        <button
          onClick={onFormatCode}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors hover:opacity-85"
          style={{
            backgroundColor: activeTheme.colors.tabInactiveBg,
            borderColor: activeTheme.colors.border,
            color: activeTheme.colors.textPrimary,
          }}
          title="Formater le code selon les standards officiels PEP 8 (4 espaces)"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Formater</span>
        </button>

        {/* Primary Run Button */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: activeTheme.colors.accent,
            color: activeTheme.colors.accentText,
          }}
          title="Exécuter le script Python (F5)"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Exécution...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Exécuter Python</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
