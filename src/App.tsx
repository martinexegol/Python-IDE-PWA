import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { THEMES } from './themes';
import { DEFAULT_WORKSPACE_FILES } from './defaultWorkspace';
import { PythonTheme, FileNode, TabItem, PythonDiagnostic, ConsoleMessage } from './types';
import { lintCCode, formatCCode } from './c/linter';
import { runCCode } from './c/runner';
import { lintRustCode, formatRustCode } from './rust/linter';
import { runRustCode } from './rust/runner';
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

  // 2. Active Language state ('rust' | 'c')
  const [activeLanguage, setActiveLanguage] = useState<'rust' | 'c'>(() => {
    const saved = localStorage.getItem('ide_active_language');
    return saved === 'c' ? 'c' : 'rust';
  });

  // 3. Multi-File Project State
  const STORAGE_KEY = 'ide_crust_workspace_v1';

  const [files, setFiles] = useState<FileNode[]>(() => {
    // Purge legacy storage keys containing example / demo files
    try {
      localStorage.removeItem('ide_workspace_files');
      localStorage.removeItem('ide_active_course_lesson');
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
              (f.content.includes('Hello from Rust') ||
                f.content.includes('Hello from C') ||
                f.content.includes('SensorData') ||
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

  const [activeFileId, setActiveFileId] = useState<string>('file-main-rs');

  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    {
      fileId: 'file-main-rs',
      name: 'main.rs',
      path: 'main.rs',
      isModified: false,
    },
  ]);

  // 4. Console & Execution state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    {
      id: 'init-msg-1',
      type: 'system',
      text: 'Compilateurs prêts • rustc 1.78.0 (Rust 2021) & GCC 13.2.0 (C11)',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // 5. Layout & Splitter State
  const [editorHeightPercent, setEditorHeightPercent] = useState<number>(58);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<'editor' | 'terminal' | 'problems'>('editor');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // 6. Modals
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);

  // Sync files to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
      // ignore storage overflow
    }
  }, [files]);

  // Find active file node
  const findFileNode = useCallback(
    (nodes: FileNode[], targetId: string): FileNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children) {
          const res = findFileNode(node.children, targetId);
          if (res) return res;
        }
      }
      return null;
    },
    []
  );

  const activeFileNode = useMemo(
    () => findFileNode(files, activeFileId),
    [files, activeFileId, findFileNode]
  );

  // Auto-detect active language based on current file extension
  useEffect(() => {
    if (activeFileNode) {
      if (activeFileNode.name.endsWith('.rs')) {
        setActiveLanguage('rust');
        localStorage.setItem('ide_active_language', 'rust');
      } else if (activeFileNode.name.endsWith('.c') || activeFileNode.name.endsWith('.h')) {
        setActiveLanguage('c');
        localStorage.setItem('ide_active_language', 'c');
      }
    }
  }, [activeFileNode]);

  const activeCode = activeFileNode?.content ?? '';

  // Live compiler diagnostics for active code
  const diagnostics: PythonDiagnostic[] = useMemo(() => {
    if (activeLanguage === 'rust') {
      return lintRustCode(activeCode);
    }
    return lintCCode(activeCode);
  }, [activeCode, activeLanguage]);

  // Save selected theme
  const handleSelectTheme = (theme: PythonTheme) => {
    setActiveTheme(theme);
    localStorage.setItem('ide_studio_theme', theme.id);
  };

  // Switch language explicitly
  const handleSelectLanguage = (lang: 'c' | 'rust') => {
    setActiveLanguage(lang);
    localStorage.setItem('ide_active_language', lang);

    // Switch active tab to matching starter file if available
    const targetFile = files.find((f) => lang === 'rust' ? f.name.endsWith('.rs') : f.name.endsWith('.c'));
    if (targetFile) {
      setActiveFileId(targetFile.id);
      if (!openTabs.some((t) => t.fileId === targetFile.id)) {
        setOpenTabs((prev) => [
          ...prev,
          {
            fileId: targetFile.id,
            name: targetFile.name,
            path: targetFile.path,
            isModified: false,
          },
        ]);
      }
    }

    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `lang-switch-${Date.now()}`,
        type: 'info',
        text: `Langage actif : ${lang === 'rust' ? 'Rust (rustc 1.78 / Édition 2021)' : 'C (GCC 13.2 / C11 standard)'}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);
  };

  // Code change handler
  const handleCodeChange = (newCode: string) => {
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

    setFiles((prev) => updateRecursive(prev));
    setOpenTabs((prev) =>
      prev.map((t) => (t.fileId === activeFileId ? { ...t, isModified: true } : t))
    );
  };

  // Jump from Diagnostics to specific line in editor
  const handleSelectProblem = (diag: PythonDiagnostic) => {
    setJumpToLine(diag.line);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('editor');
    }
  };

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
        text: `⚠️ Rapport du Compilateur ${activeLanguage === 'rust' ? 'Rust (rustc)' : 'C (GCC)'} : ${diagnostics.length} anomalie(s) détectée(s) :`,
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
  }, [diagnostics, activeLanguage]);

  // Execute current code (Rust or C)
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
    const fileName = activeFileNode?.name || (activeLanguage === 'rust' ? 'main.rs' : 'main.c');

    if (activeLanguage === 'rust' || fileName.endsWith('.rs')) {
      const result = await runRustCode(activeCode, fileName);
      setConsoleMessages((prev) => [...prev, ...result.messages]);
    } else {
      const result = await runCCode(activeCode, fileName);
      setConsoleMessages((prev) => [...prev, ...result.messages]);
    }

    setIsRunning(false);
  };

  // Format Code (Rust or C)
  const handleFormatCode = () => {
    let formatted = activeCode;
    if (activeLanguage === 'rust' || activeFileNode?.name.endsWith('.rs')) {
      formatted = formatRustCode(activeCode);
    } else {
      formatted = formatCCode(activeCode);
    }
    handleCodeChange(formatted);
    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `fmt-${Date.now()}`,
        type: 'info',
        text: `Code formaté (${activeLanguage === 'rust' ? 'Rust 4 espaces' : 'C standard 4 espaces'}).`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);
  };

  // REPL interactive command evaluation
  const handleExecuteRepl = async (command: string) => {
    const isRust = activeLanguage === 'rust' || activeFileNode?.name.endsWith('.rs');

    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `repl-in-${Date.now()}`,
        type: 'system',
        text: `${isRust ? 'rust-sh$' : 'gcc-sh$'} ${command}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);

    if (isRust) {
      let executable = command;
      if (!command.includes('fn main')) {
        executable = `fn main() {\n    ${command};\n}`;
      }
      const result = await runRustCode(executable, 'repl.rs');
      setConsoleMessages((prev) => [...prev, ...result.messages.filter((m) => m.type !== 'system')]);
    } else {
      let executable = command;
      if (!command.includes('int main') && !command.includes('#include')) {
        executable = `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <math.h>\n\nint main(void) {\n    ${command};\n    return 0;\n}`;
      }
      const result = await runCCode(executable, 'repl.c');
      setConsoleMessages((prev) => [...prev, ...result.messages.filter((m) => m.type !== 'system')]);
    }
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
          path: newNode.path,
          isModified: false,
        },
      ]);
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const deleteRecursive = (nodes: FileNode[]): FileNode[] => {
      return nodes
        .filter((node) => node.id !== fileId)
        .map((node) => ({
          ...node,
          children: node.children ? deleteRecursive(node.children) : undefined,
        }));
    };

    setFiles((prev) => deleteRecursive(prev));
    handleCloseTab(fileId);
  };

  // Reset entire workspace to pristine blank project
  const handleResetWorkspace = () => {
    const blankFiles: FileNode[] = [
      {
        id: 'file-main-rs',
        name: 'main.rs',
        path: 'main.rs',
        isFolder: false,
        content: '',
      },
    ];
    setFiles(blankFiles);
    setActiveFileId('file-main-rs');
    setOpenTabs([
      {
        fileId: 'file-main-rs',
        name: 'main.rs',
        path: 'main.rs',
        isModified: false,
      },
    ]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blankFiles));
    } catch {
      // ignore
    }
  };

  const allFolders = useMemo(() => {
    const list: string[] = [];
    const collect = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.isFolder) {
          list.push(n.path);
          if (n.children) collect(n.children);
        }
      }
    };
    collect(files);
    return list;
  }, [files]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden font-sans select-none antialiased"
      style={{
        backgroundColor: activeTheme.colors.appBg,
        color: activeTheme.colors.textPrimary,
      }}
    >
      <OfflineIndicator />

      {/* 1. Header (Brand, C / Rust Switcher, Theme, Run, Format) */}
      <Header
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onFormatCode={handleFormatCode}
        diagnostics={diagnostics}
        onOpenDiagnostics={() => setMobileView('problems')}
        activeFilePath={activeFileNode?.path}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        activeLanguage={activeLanguage}
        onSelectLanguage={handleSelectLanguage}
      />

      {/* 2. Main IDE Workspace (Sidebar + Editor + Terminal) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
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

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden" ref={rightContainerRef}>
          {/* Tab Bar */}
          <TabBar
            tabs={openTabs}
            activeFileId={activeFileId}
            onSelectTab={(id) => setActiveFileId(id)}
            onCloseTab={handleCloseTab}
            activeTheme={activeTheme}
          />

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Editor Container */}
            <div
              className={`flex flex-col overflow-hidden min-h-0 ${
                mobileView === 'editor' ? 'flex' : 'hidden md:flex'
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
                  language={activeLanguage}
                />
              ) : (
                <div
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  style={{ backgroundColor: activeTheme.colors.editorBg }}
                >
                  <p className="text-sm opacity-60 mb-3">Aucun fichier sélectionné.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCreateFile('main.rs', false, '')}
                      className="px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: '#CE412B',
                        color: '#FFFFFF',
                      }}
                    >
                      Créer main.rs (Rust)
                    </button>
                    <button
                      onClick={() => handleCreateFile('main.c', false, '')}
                      className="px-3.5 py-1.5 rounded text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: '#00599C',
                        color: '#FFFFFF',
                      }}
                    >
                      Créer main.c (C)
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
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
        }}
      >
        <button
          onClick={() => setMobileView('editor')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            mobileView === 'editor' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color:
              mobileView === 'editor' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <FileCode className="w-4 h-4" />
          <span>Éditeur</span>
        </button>

        <button
          onClick={() => setMobileView('terminal')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            mobileView === 'terminal' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color:
              mobileView === 'terminal' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <Terminal className="w-4 h-4" />
          <span>Console</span>
        </button>

        <button
          onClick={() => setMobileView('problems')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors relative cursor-pointer ${
            mobileView === 'problems' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color:
              mobileView === 'problems' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Problèmes</span>
          {diagnostics.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
              {diagnostics.length}
            </span>
          )}
        </button>

        <button
          onClick={handleRunCode}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          style={{
            backgroundColor: activeLanguage === 'rust' ? '#CE412B' : activeTheme.colors.accent,
            color: '#FFFFFF',
          }}
          title="Compiler et exécuter"
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
      {themeModalOpen && (
        <ThemeModal
          isOpen={themeModalOpen}
          activeTheme={activeTheme}
          onSelectTheme={handleSelectTheme}
          onClose={() => setThemeModalOpen(false)}
        />
      )}

      {newFileDialogOpen && (
        <NewFileDialog
          isOpen={newFileDialogOpen}
          onClose={() => setNewFileDialogOpen(false)}
          onCreate={handleCreateFile}
          activeTheme={activeTheme}
          folders={allFolders}
        />
      )}
    </div>
  );
}
