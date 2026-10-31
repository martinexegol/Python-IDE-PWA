/**
 * Indentation & Vertical Indent Guides Calculation.
 * Standard 4-space indentation for C.
 */

export interface LineIndentInfo {
  lineNumber: number;
  rawIndentSpaces: number;
  indentGuidesCount: number;
  isWhitespaceOnly: boolean;
}

export function calculateIndentGuides(lines: string[]): LineIndentInfo[] {
  const result: LineIndentInfo[] = [];
  const indentLevels: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)/);
    const leadingSpaces = match ? match[1].length : 0;
    const isWhitespaceOnly = leadingSpaces === line.length;

    const level = Math.floor(leadingSpaces / 4);
    indentLevels.push(isWhitespaceOnly ? -1 : level);
  }

  for (let i = 0; i < lines.length; i++) {
    if (indentLevels[i] === -1) {
      let prevLevel = 0;
      for (let p = i - 1; p >= 0; p--) {
        if (indentLevels[p] !== -1) {
          prevLevel = indentLevels[p];
          break;
        }
      }
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)/);
    const leadingSpaces = match ? match[1].length : 0;
    const isWhitespaceOnly = leadingSpaces === line.length;
    const level = indentLevels[i] >= 0 ? indentLevels[i] : Math.floor(leadingSpaces / 4);

    result.push({
      lineNumber: i + 1,
      rawIndentSpaces: leadingSpaces,
      indentGuidesCount: level,
      isWhitespaceOnly,
    });
  }

  return result;
}

export function getActiveIndentGuideLevel(lines: string[], cursorLine: number): number {
  if (cursorLine < 1 || cursorLine > lines.length) return 0;
  const line = lines[cursorLine - 1];
  const match = line.match(/^(\s*)/);
  const leadingSpaces = match ? match[1].length : 0;
  return Math.floor(leadingSpaces / 4);
}
