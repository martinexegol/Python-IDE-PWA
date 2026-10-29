import { FileNode } from './types';

export const DEFAULT_FILES: FileNode[] = [
  {
    id: 'file-main',
    name: 'main.py',
    path: 'main.py',
    isFolder: false,
    content: '',
  },
  {
    id: 'file-requirements',
    name: 'requirements.txt',
    path: 'requirements.txt',
    isFolder: false,
    content: '',
  },
];
