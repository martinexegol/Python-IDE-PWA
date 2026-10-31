import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { THEMES } from './themes';
import { DEFAULT_WORKSPACE_FILES } from './defaultWorkspace';
import { PythonTheme, FileNode, TabItem, PythonDiagnostic, ConsoleMessage } from './types';
import { lintZigCode, formatZigCode } from './zig/linter';
import { runZigCode } from './zig/runner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { CodeEditor } from './components/CodeEditor';
import { TerminalConsole } from './components/TerminalConsole';
import { ThemeModal } from './components/ThemeModal';
import { NewFileDialog } from './components/NewFileDialog';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HorizontalSplitter } from './components/HorizontalSplitter';
import {
  FileCode,
  Terminal,
  AlertCircle,
  Play,
  Loader2,
  FolderCode,
} from 'lucide-react';

export default function App() {
  // 1. Theme state
  const [activeTheme, setActiveTheme] = useState<PythonTheme>(() => {
    const saved = localStorage.getItem('ide_studio_theme');
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return THEMES[3]; // One Dark Pro
  });

  // 2. Multi-File Project State
  const STORAGE_KEY = 'ide_zig_workspace_v1';

  const [files, setFiles] = useState<FileNode[]>(() => {
    // Purge legacy storage keys containing example / demo files or old workspaces
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('ide_') && k !== STORAGE_KEY && k !== 'ide_studio_theme') {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldDemoCode = parsed.some(
            (f: any) =>
              typeof f.content === 'string' &&
              (f.content.includes('SensorData') ||
                f.content.includes('pointers_demo') ||
                f.content.includes('PowerSupply'))
          );
          if (!hasOldDemoCode) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_WORKSPACE_FILES;
  });

  const [activeFileId, setActiveFileId] = useState<string>('file-main-zig');

  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    {
      fileId: 'file-main-zig',
      name: 'main.zig',
      path: 'main.zig',
      isModified: false,
    },
  ]);

  // 3. Console & Execution state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    {
      id: 'init-msg-1',
      type: 'system',
      text: 'Compilateur Zig 0.13.0 prêt',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 4. Layout & Splitter State
  const [editorHeightPercent, setEditorHeightPercent] = useState<number>(58);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'terminal' | 'problems'>('editor');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 5. Modals
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);

  // Save files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Erreur de sauvegarde locale :', e);
    }
  }, [files]);

  // Save selected theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ide_studio_theme', activeTheme.id);
    } catch (e) {
      console.warn('Erreur sauvegarde thème :', e);
    }
  }, [activeTheme]);

  // Locate active file in tree
  const findFileById = useCallback(
    (nodes: FileNode[], id: string): FileNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = findFileById(node.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const activeFileNode = useMemo(() => {
    return findFileById(files, activeFileId);
  }, [files, activeFileId, findFileById]);

  const activeCode = activeFileNode?.content ?? '';

  // Synchronous static analysis (Zig Linter & Memory Diagnostics)
  const diagnostics: PythonDiagnostic[] = useMemo(() => {
    if (!activeFileNode || activeFileNode.isFolder) return [];
    if (!activeFileNode.name.endsWith('.zig')) return [];
    return lintZigCode(activeCode);
  }, [activeFileNode, activeCode]);

  // Code change handler
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setFiles((prevFiles) => {
        const updateRecursive = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            if (node.id === activeFileId) {
              return { ...node, content: newCode };
            }
            if (node.children) {
              return { ...node, children: updateRecursive(node.children) };
            }
            return node;
          });
        };
        return updateRecursive(prevFiles);
      });

      // Mark tab as modified
      setOpenTabs((prev) =>
        prev.map((t) => (t.fileId === activeFileId ? { ...t, isModified: true } : t))
      );
    },
    [activeFileId]
  );

  // Dump detailed error report to terminal console
  const handleDumpErrorExplanations = useCallback(() => {
    if (diagnostics.length === 0) return;

    const timeStr = new Date().toLocaleTimeString('fr-FR');
    const newLogs: ConsoleMessage[] = [
      {
        id: `diag-header-${Date.now()}`,
        type: 'system',
        text: `─`.repeat(60),
        timestamp: timeStr,
      },
      {
        id: `diag-title-${Date.now()}`,
        type: 'stderr',
        text: `⚠️ Rapport du Compilateur Zig (zig 0.13.0) : ${diagnostics.length} anomalie(s) détectée(s) :`,
        timestamp: timeStr,
      },
    ];

    diagnostics.forEach((d, idx) => {
      const block = [
        `\n[Erreur #${idx + 1}] Ligne ${d.line}, Colonne ${d.column} : ${d.message}`,
        `❓ Explication :\n   ${d.whyExplanation}`,
        `💡 Solution suggérée :\n   ${d.howToFix}`,
        d.suggestedCodeSnippet ? `Exemple :\n   ${d.suggestedCodeSnippet}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      newLogs.push({
        id: `diag-item-${Date.now()}-${idx}`,
        type: d.severity === 'error' ? 'stderr' : 'info',
        text: block,
        timestamp: timeStr,
      });
    });

    setConsoleMessages((prev) => [...prev, ...newLogs]);
  }, [diagnostics]);

  // Apply 1-click automatic fix for diagnostic
  const handleApplyFix = (diag: PythonDiagnostic) => {
    if (!diag.suggestedCodeSnippet) return;

    if (diag.code === 'missing_std_import') {
      handleCodeChange(`${diag.suggestedCodeSnippet}${activeCode}`);
      return;
    }

    const curLines = activeCode.split('\n');

    if (diag.code === 'memory_leak') {
      const allocLine = diag.line;
      if (allocLine <= curLines.length) {
        curLines.splice(allocLine, 0, `    ${diag.suggestedCodeSnippet}`);
        handleCodeChange(curLines.join('\n'));
        return;
      }
    }

    const lineIdx = diag.line - 1;
    if (lineIdx >= 0 && lineIdx < curLines.length) {
      curLines[lineIdx] = diag.suggestedCodeSnippet;
      handleCodeChange(curLines.join('\n'));
    }
  };

  // Execute current Zig code
  const handleRunCode = async () => {
    const compileErrors = diagnostics.filter((d) => d.severity === 'error');
    if (compileErrors.length > 0) {
      handleDumpErrorExplanations();
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setMobileView('terminal');
      }
      return;
    }

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('terminal');
    }

    setIsRunning(true);
    const fileName = activeFileNode?.name || 'main.zig';
    const result = await runZigCode(activeCode, fileName);
    setConsoleMessages((prev) => [...prev, ...result.messages]);
    setIsRunning(false);
  };

  // Format Code (Zig standard, 4 spaces)
  const handleFormatCode = () => {
    const formatted = formatZigCode(activeCode);
    handleCodeChange(formatted);
    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `fmt-${Date.now()}`,
        type: 'info',
        text: 'Code formaté (Zig standard, 4 espaces).',
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);
  };

  // REPL interactive command evaluation
  const handleExecuteRepl = async (command: string) => {
    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `repl-in-${Date.now()}`,
        type: 'system',
        text: `zig-sh$ ${command}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);

    let executable = command;
    if (!command.includes('pub fn main') && !command.includes('@import')) {
      executable = `const std = @import("std");\n\npub fn main() !void {\n    ${command};\n}`;
    }
    const result = await runZigCode(executable, 'repl.zig');
    setConsoleMessages((prev) => [...prev, ...result.messages.filter((m) => m.type !== 'system')]);
  };

  // Splitter Handlers
  const handleHorizontalDrag = (deltaY: number) => {
    if (!rightContainerRef.current) return;
    const totalHeight = rightContainerRef.current.clientHeight;
    if (totalHeight <= 0) return;
    const deltaPercent = (deltaY / totalHeight) * 100;
    setEditorHeightPercent((prev) => Math.min(82, Math.max(18, prev + deltaPercent)));
  };

  // Multi-File Project Methods
  const handleSelectFile = (file: FileNode) => {
    if (file.isFolder) return;
    setActiveFileId(file.id);
    if (!openTabs.some((t) => t.fileId === file.id)) {
      setOpenTabs((prev) => [
        ...prev,
        {
          fileId: file.id,
          name: file.name,
          path: file.path,
          isModified: false,
        },
      ]);
    }
  };

  const handleCloseTab = (fileId: string) => {
    const nextTabs = openTabs.filter((t) => t.fileId !== fileId);
    setOpenTabs(nextTabs);
    if (activeFileId === fileId && nextTabs.length > 0) {
      setActiveFileId(nextTabs[nextTabs.length - 1].fileId);
    }
  };

  const handleCreateFile = (name: string, isFolder: boolean, parentPath: string) => {
    const newId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const initialContent = '';

    const newNode: FileNode = {
      id: newId,
      name,
      path: parentPath ? `${parentPath}/${name}` : name,
      isFolder,
      content: initialContent,
      children: isFolder ? [] : undefined,
    };

    if (!parentPath) {
      setFiles((prev) => [...prev, newNode]);
    } else {
      const insertRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.isFolder && (node.path === parentPath || node.name === parentPath)) {
            return {
              ...node,
              children: [...(node.children || []), newNode],
            };
          }
          if (node.children) {
            return { ...node, children: insertRecursive(node.children) };
          }
          return node;
        });
      };
      setFiles((prev) => insertRecursive(prev));
    }

    if (!isFolder) {
      setActiveFileId(newId);
      setOpenTabs((prev) => [
        ...prev,
        {
          fileId: newId,
          name,
          path: parentPath ? `${parentPath}/${name}` : name,
          isModified: false,
        },
      ]);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const deleteRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((n) => n.id !== fileId)
        .map((n) => ({
          ...n,
          children: n.children ? deleteRecursive(n.children) : undefined,
        }));
    };

    setFiles((prev) => deleteRecursive(prev));
    handleCloseTab(fileId);
  };

  const handleResetWorkspace = () => {
    if (confirm('Réinitialiser l\'espace de travail à son état initial Zig ?')) {
      setFiles(DEFAULT_WORKSPACE_FILES);
      setActiveFileId('file-main-zig');
      setOpenTabs([
        {
          fileId: 'file-main-zig',
          name: 'main.zig',
          path: 'main.zig',
          isModified: false,
        },
      ]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSelectProblem = (diag: PythonDiagnostic) => {
    setJumpToLine(diag.line);
    setMobileView('editor');
  };

  const errorsCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <div
      className="h-screen w-screen flex flex-col overflow-hidden select-none"
      style={{
        backgroundColor: activeTheme.colors.appBg,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* 1. Header Toolbar */}
      <Header
        activeTheme={activeTheme}
        onSelectTheme={(t) => setActiveTheme(t)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onFormatCode={handleFormatCode}
        diagnostics={diagnostics}
        onOpenDiagnostics={() => setMobileView('problems')}
        activeFilePath={activeFileNode?.path}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Workspace (Sidebar + Editor / Console) */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Sidebar (File Explorer) */}
        <div
          className={`shrink-0 transition-all duration-200 z-20 ${
            isSidebarCollapsed ? 'w-0 overflow-hidden hidden md:hidden' : 'w-56 md:w-60'
          }`}
        >
          <Sidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onDeleteFile={handleDeleteFile}
            onOpenNewFileDialog={() => setNewFileDialogOpen(true)}
            onResetWorkspace={handleResetWorkspace}
            activeTheme={activeTheme}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {/* Right Coding & Terminal Work Area */}
        <div
          ref={rightContainerRef}
          className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
          style={{ backgroundColor: activeTheme.colors.editorBg }}
        >
          {/* File Tabs Bar */}
          <TabBar
            tabs={openTabs}
            activeFileId={activeFileId}
            onSelectTab={(id) => setActiveFileId(id)}
            onCloseTab={handleCloseTab}
            activeTheme={activeTheme}
          />

          {/* Split Work Area: Upper Code Editor, Lower Console */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Top Code Editor */}
            <div
              className={`flex flex-col min-h-0 relative ${
                mobileView === 'editor' ? 'flex-1 flex' : 'hidden md:flex'
              }`}
              style={{
                height:
                  typeof window !== 'undefined' && window.innerWidth >= 768
                    ? `${editorHeightPercent}%`
                    : mobileView === 'editor'
                    ? '100%'
                    : '58%',
              }}
            >
              {activeFileNode ? (
                <CodeEditor
                  code={activeCode}
                  onChange={handleCodeChange}
                  activeTheme={activeTheme}
                  diagnostics={diagnostics}
                  jumpToLine={jumpToLine}
                  onJumpComplete={() => setJumpToLine(null)}
                  onApplyFix={handleApplyFix}
                />
              ) : (
                <div
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  style={{ backgroundColor: activeTheme.colors.editorBg }}
                >
                  <p className="text-sm opacity-60 mb-3">Aucun fichier sélectionné.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreateFile('main.zig', false, '')}
                      className="px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: '#F7A41D',
                        color: '#1A1816',
                      }}
                    >
                      Créer main.zig (Zig)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Horizontal Draggable Splitter */}
            <div className="hidden md:block shrink-0">
              <HorizontalSplitter
                onDrag={handleHorizontalDrag}
                activeTheme={activeTheme}
                onReset={() => setEditorHeightPercent(58)}
              />
            </div>

            {/* Bottom Terminal Console */}
            <div
              className={`flex flex-col min-h-0 overflow-hidden ${
                mobileView === 'terminal' || mobileView === 'problems'
                  ? 'flex-1 flex'
                  : 'hidden md:flex'
              }`}
              style={{
                height:
                  typeof window !== 'undefined' && window.innerWidth >= 768
                    ? `${100 - editorHeightPercent}%`
                    : undefined,
              }}
            >
              <TerminalConsole
                messages={consoleMessages}
                onClear={() => setConsoleMessages([])}
                onRerun={handleRunCode}
                isRunning={isRunning}
                diagnostics={diagnostics}
                onSelectProblem={handleSelectProblem}
                onApplyFix={handleApplyFix}
                activeTheme={activeTheme}
                fileName={activeFileNode?.name}
                onExecuteRepl={handleExecuteRepl}
                onDumpErrorExplanations={handleDumpErrorExplanations}
                defaultTab={mobileView === 'problems' ? 'problems' : 'output'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Bottom Bar */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden shrink-0 border-t flex items-center justify-around py-2 px-2 z-30 shadow-lg select-none"
        style={{
          backgroundColor: activeTheme.colors.tabBarBg,
          borderColor: activeTheme.colors.border,
        }}
      >
        <button
          onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          className="flex flex-col items-center gap-0.5 text-[11px] opacity-75 hover:opacity-100"
        >
          <FolderCode className="w-4 h-4" />
          <span>Fichiers</span>
        </button>

        <button
          onClick={() => setMobileView('editor')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold"
          style={{
            color: mobileView === 'editor' ? activeTheme.colors.accent : activeTheme.colors.textSecondary,
          }}
        >
          <FileCode className="w-4 h-4" />
          <span>Éditeur</span>
        </button>

        <button
          onClick={() => setMobileView('terminal')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold"
          style={{
            color: mobileView === 'terminal' ? activeTheme.colors.accent : activeTheme.colors.textSecondary,
          }}
        >
          <Terminal className="w-4 h-4" />
          <span>Terminal</span>
        </button>

        <button
          onClick={() => setMobileView('problems')}
          className="flex flex-col items-center gap-0.5 text-[11px] font-semibold relative"
          style={{
            color: mobileView === 'problems' ? activeTheme.colors.accent : activeTheme.colors.textSecondary,
          }}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Diagnostic</span>
          {errorsCount > 0 && (
            <span className="absolute -top-1 right-2 w-3.5 h-3.5 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
              {errorsCount}
            </span>
          )}
        </button>

        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-1 px-3 py-1 rounded font-bold text-xs shadow-md active:scale-95 cursor-pointer"
          style={{
            backgroundColor: activeTheme.colors.accent,
            color: activeTheme.colors.accentText,
          }}
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Exécuter</span>
        </button>
      </nav>

      {/* 4. Modals */}
      <ThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={(t) => {
          setActiveTheme(t);
        }}
      />

      <NewFileDialog
        isOpen={newFileDialogOpen}
        onClose={() => setNewFileDialogOpen(false)}
        onCreate={handleCreateFile}
        activeTheme={activeTheme}
        folders={[]}
      />
    </div>
  );
}
