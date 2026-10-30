/**
 * Rust Language Static Analyzer & rustc Compiler Diagnostic Linter.
 */

import { PythonDiagnostic } from '../types';

export function lintRustCode(code: string): PythonDiagnostic[] {
  const diagnostics: PythonDiagnostic[] = [];
  const lines = code.split('\n');

  // 1. Bracket & Parentheses Matching
  const stack: { char: string; line: number; col: number }[] = [];
  const matching: Record<string, string> = { ')': '(', '}': '{', ']': '[' };
  let inBlockComment = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const trimmed = line.trim();

    let i = 0;
    while (i < line.length) {
      if (inBlockComment) {
        const end = line.indexOf('*/', i);
        if (end === -1) {
          break;
        } else {
          inBlockComment = false;
          i = end + 2;
          continue;
        }
      }

      if (line[i] === '/' && line[i + 1] === '/') {
        break;
      }

      if (line[i] === '/' && line[i + 1] === '*') {
        inBlockComment = true;
        i += 2;
        continue;
      }

      // Skip strings
      if (line[i] === '"') {
        i++;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line[i] === '"') {
            i++;
            break;
          }
          i++;
        }
        continue;
      }

      const ch = line[i];
      if (ch === '(' || ch === '{' || ch === '[') {
        stack.push({ char: ch, line: lineNum, col: i + 1 });
      } else if (ch === ')' || ch === '}' || ch === ']') {
        if (stack.length === 0) {
          diagnostics.push({
            id: `rust-unmatched-closing-${lineNum}-${i}`,
            line: lineNum,
            column: i + 1,
            length: 1,
            severity: 'error',
            message: `error: unexpected closing delimiter: '${ch}'`,
            code: 'E0609',
            whyExplanation: `En Rust, chaque séparateur ouvrant '(' ou '{' doit correspondre exactement à son caractère de fermeture.`,
            howToFix: `Supprimez le '${ch}' en trop ou ouvrez le bloc correspondant en amont.`,
            suggestedCodeSnippet: ch === '}' ? `{\n    // block\n}` : `()`,
          });
        } else {
          const top = stack.pop()!;
          if (top.char !== matching[ch]) {
            diagnostics.push({
              id: `rust-mismatched-${lineNum}-${i}`,
              line: lineNum,
              column: i + 1,
              length: 1,
              severity: 'error',
              message: `error: mismatched closing delimiter: '${ch}', expected '${matching[ch] === '(' ? ')' : matching[ch] === '{' ? '}' : ']'}'`,
              code: 'E0308',
              whyExplanation: `Vous avez ouvert un groupe avec '${top.char}' (ligne ${top.line}) mais tentez de le fermer avec '${ch}'.`,
              howToFix: `Remplacez '${ch}' par le délimiteur attendu.`,
            });
          }
        }
      }
      i++;
    }

    // 2. Missing semicolon check on let declarations or assignments
    if (
      trimmed.startsWith('let ') ||
      trimmed.startsWith('let mut ') ||
      trimmed.startsWith('use ') ||
      trimmed.startsWith('return ')
    ) {
      if (
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.endsWith(',')
      ) {
        diagnostics.push({
          id: `rust-missing-semi-${lineNum}`,
          line: lineNum,
          column: line.length + 1,
          length: 1,
          severity: 'error',
          message: `error: expected ';', found end of line`,
          code: 'E0001',
          whyExplanation: `En Rust, les déclarations de variables 'let', les directives 'use' et les instructions de contrôle se terminent obligatoirement par un point-virgule ';'.`,
          howToFix: `Ajoutez un ';' à la fin de cette ligne.`,
          suggestedCodeSnippet: `${trimmed};`,
        });
      }
    }
  }

  // 3. Unclosed brackets
  while (stack.length > 0) {
    const unclosed = stack.pop()!;
    diagnostics.push({
      id: `rust-unclosed-${unclosed.line}-${unclosed.col}`,
      line: unclosed.line,
      column: unclosed.col,
      length: 1,
      severity: 'error',
      message: `error: unclosed delimiter '${unclosed.char}'`,
      code: 'E0002',
      whyExplanation: `Le symbole ouvrant '${unclosed.char}' à la ligne ${unclosed.line} n'est jamais refermé dans le fichier Rust.`,
      howToFix: `Ajoutez le caractère fermant correspondant '${unclosed.char === '(' ? ')' : unclosed.char === '{' ? '}' : ']'}' à la fin du bloc.`,
    });
  }

  // 4. Missing fn main()
  const fullCode = code.trim();
  if (fullCode.length > 20 && !fullCode.includes('fn main')) {
    diagnostics.push({
      id: 'rust-missing-main',
      line: lines.length,
      column: 1,
      length: 1,
      severity: 'warning',
      message: `warning: \`main\` function not found in crate \`main\``,
      code: 'E0601',
      whyExplanation: `En Rust, le point d'entrée exécutable standard d'un binaire est la fonction 'fn main() { ... }'.`,
      howToFix: `Définissez la fonction principale 'fn main()'.`,
      suggestedCodeSnippet: `fn main() {\n    \n}`,
    });
  }

  return diagnostics;
}

/**
 * Format Rust source code (4 spaces indentation).
 */
export function formatRustCode(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      formatted.push('');
      continue;
    }

    if (trimmed.startsWith('#[')) {
      formatted.push('    '.repeat(indentLevel) + trimmed);
      continue;
    }

    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted.push('    '.repeat(indentLevel) + trimmed);

    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    const net = opens - closes;

    if (!trimmed.startsWith('}') && net > 0) {
      indentLevel += net;
    } else if (trimmed.startsWith('}') && net > -1) {
      indentLevel += (opens - (closes - 1));
    }
  }

  return formatted.join('\n');
}
