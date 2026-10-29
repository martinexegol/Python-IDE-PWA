import React, { useState } from 'react';
import { PythonDiagnostic, PythonTheme } from '../types';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ChevronRight, ChevronDown, Wrench, HelpCircle } from 'lucide-react';

interface ProblemsPanelProps {
  diagnostics: PythonDiagnostic[];
  onSelectProblem: (diagnostic: PythonDiagnostic) => void;
  activeTheme: PythonTheme;
  fileName?: string;
}

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  diagnostics,
  onSelectProblem,
  activeTheme,
  fileName = 'main.py',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');
  const infos = diagnostics.filter((d) => d.severity === 'info');

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId((prev) => (prev === id ? null : id));
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
            Analyse Statique Python en Direct
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
            <p className="text-sm font-sans">Aucun problème détecté.</p>
            <p className="text-[11px] opacity-60 font-sans">Le code Python est conforme et prêt à être exécuté sans erreur.</p>
          </div>
        ) : (
          diagnostics.map((diag) => {
            const isError = diag.severity === 'error';
            const isWarning = diag.severity === 'warning';
            const isExpanded = expandedId === diag.id;

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
                        {diag.code && (
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

                  {/* Toggle Explanation Button */}
                  <button
                    onClick={(e) => toggleExpand(diag.id, e)}
                    className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0 opacity-70 hover:opacity-100 flex items-center gap-1 text-[11px] font-sans"
                    title={isExpanded ? 'Masquer l\'explication' : 'Voir pourquoi et comment réparer'}
                  >
                    <span>{isExpanded ? 'Réduire' : 'Explication & Solution'}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Expanded Pedagogical Explanation */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t space-y-2 text-xs font-sans animate-in fade-in-50 duration-100" style={{ borderColor: activeTheme.colors.border }}>
                    {/* Pourquoi c'est une erreur */}
                    <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-400 mb-1">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Pourquoi c'est une erreur Python :</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        {diag.whyExplanation}
                      </p>
                    </div>

                    {/* Comment la réparer */}
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 font-bold text-[11px] text-emerald-400 mb-1">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Comment la réparer :</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90 mb-1.5">
                        {diag.howToFix}
                      </p>
                      {diag.suggestedCodeSnippet && (
                        <div>
                          <span className="text-[10px] opacity-75 font-semibold block mb-0.5">
                            Exemple de syntaxe correcte :
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
