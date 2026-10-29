import React, { useState, useRef, useEffect } from 'react';
import { ConsoleMessage, PythonDiagnostic, PythonTheme } from '../types';
import { ProblemsPanel } from './ProblemsPanel';
import {
  Terminal,
  AlertCircle,
  Play,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  Check,
  HelpCircle,
} from 'lucide-react';

interface TerminalConsoleProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  onRerun: () => void;
  isRunning: boolean;
  diagnostics: PythonDiagnostic[];
  onSelectProblem: (diagnostic: PythonDiagnostic) => void;
  activeTheme: PythonTheme;
  fileName?: string;
  onExecuteRepl: (cmd: string) => void;
  onDumpErrorExplanations?: () => void;
  defaultTab?: 'output' | 'problems' | 'repl';
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  messages,
  onClear,
  onRerun,
  isRunning,
  diagnostics,
  onSelectProblem,
  activeTheme,
  fileName,
  onExecuteRepl,
  onDumpErrorExplanations,
  defaultTab,
}) => {
  const [activeTab, setActiveTab] = useState<'output' | 'problems' | 'repl'>(defaultTab || 'output');
  const [replInput, setReplInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const errorsCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = diagnostics.filter((d) => d.severity === 'warning').length;

  useEffect(() => {
    if (activeTab === 'output' || activeTab === 'repl') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleCopyLogs = () => {
    const text = messages.map((m) => `[${m.timestamp}] ${m.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim()) return;
    onExecuteRepl(replInput.trim());
    setReplInput('');
  };

  const [height, setHeight] = useState<number>(240);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartYRef = useRef<number>(0);
  const dragStartHeightRef = useRef<number>(240);

  // Mouse & Touch Resizing logic
  const handleStartResize = (clientY: number) => {
    setIsDragging(true);
    dragStartYRef.current = clientY;
    dragStartHeightRef.current = height;

    const handleMove = (moveY: number) => {
      const deltaY = dragStartYRef.current - moveY;
      const minH = 80;
      const maxH = Math.floor(window.innerHeight * 0.75);
      const nextH = Math.min(maxH, Math.max(minH, dragStartHeightRef.current + deltaY));
      setHeight(nextH);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStartResize(e.clientY);
  };

  const handleTouchStartResize = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleStartResize(e.touches[0].clientY);
    }
  };

  if (isCollapsed) {
    return (
      <div
        className="flex items-center justify-between px-3 py-1.5 border-t text-xs font-mono select-none"
        style={{
          backgroundColor: activeTheme.colors.statusBarBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-1.5 font-semibold hover:opacity-80"
          >
            <Terminal className="w-3.5 h-3.5" style={{ color: activeTheme.colors.accent }} />
            <span>Console & Diagnostics Python</span>
            <ChevronUp className="w-3.5 h-3.5 ml-1" />
          </button>
          {errorsCount > 0 && (
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{
                backgroundColor: activeTheme.colors.errorSquiggle,
                color: '#fff',
              }}
            >
              {errorsCount} erreurs
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative border-t flex flex-col font-mono text-xs select-none transition-colors duration-150 flex-1 md:flex-initial shrink-0"
      style={{
        height: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : `${height}px`,
        backgroundColor: activeTheme.colors.consoleBg,
        borderColor: activeTheme.colors.border,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* Draggable Resize Handle Bar (Mouse + Touch on Tablet/Desktop) */}
      <div
        onMouseDown={handleMouseDownResize}
        onTouchStart={handleTouchStartResize}
        onDoubleClick={() => setHeight((prev) => (prev > 300 ? 200 : 420))}
        className="hidden md:flex absolute -top-1.5 left-0 right-0 h-3 cursor-row-resize z-30 items-center justify-center group touch-none select-none"
        title="Glisser pour redimensionner la console (Double-clic pour agrandir/réduire)"
      >
        <div
          className={`h-1 rounded-full transition-all duration-150 ${
            isDragging
              ? 'w-24 opacity-100'
              : 'w-12 opacity-40 group-hover:opacity-100 group-hover:w-20'
          }`}
          style={{ backgroundColor: activeTheme.colors.accent }}
        />
      </div>
      {/* Top Console Bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b shrink-0 text-xs font-sans"
        style={{
          backgroundColor: activeTheme.colors.tabBarBg,
          borderColor: activeTheme.colors.border,
        }}
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
              activeTab === 'output' ? 'font-semibold' : 'opacity-65 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'output' ? activeTheme.colors.tabActiveBg : 'transparent',
              color: activeTab === 'output' ? activeTheme.colors.accent : 'inherit',
            }}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Sortie Console</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
              activeTab === 'problems' ? 'font-semibold' : 'opacity-65 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'problems' ? activeTheme.colors.tabActiveBg : 'transparent',
              color: activeTab === 'problems' ? activeTheme.colors.accent : 'inherit',
            }}
          >
            <AlertCircle
              className="w-3.5 h-3.5"
              style={{
                color: errorsCount > 0 ? activeTheme.colors.errorText : activeTheme.colors.accent,
              }}
            />
            <span>Problèmes ({errorsCount + warningsCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('repl')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors ${
              activeTab === 'repl' ? 'font-semibold' : 'opacity-65 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'repl' ? activeTheme.colors.tabActiveBg : 'transparent',
              color: activeTab === 'repl' ? activeTheme.colors.accent : 'inherit',
            }}
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>REPL Interactif</span>
          </button>
        </div>

        {/* Console Controls */}
        <div className="flex items-center gap-1.5">
          {errorsCount > 0 && onDumpErrorExplanations && (
            <button
              onClick={onDumpErrorExplanations}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium transition-colors border hover:opacity-90"
              style={{
                backgroundColor: activeTheme.colors.errorSquiggle + '25',
                borderColor: activeTheme.colors.errorText,
                color: activeTheme.colors.errorText,
              }}
              title="Afficher les explications 'Pourquoi' et 'Comment réparer' dans le terminal pour éviter les erreurs de compilation"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Expliquer les erreurs ({errorsCount})</span>
            </button>
          )}

          <button
            onClick={onRerun}
            disabled={isRunning}
            className="p-1 rounded hover:opacity-75 transition-opacity disabled:opacity-40"
            title="Relancer le programme Python (F5)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            title="Copier les logs de la console"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            title="Effacer la console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded hover:opacity-75 transition-opacity ml-1"
            title="Réduire le panneau inférieur"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'output' && (
          <div className="h-full overflow-y-auto p-3 space-y-1 font-mono text-[12px] leading-relaxed select-text">
            {messages.length === 0 ? (
              <div className="opacity-40 italic py-4 text-center select-none font-sans">
                Console prête. Cliquez sur « Exécuter Python » ou pressez F5 pour lancer le programme.
              </div>
            ) : (
              messages.map((msg) => {
                let color = activeTheme.colors.textPrimary;
                if (msg.type === 'stderr') color = activeTheme.colors.errorText;
                if (msg.type === 'system') color = activeTheme.colors.syntaxComment;
                if (msg.type === 'info') color = activeTheme.colors.accent;

                return (
                  <div key={msg.id} className="flex items-start gap-2">
                    <span className="opacity-40 select-none text-[10px] shrink-0 pt-0.5">
                      [{msg.timestamp}]
                    </span>
                    <pre
                      className="whitespace-pre-wrap break-all font-mono"
                      style={{ color }}
                    >
                      {msg.text}
                    </pre>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'problems' && (
          <ProblemsPanel
            diagnostics={diagnostics}
            onSelectProblem={onSelectProblem}
            activeTheme={activeTheme}
            fileName={fileName}
          />
        )}

        {activeTab === 'repl' && (
          <div className="h-full flex flex-col p-3">
            <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[12px] select-text">
              <div className="opacity-60 italic text-xs mb-2 font-sans">
                Entrez une expression Python pour l'évaluer instantanément (ex: `2 + 2`, `print("Hello Python!")`, `[x**2 for x in range(5)]`)
              </div>
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <span className="opacity-40 text-[10px] shrink-0">[{msg.timestamp}]</span>
                  <pre
                    className="whitespace-pre-wrap break-all font-mono"
                    style={{
                      color:
                        msg.type === 'stderr'
                          ? activeTheme.colors.errorText
                          : msg.type === 'info'
                          ? activeTheme.colors.accent
                          : activeTheme.colors.textPrimary,
                    }}
                  >
                    {msg.text}
                  </pre>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* REPL Input Form */}
            <form onSubmit={handleReplSubmit} className="mt-2 flex items-center gap-2 pt-2 border-t" style={{ borderColor: activeTheme.colors.border }}>
              <span className="font-bold" style={{ color: activeTheme.colors.accent }}>
                python&gt;&gt;&gt;
              </span>
              <input
                type="text"
                value={replInput}
                onChange={(e) => setReplInput(e.target.value)}
                placeholder="Tapez une instruction Python (ex: print('Hello'), 2 + 2, len([1, 2, 3]))..."
                className="flex-1 bg-transparent outline-none font-mono text-xs"
                style={{ color: activeTheme.colors.textPrimary }}
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded text-xs font-semibold"
                style={{
                  backgroundColor: activeTheme.colors.accent,
                  color: activeTheme.colors.accentText,
                }}
              >
                Évaluer
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
