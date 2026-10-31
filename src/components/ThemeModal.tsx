import React, { useState, useMemo } from 'react';
import { THEMES } from '../themes';
import { PythonTheme, ThemeCategory } from '../types';
import { X, Check, Eye, Search, Sparkles } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ThemeCategory>('all');

  const categories = useMemo(
    () => [
      { key: 'all' as const, label: 'Tous', count: THEMES.length },
      {
        key: 'dark' as const,
        label: 'Sombres',
        count: THEMES.filter((t) => t.category === 'dark').length,
      },
      {
        key: 'light' as const,
        label: 'Clairs & Pastel',
        count: THEMES.filter((t) => t.category === 'light').length,
      },
      {
        key: 'high-contrast' as const,
        label: 'Haute Visibilité (AAA)',
        count: THEMES.filter((t) => t.category === 'high-contrast').length,
      },
    ],
    []
  );

  const filteredThemes = useMemo(() => {
    return THEMES.filter((theme) => {
      const matchesCategory =
        selectedCategory === 'all' || theme.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        theme.name.toLowerCase().includes(q) ||
        theme.description.toLowerCase().includes(q) ||
        theme.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

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
          className="flex flex-col gap-3 px-6 py-4 border-b"
          style={{ borderColor: activeTheme.colors.border }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" style={{ color: activeTheme.colors.accent }} />
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>Catalogue des Thèmes</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-mono font-semibold"
                    style={{
                      backgroundColor: activeTheme.colors.activeLineBg,
                      color: activeTheme.colors.accent,
                    }}
                  >
                    {THEMES.length} thèmes
                  </span>
                </h2>
                <p className="text-xs opacity-75">
                  Thèmes sombres profonds, clairs aérés, palettes pastel et modes haute accessibilité WCAG AAA.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:opacity-75 transition-opacity cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar & Category filter pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom (Dracula, Nord, Sauge, Matrix, Tokyo...)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-colors"
                style={{
                  backgroundColor: activeTheme.colors.editorBg,
                  borderColor: activeTheme.colors.border,
                  color: activeTheme.colors.textPrimary,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? activeTheme.colors.accent
                        : activeTheme.colors.tabInactiveBg,
                      borderColor: isSelected
                        ? activeTheme.colors.accent
                        : activeTheme.colors.border,
                      color: isSelected
                        ? activeTheme.colors.accentText
                        : activeTheme.colors.textPrimary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                  >
                    {cat.label} ({cat.count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredThemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center opacity-70">
              <p className="text-sm">Aucun thème ne correspond à "{searchQuery}".</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-3 text-xs underline cursor-pointer"
                style={{ color: activeTheme.colors.accent }}
              >
                Réinitialiser la recherche
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredThemes.map((theme) => {
                const isSelected = activeTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => onSelectTheme(theme)}
                    className="text-left p-3.5 rounded-lg border transition-all flex flex-col gap-2 relative overflow-hidden group hover:scale-[1.01] cursor-pointer"
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
                        {theme.isHighContrast ? (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold"
                            style={{
                              backgroundColor: theme.colors.accent,
                              color: theme.colors.accentText,
                            }}
                          >
                            AAA
                          </span>
                        ) : (
                          <span
                            className="text-[9px] font-sans px-1.5 py-0.5 rounded capitalize opacity-70"
                            style={{
                              backgroundColor: theme.colors.activeLineBg,
                              color: theme.colors.textSecondary,
                            }}
                          >
                            {theme.category === 'dark' ? 'Sombre' : 'Clair'}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span
                          className="p-0.5 rounded-full"
                          style={{
                            backgroundColor: theme.colors.accent,
                            color: theme.colors.accentText,
                          }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className="text-xs line-clamp-1 opacity-70">
                      {theme.description}
                    </p>

                    {/* Miniature Zig code syntax preview */}
                    <div
                      className="font-mono text-[11px] p-2 rounded border w-full overflow-hidden"
                      style={{
                        backgroundColor: theme.colors.editorGutterBg,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <span style={{ color: theme.colors.syntaxKeyword }}>pub fn </span>
                      <span style={{ color: theme.colors.syntaxFunction }}>main</span>
                      <span style={{ color: theme.colors.syntaxDefault }}>() !</span>
                      <span style={{ color: theme.colors.syntaxType }}>void </span>
                      <span style={{ color: theme.colors.syntaxDefault }}>&#123; &#125;</span>
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
          )}
        </div>
      </div>
    </div>
  );
};
