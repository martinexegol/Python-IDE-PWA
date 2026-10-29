/**
 * Python Indentation & Vertical Indent Guides Architecture.
 * Standard PEP 8 indentation (4 spaces per indent level).
 * Calculates continuous vertical indent guides connecting indented blocks,
 * and identifies the active indent block based on cursor position.
 */

export interface LineIndentInfo {
  lineNumber: number; // 1-indexed
  rawIndentSpaces: number;
  indentGuidesCount: number; // Number of vertical guides to render on this line
  isWhitespaceOnly: boolean;
}

/**
 * Calculates indent guide data for each line of Python code (4 spaces = 1 indent).
 * Empty lines inherit enclosing block indentation for smooth continuous lines.
 */
export function calculateIndentGuides(lines: string[]): LineIndentInfo[] {
  const result: LineIndentInfo[] = [];
  const indentLevels: number[] = [];

  // Pass 1: calculate direct indents for non-empty lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)/);
    const leadingSpaces = match ? match[1].length : 0;
    const isWhitespaceOnly = leadingSpaces === line.length;

    // Python PEP 8 standard: 4 spaces = 1 indent level
    const level = Math.floor(leadingSpaces / 4);
    indentLevels.push(isWhitespaceOnly ? -1 : level);
  }

  // Pass 2: interpolate empty lines between preceding and succeeding non-empty lines
  for (let i = 0; i < lines.length; i++) {
    if (indentLevels[i] === -1) {
      // Find previous non-empty line
      let prevLevel = 0;
      for (let p = i - 1; p >= 0; p--) {
        if (indentLevels[p] !== -1) {
          prevLevel = indentLevels[p];
          break;
        }
      }
      // Find next non-empty line
      let nextLevel = 0;
      for (let n = i + 1; n < lines.length; n++) {
        if (indentLevels[n] !== -1) {
          nextLevel = indentLevels[n];
          break;
        }
      }
      indentLevels[i] = Math.max(0, Math.min(prevLevel, nextLevel));
    }
  }

  // Pass 3: compile line indent records
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isWhitespaceOnly = line.trim().length === 0;
    const guidesCount = Math.max(0, indentLevels[i]);

    result.push({
      lineNumber: i + 1,
      rawIndentSpaces: indentLevels[i] * 4,
      indentGuidesCount: guidesCount,
      isWhitespaceOnly,
    });
  }

  return result;
}

/**
 * Determines which indent guide column (0, 1, 2, ...) is active based on cursor line.
 */
export function getActiveIndentGuideLevel(lines: string[], cursorLine: number): number {
  if (cursorLine < 1 || cursorLine > lines.length) return -1;
  const line = lines[cursorLine - 1];
  const match = line.match(/^(\s*)/);
  const leadingSpaces = match ? match[1].length : 0;
  const currentLevel = Math.floor(leadingSpaces / 4);

  // If current line ends with ':' or contains open bracket, active block is this level
  if (line.trim().endsWith(':') || line.includes('(') || line.includes('[') || line.includes('{')) {
    return currentLevel;
  }
  return Math.max(0, currentLevel - 1);
}

/**
 * Python code formatter conforming to PEP 8 standard (4 spaces).
 * Handles colon-based block indentation, cleans trailing spaces,
 * and maintains consistent block structures.
 */
export function formatPythonCode(code: string): string {
  const lines = code.split('\n');
  const formattedLines: string[] = [];
  let indentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Preserve empty lines
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Dedent on block continuations: elif, else, except, finally, case
    if (/^(elif\b|else\s*:|except\b|finally\s*:|case\b)/.test(trimmed)) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    // Indent current line
    const indent = '    '.repeat(indentLevel);
    formattedLines.push(`${indent}${trimmed}`);

    // If current line ends with ':' (and is not a comment), next line indents
    if (trimmed.endsWith(':') && !trimmed.startsWith('#')) {
      indentLevel++;
    }
  }

  return formattedLines.join('\n');
}
