/**
 * Python Live Linter & Static Analysis Engine.
 * Automatically identifies syntax errors, indentation anomalies, and common traps in real time.
 * Provides detailed "Pourquoi c'est une erreur" and "Comment la réparer" explanations.
 */

import { PythonDiagnostic } from '../types';

interface BracketRecord {
  char: string;
  line: number;
  col: number;
}

export function lintPythonCode(code: string): PythonDiagnostic[] {
  const diagnostics: PythonDiagnostic[] = [];
  const lines = code.split('\n');

  // 1. Bracket Matching Check ({}, (), [])
  const bracketStack: BracketRecord[] = [];
  const matchingBracket: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '[',
  };

  let inDocStringDelim: string | null = null;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const lineNum = lineIndex + 1;
    const trimmed = line.trim();
    let i = 0;
    const len = line.length;

    // Check multi-line docstring
    if (inDocStringDelim) {
      const endIdx = line.indexOf(inDocStringDelim);
      if (endIdx !== -1) {
        i = endIdx + inDocStringDelim.length;
        inDocStringDelim = null;
      } else {
        continue;
      }
    }

    // Check line by line
    while (i < len) {
      // Check comment
      if (line[i] === '#') {
        break; // comment ignores rest of line
      }

      // Check triple quotes
      const threeChar = line.slice(i, i + 3);
      if (threeChar === '"""' || threeChar === "'''") {
        const nextIdx = line.indexOf(threeChar, i + 3);
        if (nextIdx !== -1) {
          i = nextIdx + 3;
          continue;
        } else {
          inDocStringDelim = threeChar;
          break;
        }
      }

      // Check single line strings
      if (line[i] === "'" || line[i] === '"') {
        const quote = line[i];
        const col = i + 1;
        i++;
        let closed = false;
        while (i < len) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line[i] === quote) {
            closed = true;
            i++;
            break;
          }
          i++;
        }
        if (!closed) {
          diagnostics.push({
            id: `unclosed-str-${lineNum}-${col}`,
            line: lineNum,
            column: col,
            length: len - col + 1,
            severity: 'error',
            message: `SyntaxError : Chaîne littérale non fermée (guillemet '${quote}' manquant).`,
            code: 'unterminated_string',
            whyExplanation: `En Python, toute chaîne de caractères ouverte avec un guillemet (' ou ") doit être fermée sur la même ligne, sauf si vous utilisez des triples guillemets (""" ou ''') pour les chaînes multilignes.`,
            howToFix: `Ajoutez le guillemet de clôture '${quote}' à la fin du texte.`,
            suggestedCodeSnippet: `message = ${quote}Bonjour Python${quote}`,
          });
        }
        continue;
      }

      // Brackets
      const ch = line[i];
      if (ch === '(' || ch === '[' || ch === '{') {
        bracketStack.push({ char: ch, line: lineNum, col: i + 1 });
      } else if (ch === ')' || ch === ']' || ch === '}') {
        const expected = matchingBracket[ch];
        if (bracketStack.length === 0) {
          diagnostics.push({
            id: `extra-closing-${lineNum}-${i + 1}`,
            line: lineNum,
            column: i + 1,
            length: 1,
            severity: 'error',
            message: `SyntaxError : Symbole fermant '${ch}' inattendu sans ouvrant correspondant.`,
            code: 'unmatched_bracket',
            whyExplanation: `Vous tentez de fermer '${ch}' alors qu'aucun délimiteur ouvrant '${expected}' correspondant n'a été ouvert dans ce bloc de code.`,
            howToFix: `Supprimez ce symbole en trop ou vérifiez l'expression parenthésée correspondante.`,
          });
        } else {
          const last = bracketStack.pop()!;
          if (last.char !== expected) {
            diagnostics.push({
              id: `mismatched-bracket-${lineNum}-${i + 1}`,
              line: lineNum,
              column: i + 1,
              length: 1,
              severity: 'error',
              message: `SyntaxError : Discordance de délimiteurs : attendu '${last.char === '(' ? ')' : last.char === '[' ? ']' : '}'}', reçu '${ch}'.`,
              code: 'mismatched_brackets',
              whyExplanation: `Le délimiteur ouvrant '${last.char}' à la ligne ${last.line} attend sa fermeture exacte, mais a été fermé avec '${ch}'.`,
              howToFix: `Remplacez '${ch}' par '${last.char === '(' ? ')' : last.char === '[' ? ']' : '}'}'.`,
            });
          }
        }
      }

      i++;
    }

    // 2. Missing Colon ':' on Block Statements (def, class, if, elif, else, for, while, try, except, finally, with, match, case)
    if (trimmed && !trimmed.startsWith('#')) {
      const blockKeywords = [
        'def',
        'class',
        'if',
        'elif',
        'else',
        'for',
        'while',
        'try',
        'except',
        'finally',
        'with',
        'match',
        'case',
      ];

      for (const kw of blockKeywords) {
        const regex = new RegExp(`^${kw}\\b`);
        if (regex.test(trimmed)) {
          // Check if line ends with ':'
          // Ignore lines that already have a colon or are multiline signatures with open paren
          const strippedComments = trimmed.split('#')[0].trim();
          if (!strippedComments.endsWith(':') && bracketStack.length === 0) {
            diagnostics.push({
              id: `missing-colon-${lineNum}`,
              line: lineNum,
              column: line.indexOf(kw) + 1,
              length: kw.length,
              severity: 'error',
              message: `SyntaxError : Deux-points ':' manquants à la fin de l'instruction '${kw}'.`,
              code: 'missing_colon',
              whyExplanation: `En Python, les en-têtes de blocs de contrôle ('${kw}') doivent obligatoirement se terminer par deux-points ':'. C'est ce symbole qui indique à l'interpréteur que le bloc indenté va commencer.`,
              howToFix: `Ajoutez ':' à la fin de la ligne avant l'indentation du bloc enfant.`,
              suggestedCodeSnippet: `${trimmed}:`,
            });
          }
          break;
        }
      }

      // 3. Traps: "else if" instead of "elif"
      if (/^else\s+if\b/.test(trimmed)) {
        diagnostics.push({
          id: `else-if-${lineNum}`,
          line: lineNum,
          column: line.indexOf('else if') + 1,
          length: 7,
          severity: 'error',
          message: `SyntaxError : 'else if' n'existe pas en Python, utilisez 'elif'.`,
          code: 'use_elif',
          whyExplanation: `Python contracte 'else if' en un mot-clé unique 'elif'. Écrire 'else if' produit une erreur de syntaxe immédiate.`,
          howToFix: `Remplacez 'else if' par 'elif'.`,
          suggestedCodeSnippet: trimmed.replace(/^else\s+if\b/, 'elif'),
        });
      }

      // 4. Traps: Lowercase "true", "false", "null"
      const lowerBooleans = [
        { word: 'true', replacement: 'True' },
        { word: 'false', replacement: 'False' },
        { word: 'null', replacement: 'None' },
      ];
      for (const b of lowerBooleans) {
        const bRegex = new RegExp(`(?<![a-zA-Z0-9_])${b.word}(?![a-zA-Z0-9_])`);
        if (bRegex.test(trimmed) && !trimmed.startsWith('#')) {
          diagnostics.push({
            id: `lower-bool-${lineNum}-${b.word}`,
            line: lineNum,
            column: line.indexOf(b.word) + 1,
            length: b.word.length,
            severity: 'error',
            message: `NameError : En Python, utilisez '${b.replacement}' (avec une majuscule).`,
            code: 'capitalized_constants',
            whyExplanation: `En Python, les valeurs booléennes et l'absence de valeur sont nommées 'True', 'False' et 'None' avec une majuscule obligatoire. Les minuscules '${b.word}' sont interprétées comme des variables non définies.`,
            howToFix: `Remplacez '${b.word}' par '${b.replacement}'.`,
            suggestedCodeSnippet: `x = ${b.replacement}`,
          });
        }
      }

      // 5. Traps: "function" or "void" keyword
      if (/^(?:function|void)\s+([a-zA-Z_][a-zA-Z0-9_]*)/.test(trimmed)) {
        diagnostics.push({
          id: `func-keyword-${lineNum}`,
          line: lineNum,
          column: 1,
          length: 8,
          severity: 'error',
          message: `SyntaxError : Les fonctions Python se déclarent exclusivement avec 'def'.`,
          code: 'use_def',
          whyExplanation: `En Python, les fonctions se déclarent exclusivement avec le mot-clé 'def', sans mot-clé 'function' ni type de retour 'void'.`,
          howToFix: `Remplacez par 'def nom_de_fonction():'`,
          suggestedCodeSnippet: trimmed.replace(/^(?:function|void)\s+/, 'def '),
        });
      }

      // 6. Traps: Logical operators &&, ||, !
      if (/&&|\|\||(?<![a-zA-Z0-9_])!(?!=)/.test(trimmed) && !trimmed.startsWith('#')) {
        diagnostics.push({
          id: `logical-op-${lineNum}`,
          line: lineNum,
          column: 1,
          length: 2,
          severity: 'error',
          message: `SyntaxError : Utilisez les opérateurs logiques Python 'and', 'or', 'not'.`,
          code: 'python_logical_operators',
          whyExplanation: `Python n'utilise pas la syntaxe C/Java '&&' ou '||', mais des mots-clés en clair : 'and', 'or', 'not'.`,
          howToFix: `Remplacez '&&' par 'and', '||' par 'or', et '!' par 'not'.`,
        });
      }
    }
  }

  // Check unclosed brackets remaining at end of file
  if (bracketStack.length > 0) {
    const unclosed = bracketStack[bracketStack.length - 1];
    diagnostics.push({
      id: `unclosed-eof-${unclosed.line}`,
      line: unclosed.line,
      column: unclosed.col,
      length: 1,
      severity: 'error',
      message: `SyntaxError : Symbole ouvrant '${unclosed.char}' non fermé à la fin du fichier.`,
      code: 'unclosed_bracket_eof',
      whyExplanation: `Vous avez ouvert un délimiteur '${unclosed.char}' à la ligne ${unclosed.line} sans jamais le fermer avec son opposé correspondant.`,
      howToFix: `Fermez le délimiteur '${unclosed.char === '(' ? ')' : unclosed.char === '[' ? ']' : '}'}' à l'endroit approprié.`,
    });
  }

  return diagnostics;
}
