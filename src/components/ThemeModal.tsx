import React from 'react';
import { THEMES } from '../themes';
import { PythonTheme } from '../types';
import { X, Check, Eye } from 'lucide-react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: PythonTheme;
  onSelectTheme: (theme: PythonTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  isOpen,
  onClose,
  activeTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const categories = [
    { key: 'high-contrast', label: 'Modes Contraste Élevé (Accessibilité WCAG AAA)' },
    { key: 'dark', label: 'Thèmes Sombres (Dark)' },
    { key: 'light', label: 'Thèmes Clairs & Pastel (Sauge, Pêche, Crème, Rose, Menthe, Céleste...)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[85vh] rounded-xl flex flex-col shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: activeTheme.colors.border }}
        >
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5" style={{ color: activeTheme.colors.accent }} />
            <div>
              <h2 className="text-lg font-bold">Catalogue des Thèmes ({THEMES.length} Thèmes)</h2>
              <p className="text-xs opacity-75">
                Du plus clair au plus sombre, incluant des palettes pastel (pêche, sauge, crème) et modes de contraste élevé pour l'accessibilité.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:opacity-75 transition-opacity"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {categories.map((cat) => {
            const themesInCat = THEMES.filter((t) => t.category === cat.key);
            return (
              <div key={cat.key} className="space-y-3">
                <h3 className="text-xs uppercase font-semibold tracking-wider opacity-60">
                  {cat.label} ({themesInCat.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {themesInCat.map((theme) => {
                    const isSelected = activeTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => onSelectTheme(theme)}
                        className={`text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2 relative overflow-hidden group hover:scale-[1.01]`}
                        style={{
                          backgroundColor: theme.colors.editorBg,
                          borderColor: isSelected
                            ? theme.colors.accent
                            : theme.colors.border,
                          borderWidth: isSelected ? '2px' : '1px',
                          color: theme.colors.textPrimary,
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{theme.name}</span>
                            {theme.isHighContrast && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold"
                                style={{
                                  backgroundColor: theme.colors.accent,
                                  color: theme.colors.accentText,
                                }}
                              >
                                AAA
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <span
                              className="p-0.5 rounded-full"
                              style={{ backgroundColor: theme.colors.accent, color: theme.colors.accentText }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs line-clamp-1 opacity-70">
                          {theme.description}
                        </p>

                        {/* Miniature syntax preview */}
                        <div
                          className="font-mono text-[11px] p-2 rounded border w-full overflow-hidden"
                          style={{
                            backgroundColor: theme.colors.editorGutterBg,
                            borderColor: theme.colors.border,
                          }}
                        >
                          <span style={{ color: theme.colors.syntaxKeyword }}>def </span>
                          <span style={{ color: theme.colors.syntaxFunction }}>main</span>
                          <span style={{ color: theme.colors.syntaxDefault }}>(): </span>
                          <span style={{ color: theme.colors.syntaxVariable }}>msg </span>
                          <span style={{ color: theme.colors.syntaxOperator }}>= </span>
                          <span style={{ color: theme.colors.syntaxString }}>"Python"</span>
                        </div>

                        {/* Palette swatch strip */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {[
                            theme.colors.editorBg,
                            theme.colors.syntaxKeyword,
                            theme.colors.syntaxType,
                            theme.colors.syntaxString,
                            theme.colors.syntaxFunction,
                            theme.colors.accent,
                          ].map((c, i) => (
                            <div
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
