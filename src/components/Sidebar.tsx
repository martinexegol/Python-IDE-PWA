import React, { useState } from 'react';
import { FileNode, PythonTheme } from '../types';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Trash2,
  Search,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (file: FileNode) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenNewFileDialog: () => void;
  onLoadTemplate: (templateName: string) => void;
  activeTheme: PythonTheme;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onDeleteFile,
  onOpenNewFileDialog,
  onLoadTemplate,
  activeTheme,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const renderFileTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => {
      if (node.isFolder) {
        const isOpen = openFolders[node.id] ?? true;
        return (
          <div key={node.id} className="select-none">
            <div
              onClick={() => toggleFolder(node.id)}
              className="flex items-center gap-1.5 py-1 px-2 rounded-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors group"
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="font-medium truncate">{node.name}</span>
            </div>

            {isOpen && node.children && (
              <div>{renderFileTree(node.children, depth + 1)}</div>
            )}
          </div>
        );
      }

      // It's a file
      if (
        searchTerm &&
        !node.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return null;
      }

      const isActive = activeFileId === node.id;
      const isPython = node.name.endsWith('.py');

      return (
        <div
          key={node.id}
          onClick={() => {
            onSelectFile(node);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              onToggleCollapse();
            }
          }}
          className={`flex items-center justify-between py-1 px-2 rounded-sm cursor-pointer text-xs transition-colors group ${
            isActive ? 'font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85 hover:opacity-100'
          }`}
          style={{
            paddingLeft: `${depth * 14 + 16}px`,
            backgroundColor: isActive ? activeTheme.colors.sidebarActiveBg : 'transparent',
            color: isActive ? activeTheme.colors.accent : activeTheme.colors.textPrimary,
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isPython ? (
              <FileCode
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: activeTheme.colors.accent }}
              />
            ) : (
              <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {!node.readOnly && node.path !== 'main.py' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Supprimer le fichier "${node.name}" ?`)) {
                  onDeleteFile(node.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
              title="Supprimer le fichier"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      );
    });
  };

  // Render Slim Icon Rail when collapsed
  if (isCollapsed) {
    return (
      <aside
        className="hidden md:flex w-11 border-r flex-col items-center py-2 select-none text-xs shrink-0 h-full transition-all duration-200"
        style={{
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2"
          title="Déplier l'explorateur de fichiers"
        >
          <PanelLeftOpen className="w-4 h-4" style={{ color: activeTheme.colors.accent }} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2"
          title="Ouvrir les fichiers du projet"
        >
          <Folder className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onOpenNewFileDialog}
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2"
          title="Nouveau fichier Python"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="mt-auto mb-2 flex flex-col items-center gap-2">
          <PWAInstallButton activeTheme={activeTheme} compact={true} />
          <button
            onClick={() => {
              onToggleCollapse();
            }}
            className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            title="Modèles de code Python"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </aside>
    );
  }

  const renderSidebarBody = (isMobileDrawer: boolean = false) => (
    <>
      {/* Explorer Header with Collapse Toggle */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b uppercase font-bold tracking-wider text-[11px] opacity-75"
        style={{ borderColor: activeTheme.colors.border }}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" style={{ color: activeTheme.colors.accent }} />
          <span>Explorateur</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewFileDialog}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            title="Nouveau fichier ou dossier Python"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:opacity-75 transition-opacity"
            title={isMobileDrawer ? "Fermer l'explorateur" : "Réduire l'explorateur de fichiers"}
          >
            {isMobileDrawer ? <X className="w-4 h-4" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b" style={{ borderColor: activeTheme.colors.border }}>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded border"
          style={{
            backgroundColor: activeTheme.colors.editorBg,
            borderColor: activeTheme.colors.border,
          }}
        >
          <Search className="w-3 h-3 opacity-50 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrer les fichiers..."
            className="w-full bg-transparent outline-none text-[11px]"
            style={{ color: activeTheme.colors.textPrimary }}
          />
        </div>
      </div>

      {/* Project Root Label */}
      <div className="px-3 py-1.5 font-semibold text-[11px] opacity-60 uppercase tracking-wider flex items-center gap-1">
        <span>python_project</span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
        {renderFileTree(files)}
      </div>

      {/* Python Quick Templates Footer */}
      <div
        className="p-3 border-t space-y-2"
        style={{ borderColor: activeTheme.colors.border }}
      >
        <div className="flex items-center gap-1 font-semibold text-[11px] opacity-75">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Modèles de Code Python</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              onLoadTemplate('cli');
              if (isMobileDrawer) onToggleCollapse();
            }}
            className="px-2 py-1 text-left rounded border hover:opacity-80 transition-opacity truncate"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
            }}
            title="Charger l'exemple Python Données & List Comprehension"
          >
            Python CLI
          </button>
          <button
            onClick={() => {
              onLoadTemplate('async');
              if (isMobileDrawer) onToggleCollapse();
            }}
            className="px-2 py-1 text-left rounded border hover:opacity-80 transition-opacity truncate"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
            }}
            title="Charger l'exemple Python Asynchrone & Coroutines"
          >
            Async Coroutines
          </button>
          <button
            onClick={() => {
              onLoadTemplate('oop');
              if (isMobileDrawer) onToggleCollapse();
            }}
            className="px-2 py-1 text-left rounded border hover:opacity-80 transition-opacity truncate"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
            }}
            title="Charger l'exemple Python Programmation Orientée Objet"
          >
            Python POO
          </button>
          <button
            onClick={() => {
              onLoadTemplate('collections');
              if (isMobileDrawer) onToggleCollapse();
            }}
            className="px-2 py-1 text-left rounded border hover:opacity-80 transition-opacity truncate"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
            }}
            title="Charger l'exemple de manipulation de collections"
          >
            Collections
          </button>
        </div>
      </div>

      {/* PWA App Installation Shortcut */}
      <div className="p-2.5 border-t mt-auto" style={{ borderColor: activeTheme.colors.border }}>
        <div className="flex items-center justify-between mb-1.5 opacity-75">
          <span className="font-semibold text-[10px] uppercase tracking-wider">Application</span>
          <span className="text-[10px]">PWA</span>
        </div>
        <PWAInstallButton activeTheme={activeTheme} compact={false} />
      </div>
    </>
  );

  // Render Full Expanded Sidebar (Desktop inline + Mobile overlay drawer)
  return (
    <>
      {/* Desktop/Tablet inline sidebar */}
      <aside
        className="hidden md:flex w-64 border-r flex-col select-none text-xs shrink-0 h-full transition-all duration-200"
        style={{
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile Drawer (phones only < md) */}
      <div className="fixed inset-0 z-50 md:hidden flex">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={onToggleCollapse}
        />
        <aside
          className="relative w-72 max-w-[85vw] h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 border-r"
          style={{
            backgroundColor: activeTheme.colors.sidebarBg,
            borderColor: activeTheme.colors.border,
            color: activeTheme.colors.textPrimary,
          }}
        >
          {renderSidebarBody(true)}
        </aside>
      </div>
    </>
  );
};
