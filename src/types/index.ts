/**
 * Types and interfaces for IDE Python
 */

export type ThemeCategory = 'high-contrast' | 'dark' | 'light';

export interface PythonTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  isHighContrast: boolean;
  description: string;
  colors: {
    // UI Layout
    appBg: string;
    sidebarBg: string;
    sidebarActiveBg: string;
    headerBg: string;
    tabBarBg: string;
    tabActiveBg: string;
    tabInactiveBg: string;
    tabBorder: string;
    statusBarBg: string;
    consoleBg: string;
    border: string;
    accent: string;
    accentHover: string;
    accentText: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Editor Area
    editorBg: string;
    editorGutterBg: string;
    editorLineNumber: string;
    editorLineNumberActive: string;
    activeLineBg: string;
    selectionBg: string;
    cursorColor: string;
    indentGuide: string;
    indentGuideActive: string;
    bracketMatchBg: string;
    bracketMatchBorder: string;

    // Syntax Tokens for Python
    syntaxDefault: string;
    syntaxKeyword: string;
    syntaxType: string;
    syntaxString: string;
    syntaxInterpolation: string; // Python f-string expressions {var}
    syntaxNumber: string;
    syntaxComment: string;
    syntaxFunction: string;
    syntaxVariable: string;
    syntaxAnnotation: string; // @decorator
    syntaxOperator: string;
    syntaxConstant: string;
    syntaxDocComment: string;

    // Diagnostics / Errors
    errorSquiggle: string;
    errorText: string;
    warningSquiggle: string;
    warningText: string;
    infoText: string;
  };
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  content?: string;
  children?: FileNode[];
  isOpen?: boolean;
  readOnly?: boolean;
}

export interface TabItem {
  fileId: string;
  name: string;
  path: string;
  isModified?: boolean;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface PythonDiagnostic {
  id: string;
  line: number; // 1-indexed
  column: number; // 1-indexed
  length: number;
  message: string;
  severity: DiagnosticSeverity;
  code?: string;
  source?: string;
  whyExplanation: string; // Pourquoi c'est une erreur de syntaxe ou d'exécution
  howToFix: string; // Comment réparer l'erreur
  suggestedCodeSnippet?: string; // Exemple de syntaxe correcte
}

export type CompletionKind =
  | 'keyword'
  | 'type'
  | 'function'
  | 'method'
  | 'property'
  | 'snippet'
  | 'variable'
  | 'annotation';

export interface CompletionItem {
  id: string;
  label: string;
  kind: CompletionKind;
  detail: string;
  documentation?: string;
  insertText: string;
  cursorOffsetAfterInsert?: number;
}

export interface ConsoleMessage {
  id: string;
  type: 'stdout' | 'stderr' | 'info' | 'system';
  text: string;
  timestamp: string;
}

export type EditorTheme = PythonTheme;

