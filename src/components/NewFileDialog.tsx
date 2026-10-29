import React, { useState } from 'react';
import { PythonTheme } from '../types';
import { FileCode2, FolderPlus, X } from 'lucide-react';

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, isFolder: boolean, parentPath: string) => void;
  activeTheme: PythonTheme;
  folders: string[];
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  activeTheme,
  folders,
}) => {
  const [name, setName] = useState('');
  const [isFolder, setIsFolder] = useState(false);
  const [parentPath, setParentPath] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setError('Veuillez entrer un nom valide.');
      return;
    }

    if (!isFolder && !clean.endsWith('.py') && !clean.endsWith('.txt') && !clean.endsWith('.json')) {
      setError('Les scripts Python doivent avoir l\'extension .py');
      return;
    }

    onCreate(clean, isFolder, parentPath);
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-xl p-6 border shadow-2xl space-y-4"
        style={{
          backgroundColor: activeTheme.colors.sidebarBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: activeTheme.colors.border }}>
          <div className="flex items-center gap-2">
            {isFolder ? <FolderPlus className="w-5 h-5 text-amber-400" /> : <FileCode2 className="w-5 h-5" style={{ color: activeTheme.colors.accent }} />}
            <h3 className="font-bold text-base">
              {isFolder ? 'Nouveau dossier' : 'Nouveau fichier Python'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={!isFolder}
                onChange={() => setIsFolder(false)}
                className="accent-cyan-500"
              />
              <span>Fichier Python (.py)</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="radio"
                name="type"
                checked={isFolder}
                onChange={() => setIsFolder(true)}
                className="accent-cyan-500"
              />
              <span>Dossier</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              Emplacement :
            </label>
            <select
              value={parentPath}
              onChange={(e) => setParentPath(e.target.value)}
              className="w-full text-xs p-2 rounded border outline-none font-mono"
              style={{
                backgroundColor: activeTheme.colors.editorBg,
                borderColor: activeTheme.colors.border,
                color: activeTheme.colors.textPrimary,
              }}
            >
              <option value="">Racine du projet (/)</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  /{f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 opacity-80">
              {isFolder ? 'Nom du dossier :' : 'Nom du fichier (ex: utils.py) :'}
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder={isFolder ? 'utils' : 'helper.py'}
              className="w-full text-xs p-2 rounded border outline-none font-mono"
              style={{
                backgroundColor: activeTheme.colors.editorBg,
                borderColor: activeTheme.colors.border,
                color: activeTheme.colors.textPrimary,
              }}
            />
          </div>

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs border"
              style={{ borderColor: activeTheme.colors.border }}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: activeTheme.colors.accent,
                color: activeTheme.colors.accentText,
              }}
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
