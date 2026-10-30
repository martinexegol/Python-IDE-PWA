import React, { useState } from 'react';
import { FileNode, PythonTheme } from '../types';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  RotateCcw,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (file: FileNode) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenNewFileDialog: () => void;
  onResetWorkspace?: () => void;
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
  onResetWorkspace,
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
              <div className="flex flex-col">
                {renderFileTree(node.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }

      // Check if matches search
      if (
        searchTerm &&
        !node.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return null;
      }

      const isActive = activeFileId === node.id;
      const isRust = node.name.endsWith('.rs');
      const isC = node.name.endsWith('.c') || node.name.endsWith('.h');

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
            {isRust ? (
              <FileCode
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: '#CE412B' }}
              />
            ) : isC ? (
              <FileCode
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: '#00599C' }}
              />
            ) : (
              <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {!node.readOnly && files.length > 1 && (
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
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2 cursor-pointer"
          title="Déplier l'explorateur de fichiers"
        >
          <PanelLeftOpen className="w-4 h-4" style={{ color: activeTheme.colors.accent }} />
        </button>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2 cursor-pointer"
          title="Ouvrir les fichiers du projet"
        >
          <Folder className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={onOpenNewFileDialog}
          className="p-2 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-2 cursor-pointer"
          title="Nouveau fichier (C / Rust)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="mt-auto mb-2 flex flex-col items-center gap-2">
          <PWAInstallButton activeTheme={activeTheme} compact={true} />
        </div>
      </aside>
    );
  }

  const renderSidebarBody = (isMobileDrawer: boolean = false) => (
    <>
      {/* Explorer Header with Collapse Toggle & Reset */}
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
            className="p-1 rounded hover:opacity-75 transition-opacity cursor-pointer"
            title="Nouveau fichier ou dossier"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onResetWorkspace && (
            <button
              onClick={() => {
                if (confirm('Vider l\'éditeur et démarrer un nouveau projet vierge ?')) {
                  onResetWorkspace();
                }
              }}
              className="p-1 rounded hover:opacity-75 transition-opacity cursor-pointer text-amber-400"
              title="Réinitialiser l'espace de travail (projet vierge)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:opacity-75 transition-opacity cursor-pointer"
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

      {/* Workspace Header */}
      <div className="px-3 py-1.5 font-semibold text-[11px] opacity-60 uppercase tracking-wider flex items-center justify-between">
        <span>workspace (c & rust)</span>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1 space-y-0.5">
        {renderFileTree(files)}
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
