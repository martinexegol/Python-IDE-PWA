import React, { useState } from 'react';
import { PythonDiagnostic, PythonTheme } from '../types';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Wrench,
  HelpCircle,
  Zap,
} from 'lucide-react';

interface ProblemsPanelProps {
  diagnostics: PythonDiagnostic[];
  onSelectProblem: (diagnostic: PythonDiagnostic) => void;
  onApplyFix?: (diagnostic: PythonDiagnostic) => void;
  activeTheme: PythonTheme;
  fileName?: string;
}

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  diagnostics,
  onSelectProblem,
  onApplyFix,
  activeTheme,
  fileName = 'main.zig',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const infos = diagnostics.filter((d) => d.severity === 'info');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getRiskBadge = (code?: string) => {
    switch (code) {
      case 'memory_leak':
      case 'gpa_missing_deinit':
        return { label: 'FUITE MÉMOIRE', bg: '#ef4444', text: '#ffffff' };
      case 'double_free':
        return { label: 'DOUBLE FREE', bg: '#dc2626', text: '#ffffff' };
      case 'unhandled_error_union':
        return { label: 'ERREUR NON GÉRÉE', bg: '#f97316', text: '#ffffff' };
      case 'missing_std_import':
        return { label: 'IMPORT MANQUANT', bg: '#e11d48', text: '#ffffff' };
      case 'division_by_zero':
        return { label: 'DIVISION / 0', bg: '#e11d48', text: '#ffffff' };
      default:
        return null;
    }
  };

  return (
    <div
      className="h-full flex flex-col text-xs font-mono select-none overflow-hidden"
      style={{
        backgroundColor: activeTheme.colors.consoleBg,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b text-[11px] font-sans"
        style={{ borderColor: activeTheme.colors.border }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider opacity-75">
            Diagnostic & Analyse Mémoire (Zig 0.13.0)
          </span>
          <div className="flex items-center gap-2">
            <span
              className="flex items-center gap-1 font-semibold"
              style={{ color: activeTheme.colors.errorText }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.length} {errors.length === 1 ? 'erreur' : 'erreurs'}
            </span>
            <span
              className="flex items-center gap-1 font-semibold"
              style={{ color: activeTheme.colors.warningText }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {warnings.length} {warnings.length === 1 ? 'avertissement' : 'avertissements'}
            </span>
            {infos.length > 0 && (
              <span className="flex items-center gap-1 text-sky-400">
                <Info className="w-3.5 h-3.5" />
                {infos.length} info
              </span>
            )}
          </div>
        </div>

        <span className="text-[11px] opacity-60 font-mono">
          Fichier : {fileName}
        </span>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {diagnostics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 opacity-70 gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            <p className="text-sm font-sans font-semibold">Aucun problème ni fuite de mémoire détecté.</p>
            <p className="text-[11px] opacity-60 font-sans">
              Le code source Zig respecte les contraintes du compilateur, la gestion d'erreurs et les allocations mémoire (GPA).
            </p>
          </div>
        ) : (
          diagnostics.map((diag) => {
            const isError = diag.severity === 'error';
            const isWarning = diag.severity === 'warning';
            const isExpanded = expandedId === diag.id;
            const riskBadge = getRiskBadge(diag.code);

            return (
              <div
                key={diag.id}
                onClick={() => onSelectProblem(diag)}
                className="rounded-lg border p-2.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: activeTheme.colors.tabInactiveBg,
                  borderColor: isError
                    ? activeTheme.colors.errorText + '40'
                    : activeTheme.colors.border,
                }}
              >
                {/* Main Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Pulsing Dot or Icon */}
                    <div className="mt-0.5 shrink-0 relative flex items-center justify-center w-3.5 h-3.5">
                      {isError ? (
                        <>
                          <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-500 opacity-75 animate-ping" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
                        </>
                      ) : isWarning ? (
                        <AlertTriangle
                          className="w-3.5 h-3.5"
                          style={{ color: activeTheme.colors.warningText }}
                        />
                      ) : (
                        <Info className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-xs text-rose-400">
                          {diag.message}
                        </span>

                        {riskBadge && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider"
                            style={{ backgroundColor: riskBadge.bg, color: riskBadge.text }}
                          >
                            {riskBadge.label}
                          </span>
                        )}

                        {diag.code && !riskBadge && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded border opacity-60">
                            {diag.code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] opacity-65 mt-0.5 font-sans">
                        {fileName} [Ligne {diag.line}, Colonne {diag.column}] • Cliquez pour aller à la ligne
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => toggleExpand(diag.id, e)}
                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 flex items-center gap-1 text-[11px] font-sans cursor-pointer"
                      title={isExpanded ? "Masquer l'explication" : 'Voir pourquoi et comment réparer'}
                    >
                      <span>{isExpanded ? 'Réduire' : 'Explication & Solution'}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Pedagogical Explanation */}
                {isExpanded && (
                  <div
                    className="mt-3 pt-2.5 border-t space-y-2 text-xs font-sans animate-in fade-in-50 duration-100"
                    style={{ borderColor: activeTheme.colors.border }}
                  >
                    {/* Pourquoi c'est une anomalie */}
                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400 mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Pourquoi c'est une anomalie / un risque en Zig :</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {diag.whyExplanation}
                      </p>
                    </div>

                    {/* Comment la réparer */}
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Comment la réparer :</span>
                        </div>

                        {onApplyFix && diag.suggestedCodeSnippet && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onApplyFix(diag);
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition-transform"
                            style={{
                              backgroundColor: activeTheme.colors.accent,
                              color: activeTheme.colors.accentText,
                            }}
                            title="Appliquer cette correction directement dans le code source"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Appliquer la correction</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] leading-relaxed opacity-90 mb-1.5">
                        {diag.howToFix}
                      </p>

                      {diag.suggestedCodeSnippet && (
                        <div>
                          <span className="text-[10px] opacity-75 font-semibold block mb-0.5">
                            Code de correction suggéré :
                          </span>
                          <pre className="font-mono text-[11px] p-2 rounded bg-black/30 text-emerald-300 overflow-x-auto whitespace-pre">
                            {diag.suggestedCodeSnippet}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
