import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { THEMES } from './themes';
import { DEFAULT_FILES } from './defaultFiles';
import { PythonTheme, FileNode, TabItem, PythonDiagnostic, ConsoleMessage } from './types';
import { lintPythonCode } from './python/linter';
import { formatPythonCode } from './python/indentation';
import { runPythonCode } from './python/runner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TabBar } from './components/TabBar';
import { CodeEditor } from './components/CodeEditor';
import { TerminalConsole } from './components/TerminalConsole';
import { ThemeModal } from './components/ThemeModal';
import { NewFileDialog } from './components/NewFileDialog';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { FileCode, Terminal, AlertCircle, Play, Loader2 } from 'lucide-react';

export default function App() {
  // Theme state: default to One Dark Pro (one of the 22 themes)
  const [activeTheme, setActiveTheme] = useState<PythonTheme>(() => {
    const saved = localStorage.getItem('python_studio_theme');
    if (saved) {
      const found = THEMES.find((t) => t.id === saved);
      if (found) return found;
    }
    return THEMES[3]; // One Dark Pro
  });

  const [files, setFiles] = useState<FileNode[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('file-main');

  const [openTabs, setOpenTabs] = useState<TabItem[]>([
    {
      fileId: 'file-main',
      name: 'main.py',
      path: 'main.py',
      isModified: false,
    },
  ]);

  // Console state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    {
      id: 'init-msg-1',
      type: 'system',
      text: 'IDE Python initialisé • Python 3.12 (CPython sandbox) [x64 linux]',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
    {
      id: 'init-msg-2',
      type: 'info',
      text: 'Guides d\'indentation verticaux actifs (PEP 8, 4 espaces). Auto-complétion via les flèches + Entrée.',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
  ]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Mobile view switcher (phones only < md)
  const [mobileView, setMobileView] = useState<'editor' | 'terminal' | 'problems'>('editor');

  // Sidebar & Navigation collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals & Navigation state
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);

  // Save selected theme
  const handleSelectTheme = (theme: PythonTheme) => {
    setActiveTheme(theme);
    localStorage.setItem('python_studio_theme', theme.id);
  };

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

  const activeCode = activeFileNode?.content ?? '';

  // Real-time live linter for Python
  const diagnostics: PythonDiagnostic[] = useMemo(() => {
    if (!activeFileNode?.name.endsWith('.py')) return [];
    return lintPythonCode(activeCode);
  }, [activeCode, activeFileNode?.name]);

  // Update file content
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

    // Mark tab as modified
    setOpenTabs((prev) =>
      prev.map((t) => (t.fileId === activeFileId ? { ...t, isModified: true } : t))
    );
  };

  // Open / Select File
  const handleSelectFile = (file: FileNode) => {
    if (file.isFolder) return;
    setActiveFileId(file.id);

    // If tab is not open, open it
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

  // Close Tab
  const handleCloseTab = (fileId: string) => {
    const newTabs = openTabs.filter((t) => t.fileId !== fileId);
    setOpenTabs(newTabs);

    if (activeFileId === fileId) {
      if (newTabs.length > 0) {
        setActiveFileId(newTabs[newTabs.length - 1].fileId);
      } else {
        setActiveFileId('');
      }
    }
  };

  // Jump from Diagnostics to specific line in editor
  const handleSelectProblem = (diag: PythonDiagnostic) => {
    setJumpToLine(diag.line);
    // Switch to editor on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileView('editor');
    }
  };

  // Dump detailed explanations of errors into terminal console
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
        text: `⚠️ Rapport d'Analyse Statique Python : ${diagnostics.length} anomalie(s) détectée(s) dans ${activeFileNode?.name || 'le fichier'} :`,
        timestamp: timeStr,
      },
    ];

    diagnostics.forEach((d, idx) => {
      const block = [
        `\n[Erreur #${idx + 1}] Ligne ${d.line}, Colonne ${d.column} : ${d.message}`,
        `❓ Pourquoi c'est une erreur :\n   ${d.whyExplanation}`,
        `💡 Comment la réparer :\n   ${d.howToFix}`,
        d.suggestedCodeSnippet ? `Exemple suggéré :\n   ${d.suggestedCodeSnippet}` : '',
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

    newLogs.push({
      id: `diag-end-${Date.now()}`,
      type: 'info',
      text: `💡 En appliquant ces corrections, vous évitez les erreurs de syntaxe à l'exécution.`,
      timestamp: timeStr,
    });

    setConsoleMessages((prev) => [...prev, ...newLogs]);
  }, [diagnostics, activeFileNode]);

  // Run Python Code: checks for compile errors first to prevent failures!
  const handleRunCode = async () => {
    if (!activeFileNode) return;

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
    const result = await runPythonCode(activeCode, activeFileNode.name);
    setConsoleMessages((prev) => [...prev, ...result.messages]);
    setIsRunning(false);
  };

  // Format Python Code (PEP 8, 4 spaces)
  const handleFormatCode = () => {
    if (!activeFileNode) return;
    const formatted = formatPythonCode(activeCode);
    handleCodeChange(formatted);
    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `fmt-${Date.now()}`,
        type: 'info',
        text: `Code formaté selon les conventions officielles PEP 8 (4 espaces).`,
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
        text: `python>>> ${command}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);

    let executable = command;
    // Auto wrap bare expressions in print() for immediate REPL output
    if (
      !command.includes('print(') &&
      !command.startsWith('def ') &&
      !command.startsWith('class ') &&
      !command.includes('=') &&
      !command.startsWith('for ') &&
      !command.startsWith('if ')
    ) {
      executable = `print(${command})`;
    }

    const result = await runPythonCode(executable, 'repl.py');
    setConsoleMessages((prev) => [...prev, ...result.messages.filter((m) => m.type !== 'system')]);
  };

  // Delete File
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

  // Create New File or Folder
  const handleCreateFile = (name: string, isFolder: boolean, parentPath: string) => {
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    const newNode: FileNode = {
      id: `file-${Date.now()}`,
      name,
      path: newPath,
      isFolder,
      content: isFolder ? undefined : `# Nouveau fichier ${name}\n`,
      children: isFolder ? [] : undefined,
      isOpen: true,
    };

    if (!parentPath) {
      setFiles((prev) => [...prev, newNode]);
    } else {
      const insertRecursive = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((n) => {
          if (n.path === parentPath && n.isFolder) {
            return {
              ...n,
              children: [...(n.children || []), newNode],
            };
          }
          if (n.children) {
            return { ...n, children: insertRecursive(n.children) };
          }
          return n;
        });
      };
      setFiles((prev) => insertRecursive(prev));
    }

    if (!isFolder) {
      handleSelectFile(newNode);
    }
  };

  // Load Python Templates
  const handleLoadTemplate = (templateName: string) => {
    let targetCode = '';
    let targetFileName = '';

    if (templateName === 'cli') {
      targetFileName = 'cli_example.py';
      targetCode = `# Démonstration Python CLI & Traitement de Données
def main():
    print("=== Analyse de Données & Statistiques Python ===")
    
    numbers = [84, 12, 45, 9, 32, 77, 2, 56]
    print(f"Collection initiale : {numbers}")
    
    # Tri en place
    sorted_nums = sorted(numbers)
    print(f"Collection triée : {sorted_nums}")

    # Filtrage par compréhension de liste
    evens = [n for n in numbers if n % 2 == 0]
    print(f"Nombres pairs : {evens}")

    # Calculs statistiques built-ins
    total = sum(numbers)
    moyenne = total / len(numbers)
    print(f"Somme cumulée : {total}")
    print(f"Moyenne : {moyenne:.2f}")

if __name__ == "__main__":
    main()
`;
    } else if (templateName === 'async') {
      targetFileName = 'async_example.py';
      targetCode = `# Démonstration Asynchrone & Coroutines Python
import time

async def countdown(seconds: int):
    print(f"Démarrage du compte à rebours ({seconds}s)...")
    for i in range(seconds, 0, -1):
        print(f"Tic-tac : {i}...")
        await time.sleep(0.3)
    print("✓ Compte à rebours terminé !")

async def main():
    print("=== Démarrage des Coroutines Asynchrones ===")
    await countdown(4)

if __name__ == "__main__":
    main()
`;
    } else if (templateName === 'oop') {
      targetFileName = 'oop_example.py';
      targetCode = `# Programmation Orientée Objet & Héritage en Python
class Person:
    def __init__(self, name: str):
        self.name = name

    def describe(self) -> str:
        return f"Personne : {self.name}"

class Employee(Person):
    def __init__(self, emp_id: str, name: str, role: str, base_salary: float):
        super().__init__(name)
        self.emp_id = emp_id
        self.role = role
        self.base_salary = base_salary

    def describe(self) -> str:
        return f"[{self.emp_id}] {self.name} — {self.role}"

    def calculate_bonus(self, rate: float = 0.15) -> float:
        return round(self.base_salary * rate, 2)

def main():
    print("=== Hiérarchie de Classes Python ===")
    dev = Employee("EMP-01", "Sophie", "Python Architect", 72000.0)
    print(dev.describe())
    
    bonus = dev.calculate_bonus()
    print(f"Prime annuelle estimée : {bonus} €")

if __name__ == "__main__":
    main()
`;
    } else if (templateName === 'collections') {
      targetFileName = 'collections_example.py';
      targetCode = `# Manipulation de Collections, Dictionnaires et Ensembles en Python
def main():
    fruits = ["Pomme", "Banane", "Mangue", "Orange", "Pomme"]
    print(f"Liste fruits : {fruits}")

    # Élimination des doublons avec set
    unique_fruits = set(fruits)
    print(f"Ensemble unique : {unique_fruits}")

    # Compréhension de dictionnaire {fruit: longueur}
    lengths = {f: len(f) for f in unique_fruits}
    print(f"Dictionnaire longueurs : {lengths}")

    # Dictionnaire itération
    for fruit, length in lengths.items():
        print(f" - {fruit} mesure {length} lettres")

if __name__ == "__main__":
    main()
`;
    }

    if (!targetCode) return;

    // Add file or select if already exists
    const existing = files.find((f) => f.name === targetFileName);
    if (existing) {
      handleCodeChange(targetCode);
      handleSelectFile(existing);
    } else {
      const newFileNode: FileNode = {
        id: `template-${Date.now()}`,
        name: targetFileName,
        path: targetFileName,
        isFolder: false,
        content: targetCode,
      };
      setFiles((prev) => [...prev, newFileNode]);
      handleSelectFile(newFileNode);
    }

    setConsoleMessages((prev) => [
      ...prev,
      {
        id: `tmpl-${Date.now()}`,
        type: 'info',
        text: `Modèle Python chargé : ${targetFileName}`,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      },
    ]);
  };

  // Collect folder paths for New File Dialog
  const existingFolders = useMemo(() => {
    const folders: string[] = [];
    const scan = (nodes: FileNode[]) => {
      for (const n of nodes) {
        if (n.isFolder) {
          folders.push(n.path);
          if (n.children) scan(n.children);
        }
      }
    };
    scan(files);
    return folders;
  }, [files]);

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden select-none font-sans"
      style={{
        backgroundColor: activeTheme.colors.appBg,
        color: activeTheme.colors.textPrimary,
      }}
    >
      {/* 1. Top Header Bar */}
      <Header
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onRunCode={handleRunCode}
        isRunning={isRunning}
        onFormatCode={handleFormatCode}
        diagnostics={diagnostics}
        onOpenDiagnostics={handleDumpErrorExplanations}
        activeFilePath={activeFileNode?.path}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Workspace (Sidebar + Editor + Console) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar / Explorer (with collapse support) */}
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onDeleteFile={handleDeleteFile}
          onOpenNewFileDialog={() => setNewFileDialogOpen(true)}
          onLoadTemplate={handleLoadTemplate}
          activeTheme={activeTheme}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Central Code Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab Bar */}
          <TabBar
            tabs={openTabs}
            activeFileId={activeFileId}
            onSelectTab={(id) => setActiveFileId(id)}
            onCloseTab={handleCloseTab}
            activeTheme={activeTheme}
          />

          {/* Desktop/Tablet Split: Editor + Console stacked */}
          {/* Mobile View: Switches between Editor and Console */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Editor Container */}
            <div
              className={`flex-1 flex flex-col overflow-hidden min-h-0 ${
                mobileView === 'editor' ? 'flex' : 'hidden md:flex'
              }`}
            >
              {activeFileNode ? (
                <CodeEditor
                  code={activeCode}
                  onChange={handleCodeChange}
                  activeTheme={activeTheme}
                  diagnostics={diagnostics}
                  jumpToLine={jumpToLine}
                  onJumpComplete={() => setJumpToLine(null)}
                />
              ) : (
                <div
                  className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  style={{ backgroundColor: activeTheme.colors.editorBg }}
                >
                  <p className="text-sm opacity-60 mb-3">Aucun fichier sélectionné.</p>
                  <button
                    onClick={() => handleLoadTemplate('cli')}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: activeTheme.colors.accent,
                      color: activeTheme.colors.accentText,
                    }}
                  >
                    Ouvrir un modèle Python
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Terminal Console (Collapsible & Resizable) */}
            <div
              className={`shrink-0 overflow-hidden ${
                mobileView === 'terminal' || mobileView === 'problems'
                  ? 'flex-1 flex flex-col'
                  : 'hidden md:flex flex-col'
              }`}
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

      {/* 3. Mobile View Switcher Bottom Bar (Only on smartphones < md) */}
      <nav
        aria-label="Navigation mobile"
        className="md:hidden shrink-0 border-t flex items-center justify-around py-2 px-3 z-30 shadow-lg select-none"
        style={{
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
        }}
      >
        <button
          onClick={() => setMobileView('editor')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            mobileView === 'editor' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color: mobileView === 'editor' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <FileCode className="w-4 h-4" />
          <span>Éditeur</span>
        </button>

        <button
          onClick={() => setMobileView('terminal')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            mobileView === 'terminal' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color: mobileView === 'terminal' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <Terminal className="w-4 h-4" />
          <span>Console</span>
        </button>

        <button
          onClick={() => setMobileView('problems')}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors relative ${
            mobileView === 'problems' ? 'font-bold' : 'opacity-70'
          }`}
          style={{
            color: mobileView === 'problems' ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-transform active:scale-95 disabled:opacity-50"
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

      {/* Theme Picker Modal */}
      <ThemeModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        activeTheme={activeTheme}
        onSelectTheme={(t) => {
          handleSelectTheme(t);
          setThemeModalOpen(false);
        }}
      />

      {/* New File Dialog */}
      <NewFileDialog
        isOpen={newFileDialogOpen}
        onClose={() => setNewFileDialogOpen(false)}
        onCreate={handleCreateFile}
        activeTheme={activeTheme}
        folders={existingFolders}
      />

      {/* Offline Toast Indicator */}
      <OfflineIndicator />
    </div>
  );
}
