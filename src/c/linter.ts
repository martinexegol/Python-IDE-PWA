/**
 * C Language (C99/C11) Live Static Analyzer & Compiler Diagnostics.
 * Detects common syntax mistakes in C, missing semicolons, unmatched braces,
 * missing includes, and invalid main signatures with concrete fix suggestions.
 */

import { PythonDiagnostic } from '../types';

export function lintCCode(code: string): PythonDiagnostic[] {
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

    // Skip preprocessor and comments for bracket counting
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
        break; // skip rest of line
      }

      if (line[i] === '/' && line[i + 1] === '*') {
        inBlockComment = true;
        i += 2;
        continue;
      }

      // Skip strings and chars
      if (line[i] === '"' || line[i] === "'") {
        const q = line[i];
        i++;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line[i] === q) {
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
            id: `unmatched-closing-${lineNum}-${i}`,
            line: lineNum,
            column: i + 1,
            length: 1,
            severity: 'error',
            message: `SyntaxError : Caractère fermant '${ch}' inattendu sans ouvrant correspondant.`,
            code: 'unmatched_bracket',
            whyExplanation: `En langage C, chaque accolade, parenthèse ou crochet doit posséder une ouverture correspondante.`,
            howToFix: `Supprimez le '${ch}' superflu ou ajoutez son ouvrant correspondant en amont.`,
            suggestedCodeSnippet: ch === '}' ? `{\n    // bloc\n}` : `(/* expression */)`,
          });
        } else {
          const top = stack.pop()!;
          if (top.char !== matching[ch]) {
            diagnostics.push({
              id: `mismatched-bracket-${lineNum}-${i}`,
              line: lineNum,
              column: i + 1,
              length: 1,
              severity: 'error',
              message: `SyntaxError : Fermeture incohérente '${ch}' pour l'ouverture '${top.char}' (Ligne ${top.line}).`,
              code: 'mismatched_bracket',
              whyExplanation: `Vous avez ouvert un bloc avec '${top.char}' et tenté de le fermer avec '${ch}'.`,
              howToFix: `Remplacez '${ch}' par '${top.char === '(' ? ')' : top.char === '{' ? '}' : ']'}' pour respecter la parité.`,
            });
          }
        }
      }
      i++;
    }

    // 2. Missing Semicolon Check (Point-virgule ';' manquant)
    if (
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('/*') &&
      !trimmed.startsWith('*') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(':') &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith('\\') &&
      !trimmed.startsWith('if') &&
      !trimmed.startsWith('for') &&
      !trimmed.startsWith('while') &&
      !trimmed.startsWith('switch') &&
      !trimmed.startsWith('case') &&
      !trimmed.startsWith('default')
    ) {
      // Check if this is an expression or statement line needing a semicolon
      const isStatement =
        trimmed.startsWith('printf') ||
        trimmed.startsWith('scanf') ||
        trimmed.startsWith('return') ||
        trimmed.includes('=') ||
        trimmed.startsWith('int ') ||
        trimmed.startsWith('char ') ||
        trimmed.startsWith('float ') ||
        trimmed.startsWith('double ') ||
        trimmed.startsWith('void ') ||
        trimmed.startsWith('free(') ||
        trimmed.endsWith(')');

      // If next line is not an operator or continuation, flag missing semicolon
      const nextLine = lines[lineIdx + 1]?.trim() || '';
      const isContinuation = nextLine.startsWith('&&') || nextLine.startsWith('||') || nextLine.startsWith('+') || nextLine.startsWith('-');

      if (isStatement && !isContinuation) {
        diagnostics.push({
          id: `missing-semicolon-${lineNum}`,
          line: lineNum,
          column: line.length + 1,
          length: 1,
          severity: 'error',
          message: `error : Point-virgule ';' attendu à la fin de cette instruction en langage C.`,
          code: 'missing_semicolon',
          whyExplanation: `En langage C, chaque instruction élémentaire doit impérativement se terminer par un point-virgule ';'. L'oubli de point-virgule est la cause la plus fréquente d'erreur de compilation (GCC / Clang).`,
          howToFix: `Ajoutez un point-virgule ';' à la fin de la ligne.`,
          suggestedCodeSnippet: `${trimmed};`,
        });
      }
    }

    // 3. Unclosed String Check
    if (trimmed.includes('"')) {
      let count = 0;
      for (let cIdx = 0; cIdx < line.length; cIdx++) {
        if (line[cIdx] === '"' && (cIdx === 0 || line[cIdx - 1] !== '\\')) {
          count++;
        }
      }
      if (count % 2 !== 0) {
        diagnostics.push({
          id: `unclosed-string-${lineNum}`,
          line: lineNum,
          column: line.indexOf('"') + 1,
          length: 1,
          severity: 'error',
          message: `error : Chaîne littérale non refermée (guillemet '"' manquant).`,
          code: 'unclosed_string',
          whyExplanation: `Toute chaîne de caractères littérale ouverte avec '"' doit être refermée avant la fin de la ligne physique.`,
          howToFix: `Ajoutez le guillemet de fin '"' pour clore la chaîne de caractères.`,
          suggestedCodeSnippet: `${trimmed}"`,
        });
      }
    }
  }

  // Unclosed opening brackets
  for (const item of stack) {
    diagnostics.push({
      id: `unclosed-opening-${item.line}-${item.col}`,
      line: item.line,
      column: item.col,
      length: 1,
      severity: 'error',
      message: `SyntaxError : Caractère ouvrant '${item.char}' non refermé avant la fin du fichier.`,
      code: 'unclosed_bracket',
      whyExplanation: `En langage C, chaque bloc ouvert '${item.char}' doit comporter son fermant correspondant '${item.char === '(' ? ')' : item.char === '{' ? '}' : ']'}' .`,
      howToFix: `Ajoutez le caractère fermant correspondant '${item.char === '(' ? ')' : item.char === '{' ? '}' : ']'}' pour refermer le bloc.`,
    });
  }

  // 4. Global Checks: #include <stdio.h> and main()
  const fullCode = code.trim();
  if (fullCode.length > 0) {
    if ((fullCode.includes('printf') || fullCode.includes('puts') || fullCode.includes('scanf')) && !fullCode.includes('<stdio.h>')) {
      diagnostics.push({
        id: 'missing-stdio-include',
        line: 1,
        column: 1,
        length: 1,
        severity: 'warning',
        message: `warning : Déclaration implicite de la fonction 'printf' sans '#include <stdio.h>'.`,
        code: 'missing_include_stdio',
        whyExplanation: `En langage C, les fonctions d'entrée/sortie standard telles que printf() et scanf() sont déclarées dans l'en-tête standard <stdio.h>.`,
        howToFix: `Ajoutez '#include <stdio.h>' au tout début de votre fichier source C.`,
        suggestedCodeSnippet: `#include <stdio.h>\n\n`,
      });
    }

    if (!fullCode.includes('main') && fullCode.length > 20) {
      diagnostics.push({
        id: 'missing-main',
        line: lines.length,
        column: 1,
        length: 1,
        severity: 'warning',
        message: `warning : Aucun point d'entrée 'int main(void)' détecté dans le fichier C.`,
        code: 'missing_main',
        whyExplanation: `En langage C, l'exécution débute toujours par la fonction 'int main(void)' ou 'int main(int argc, char *argv[])'.`,
        howToFix: `Définissez la fonction principale 'int main(void) { ... return 0; }'.`,
        suggestedCodeSnippet: `int main(void) {\n    return 0;\n}`,
      });
    }
  }

  return diagnostics;
}

/**
 * Cleanly formats C code with proper block indentation (4 spaces)
 * and preprocessor directives pinned at column 0.
 */
export function formatCCode(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      formattedLines.push('');
      continue;
    }

    // Preprocessor directives stay at column 0
    if (trimmed.startsWith('#')) {
      formattedLines.push(trimmed);
      continue;
    }

    // Single line closing brace or case/default
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const isCase = trimmed.startsWith('case ') || trimmed.startsWith('default:');
    const effectiveIndent = isCase ? Math.max(0, indentLevel - 1) : indentLevel;
    const indentStr = '    '.repeat(effectiveIndent);

    formattedLines.push(`${indentStr}${trimmed}`);

    // If line opens braces, increase indent (accounting for both open and close in same line)
    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    const net = opens - closes;

    if (!trimmed.startsWith('}') && net > 0) {
      indentLevel += net;
    } else if (trimmed.startsWith('}') && net > -1) {
      indentLevel += (opens - (closes - 1));
    }
  }

  return formattedLines.join('\n');
}

