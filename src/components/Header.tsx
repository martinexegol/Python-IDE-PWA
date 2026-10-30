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
  activeLanguage: 'c' | 'rust';
  onSelectLanguage?: (lang: 'c' | 'rust') => void;
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
  activeLanguage,
  onSelectLanguage,
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
      {/* Brand & Language Selector Zone */}
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
          <div className="flex items-center -space-x-1">
            {/* C Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 z-10" viewBox="0 0 128 128">
              <polygon points="64,4 120,34 120,94 64,124 8,94 8,34" fill="#00599C" />
              <polygon points="64,12 112,38 112,90 64,116 16,90 16,38" fill="#004482" />
              <text x="64" y="82" fill="#FFFFFF" fontSize="62" fontWeight="bold" fontFamily="Arial, Helvetica, sans-serif" textAnchor="middle">C</text>
            </svg>
            {/* Rust Gear / Crab Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 z-0 opacity-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="#CE412B" />
              <circle cx="64" cy="64" r="44" fill="#201A18" />
              <text x="64" y="80" fill="#FFFFFF" fontSize="48" fontWeight="bold" fontFamily="monospace" textAnchor="middle">R</text>
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="font-bold tracking-tight text-sm sm:text-base whitespace-nowrap">IDE C & Rust</span>
          </div>
        </div>

        {/* Language Switcher Pills */}
        {onSelectLanguage && (
          <div
            className="flex items-center p-0.5 rounded-lg border text-xs font-semibold shrink-0 ml-1 sm:ml-2"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
            }}
          >
            <button
              onClick={() => onSelectLanguage('c')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeLanguage === 'c' ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeLanguage === 'c' ? '#00599C' : 'transparent',
                color: activeLanguage === 'c' ? '#FFFFFF' : activeTheme.colors.textPrimary,
              }}
              title="Langage C (standard C11 / GCC 13.2)"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span>C (GCC)</span>
            </button>

            <button
              onClick={() => onSelectLanguage('rust')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                activeLanguage === 'rust' ? 'shadow-xs font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeLanguage === 'rust' ? '#CE412B' : 'transparent',
                color: activeLanguage === 'rust' ? '#FFFFFF' : activeTheme.colors.textPrimary,
              }}
              title="Langage Rust (rustc 1.78 / Édition 2021)"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
              <span>Rust (2021)</span>
            </button>
          </div>
        )}

        {/* Current Active File breadcrumb */}
        {activeFilePath && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono ml-1 border shrink-0 opacity-80"
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
          title={`Formater le code ${activeLanguage === 'rust' ? 'Rust' : 'C'}`}
        >
          <AlignLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden xl:inline">Formater {activeLanguage === 'rust' ? 'Rust' : 'C'}</span>
          <span className="inline xl:hidden">Formater</span>
        </button>

        {/* Primary Run Button - Never clipped */}
        <button
          onClick={onRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded font-semibold text-xs transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: activeLanguage === 'rust' ? '#CE412B' : activeTheme.colors.accent,
            color: '#FFFFFF',
          }}
          title={`Compiler et exécuter (${activeLanguage === 'rust' ? 'rustc' : 'GCC'}) [F5]`}
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
              <span className="inline xl:hidden">Exécuter {activeLanguage === 'rust' ? 'Rust' : 'C'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
