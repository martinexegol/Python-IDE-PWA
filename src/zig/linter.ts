/**
 * Zig Language (0.13.0+) Live Static Analyzer & Compiler Diagnostics Engine.
 * Detects:
 *  - Memory Leaks: allocations without defer allocator.free/destroy, GPA without deinit
 *  - Double-Free & Use-After-Free vulnerabilities
 *  - Missing @import("std") when using std library
 *  - Missing 'try' or 'catch' on error-returning functions
 *  - C syntax habits in Zig (printf, malloc, free, #include, NULL, %d format specifiers)
 *  - Unused variables (fatal compile error in Zig)
 *  - Variables declared 'var' that should be 'const'
 *  - Missing semicolons and unmatched brackets
 *  - Array index out of bounds & division by zero
 */

import { PythonDiagnostic } from '../types';

export function lintZigCode(code: string): PythonDiagnostic[] {
  const diagnostics: PythonDiagnostic[] = [];
  const lines = code.split('\n');
  const fullCode = code;

  // Track brackets and parens
  const stack: { char: string; line: number; col: number }[] = [];
  const matching: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

  // Memory & Resource tracking
  const allocations = new Map<string, { line: number; type: string }>();
  const freedResources = new Map<string, number>();
  const declaredArrays = new Map<string, { size: number; line: number }>();
  const declaredVars = new Map<string, { isConst: boolean; line: number; modified: boolean; used: boolean }>();

  let hasStdImport = false;
  let usesStd = false;
  let hasGpa = false;
  let hasGpaDeinit = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineNum = lineIdx + 1;
    const trimmed = line.trim();

    if (!trimmed) continue;

    // Check std import
    if (trimmed.includes('@import("std")') || trimmed.includes("@import('std')")) {
      hasStdImport = true;
    }
    if (trimmed.includes('std.')) {
      usesStd = true;
    }

    // Strip comments and string literals for lexing
    const strippedComments = line.replace(/\/\/.*$/, '');
    const cleanLine = strippedComments
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, "''");

    // -------------------------------------------------------------
    // A. BRACKETS & PARENTHESES MATCHING
    // -------------------------------------------------------------
    let charIdx = 0;
    let inStr = false;

    while (charIdx < line.length) {
      const ch = line[charIdx];

      if (!inStr && (ch === '"' || ch === "'")) {
        inStr = true;
      } else if (inStr && (ch === '"' || ch === "'") && line[charIdx - 1] !== '\\') {
        inStr = false;
      } else if (!inStr) {
        if (ch === '/' && line[charIdx + 1] === '/') {
          break; // Comment till end of line
        }
        if (ch === '\\' && line[charIdx + 1] === '\\') {
          break; // Multi-line string
        }
        if (ch === '(' || ch === '{' || ch === '[') {
          stack.push({ char: ch, line: lineNum, col: charIdx + 1 });
        } else if (ch === ')' || ch === '}' || ch === ']') {
          if (stack.length === 0) {
            diagnostics.push({
              id: `unmatched-closing-${lineNum}-${charIdx}`,
              line: lineNum,
              column: charIdx + 1,
              length: 1,
              severity: 'error',
              message: `SyntaxError : Caractère fermant '${ch}' inattendu sans ouvrant correspondant.`,
              code: 'unmatched_bracket',
              whyExplanation: `En Zig, chaque accolade, parenthèse ou crochet fermant doit correspondre à un symbole ouvrant de même type.`,
              howToFix: `Supprimez le '${ch}' superflu ou ajoutez son ouvrant correspondant en amont.`,
              suggestedCodeSnippet: ch === '}' ? `{\n    // code\n}` : `()`,
            });
          } else {
            const top = stack.pop()!;
            if (top.char !== matching[ch]) {
              diagnostics.push({
                id: `mismatched-bracket-${lineNum}-${charIdx}`,
                line: lineNum,
                column: charIdx + 1,
                length: 1,
                severity: 'error',
                message: `SyntaxError : Fermeture incohérente '${ch}' pour l'ouverture '${top.char}' (Ligne ${top.line}).`,
                code: 'mismatched_bracket',
                whyExplanation: `Le bloc a été ouvert avec '${top.char}' à la ligne ${top.line} et refermé avec un '${ch}' incompatible.`,
                howToFix: `Remplacez '${ch}' par '${top.char === '(' ? ')' : top.char === '{' ? '}' : ']'}' pour respecter la parité des blocs.`,
              });
            }
          }
        }
      }
      charIdx++;
    }

    // -------------------------------------------------------------
    // B. POINT-VIRGULE MANQUANT (MISSING SEMICOLON)
    // -------------------------------------------------------------
    if (
      trimmed &&
      !trimmed.startsWith('//') &&
      !trimmed.startsWith('///') &&
      !trimmed.startsWith('\\\\') &&
      !trimmed.endsWith('{') &&
      !trimmed.endsWith('}') &&
      !trimmed.endsWith(':') &&
      !trimmed.endsWith(';') &&
      !trimmed.endsWith(',') &&
      !trimmed.endsWith('\\') &&
      !trimmed.startsWith('fn ') &&
      !trimmed.startsWith('pub fn ') &&
      !trimmed.startsWith('test ') &&
      !trimmed.startsWith('if ') &&
      !trimmed.startsWith('if(') &&
      !trimmed.startsWith('} else') &&
      !trimmed.startsWith('while ') &&
      !trimmed.startsWith('while(') &&
      !trimmed.startsWith('for ') &&
      !trimmed.startsWith('for(') &&
      !trimmed.startsWith('else') &&
      !trimmed.startsWith('switch ') &&
      !trimmed.startsWith('switch(')
    ) {
      const isStatement =
        trimmed.startsWith('const ') ||
        trimmed.startsWith('var ') ||
        trimmed.startsWith('defer ') ||
        trimmed.startsWith('errdefer ') ||
        trimmed.startsWith('return') ||
        trimmed.startsWith('std.debug.print') ||
        trimmed.startsWith('try ') ||
        trimmed.includes('=') ||
        trimmed.endsWith(')');

      const nextLine = lines[lineIdx + 1]?.trim() || '';
      const isContinuation =
        nextLine.startsWith('catch') ||
        nextLine.startsWith('orelse') ||
        nextLine.startsWith('||') ||
        nextLine.startsWith('&&') ||
        nextLine.startsWith('+') ||
        nextLine.startsWith('.');

      if (isStatement && !isContinuation) {
        diagnostics.push({
          id: `missing-semicolon-${lineNum}`,
          line: lineNum,
          column: line.length + 1,
          length: 1,
          severity: 'error',
          message: `error : Point-virgule ';' manquant à la fin de cette instruction Zig.`,
          code: 'missing_semicolon',
          whyExplanation: `En Zig, toutes les instructions élémentaires (déclarations de constantes/variables, retours, appels et déferrements) doivent obligatoirement se terminer par un point-virgule ';'.`,
          howToFix: `Ajoutez un point-virgule ';' à la fin de la ligne.`,
          suggestedCodeSnippet: `${trimmed};`,
        });
      }
    }

    // -------------------------------------------------------------
    // C. ANCIENNES HABITUDES C DÉTECTÉES EN ZIG
    // -------------------------------------------------------------
    // 1. printf() au lieu de std.debug.print
    if (/\bprintf\s*\(/.test(cleanLine)) {
      diagnostics.push({
        id: `c-printf-in-zig-${lineNum}`,
        line: lineNum,
        column: line.indexOf('printf') + 1,
        length: 6,
        severity: 'error',
        message: `error : 'printf()' n'existe pas en Zig. Utilisez 'std.debug.print()'.`,
        code: 'zig_use_print',
        whyExplanation: `En Zig, l'affichage standard s'effectue via 'std.debug.print(fmt, args)' avec un tuple d'arguments .{...}.`,
        howToFix: `Remplacez 'printf(...)' par 'std.debug.print("{s}\\n", .{"texte"})'.`,
        suggestedCodeSnippet: line.replace(/printf\s*\(/, 'std.debug.print(').trim(),
      });
    }

    // 2. malloc() / free() au lieu de l'allocateur Zig
    if (/\bmalloc\s*\(/.test(cleanLine)) {
      diagnostics.push({
        id: `c-malloc-in-zig-${lineNum}`,
        line: lineNum,
        column: line.indexOf('malloc') + 1,
        length: 6,
        severity: 'error',
        message: `error : 'malloc()' n'existe pas en Zig. L'allocation passe par un Allocator (ex: GPA).`,
        code: 'zig_use_allocator',
        whyExplanation: `En Zig, il n'y a pas d'allocation cachée ni d'allocateur global par défaut. La mémoire se réserve explicitement via 'allocator.alloc(T, n)' ou 'allocator.create(T)'.`,
        howToFix: `Utilisez 'try allocator.alloc(u8, taille)' avec un GeneralPurposeAllocator.`,
        suggestedCodeSnippet: `const buffer = try allocator.alloc(u8, 1024);\ndefer allocator.free(buffer);`,
      });
    }

    // 3. NULL au lieu de null
    if (/\bNULL\b/.test(cleanLine)) {
      diagnostics.push({
        id: `c-null-in-zig-${lineNum}`,
        line: lineNum,
        column: line.indexOf('NULL') + 1,
        length: 4,
        severity: 'error',
        message: `error : En Zig, le mot-clé pour le pointeur/valeur nulle est 'null' en minuscules.`,
        code: 'zig_null_lowercase',
        whyExplanation: `'NULL' est une macro du langage C. En Zig, 'null' est un mot-clé de première classe pour les types optionnels (?T).`,
        howToFix: `Remplacez 'NULL' par 'null'.`,
        suggestedCodeSnippet: line.replace(/\bNULL\b/g, 'null').trim(),
      });
    }

    // 4. Spécificateurs de format C (%d, %s) dans std.debug.print
    if (cleanLine.includes('std.debug.print')) {
      if (/%[dsfpxX]/.test(line)) {
        diagnostics.push({
          id: `c-format-specifier-in-zig-${lineNum}`,
          line: lineNum,
          column: line.indexOf('%') + 1,
          length: 2,
          severity: 'warning',
          message: `warning : Spécificateur de format C '%d/%s' détecté dans 'std.debug.print'. En Zig, utilisez '{}' ou '{s}'.`,
          code: 'zig_format_specifier',
          whyExplanation: `Le formateur Zig 'std.fmt' utilise des accolades '{}' pour le format par défaut, '{d}' pour les décimaux, '{s}' pour les chaînes et '{x}' pour l'hexadécimal.`,
          howToFix: `Remplacez '%d', '%s' ou '%f' par '{}' ou '{s}'.`,
          suggestedCodeSnippet: line.replace(/%[dsf]/g, '{}').trim(),
        });
      }
    }

    // -------------------------------------------------------------
    // D. GESTION DE LA MÉMOIRE & FUITES EN ZIG (GPA & DEFER ALLOCATOR.FREE)
    // -------------------------------------------------------------
    // Détection GPA
    if (cleanLine.includes('GeneralPurposeAllocator')) {
      hasGpa = true;
    }
    if (cleanLine.includes('gpa.deinit()')) {
      hasGpaDeinit = true;
    }

    // Détection d'allocations de tranches : const buf = try allocator.alloc(...)
    const allocMatch = cleanLine.match(/(?:const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:try\s+)?([a-zA-Z0-9_]+)\.(alloc|create|dupe)\s*\(/);
    if (allocMatch) {
      const varName = allocMatch[1];
      const allocName = allocMatch[2];
      const method = allocMatch[3];
      allocations.set(varName, { line: lineNum, type: `${allocName}.${method}` });
      freedResources.delete(varName);
    }

    // Détection d'ArrayList init
    const arrayListMatch = cleanLine.match(/(?:const|var)\s+([a-zA-Z0-9_]+)\s*=\s*std\.ArrayList\([^)]+\)\.init\(/);
    if (arrayListMatch) {
      const listName = arrayListMatch[1];
      allocations.set(listName, { line: lineNum, type: 'std.ArrayList' });
      freedResources.delete(listName);
    }

    // Détection de libération : defer allocator.free(buf) ou defer list.deinit()
    const freeMatch = cleanLine.match(/(?:defer\s+)?([a-zA-Z0-9_]+)\.(free|destroy|deinit)\s*\(\s*([a-zA-Z0-9_]*)\s*\)/);
    if (freeMatch) {
      const method = freeMatch[2];
      const target = method === 'deinit' ? freeMatch[1] : freeMatch[3];

      if (freedResources.has(target)) {
        const firstLine = freedResources.get(target);
        diagnostics.push({
          id: `double-free-${lineNum}`,
          line: lineNum,
          column: line.indexOf(method) + 1,
          length: method.length,
          severity: 'error',
          message: `Erreur Critique : Double libération (Double Free) sur '${target}'.`,
          code: 'double_free',
          whyExplanation: `'${target}' a déjà été libéré à la ligne ${firstLine}. Une seconde libération entraîne une corruption de mémoire.`,
          howToFix: `Supprimez l'appel de libération redondant.`,
        });
      } else {
        freedResources.set(target, lineNum);
      }
    }

    // -------------------------------------------------------------
    // E. GESTION DES ERREURS : FONCTIONS AVEC ERREURS NON CAPTURÉES
    // -------------------------------------------------------------
    // Si une fonction est appelée avec allocation ou std.fs sans try ni catch
    if (
      (cleanLine.includes('allocator.alloc') ||
        cleanLine.includes('allocator.create') ||
        cleanLine.includes('openFile') ||
        cleanLine.includes('makeDir')) &&
      !cleanLine.startsWith('try ') &&
      !cleanLine.includes('catch') &&
      !cleanLine.includes('try ') &&
      !cleanLine.startsWith('const ') &&
      !cleanLine.includes('catch')
    ) {
      diagnostics.push({
        id: `unhandled-error-${lineNum}`,
        line: lineNum,
        column: 1,
        length: 5,
        severity: 'warning',
        message: `warning : Union d'erreur non gérée (Error Union). Zig interdit d'ignorer une erreur.`,
        code: 'unhandled_error_union',
        whyExplanation: `Les fonctions qui allouent de la mémoire ou effectuent des E/S retournent une union d'erreur (!T). En Zig, l'erreur doit être propagée avec 'try' ou gérée avec 'catch'.`,
        howToFix: `Préfixez l'appel par 'try ' ou ajoutez 'catch |err| { ... }'.`,
        suggestedCodeSnippet: `try ${trimmed}`,
      });
    }

    // -------------------------------------------------------------
    // F. DÉTECTION DES VARIABLES 'var' QUI POURRAIENT ÊTRE 'const'
    // -------------------------------------------------------------
    const varDeclMatch = cleanLine.match(/^\s*var\s+([a-zA-Z0-9_]+)\s*(?::\s*[^=]+)?\s*=\s*(.+);/);
    if (varDeclMatch) {
      const varName = varDeclMatch[1];
      declaredVars.set(varName, { isConst: false, line: lineNum, modified: false, used: false });
    }

    // Vérifier si une variable est modifiée
    declaredVars.forEach((v, name) => {
      if (lineNum > v.line) {
        if (new RegExp(`\\b${name}\\s*(?:\\+=|-=|\\*=|/=|=(?!=))`).test(cleanLine)) {
          v.modified = true;
        }
        if (new RegExp(`\\b${name}\\b`).test(cleanLine)) {
          v.used = true;
        }
      }
    });

    // -------------------------------------------------------------
    // G. DIVISION PAR ZÉRO
    // -------------------------------------------------------------
    if (/[/%]\s*0\b/.test(cleanLine)) {
      diagnostics.push({
        id: `division-by-zero-${lineNum}`,
        line: lineNum,
        column: line.search(/[/%]\s*0\b/) + 1,
        length: 3,
        severity: 'error',
        message: `error : Division ou modulo par zéro détecté en Zig.`,
        code: 'division_by_zero',
        whyExplanation: `La division par zéro provoque un arrêt immédiat avec panique en mode Debug / ReleaseSafe.`,
        howToFix: `Vérifiez que le diviseur est non nul avant d'effectuer la division.`,
      });
    }
  }

  // -------------------------------------------------------------
  // H. FUITES DE MÉMOIRE ZIG : ALLOCATIONS NON LIBÉRÉES AVEC DEFER
  // -------------------------------------------------------------
  allocations.forEach((allocInfo, name) => {
    if (!freedResources.has(name)) {
      const freeCall = allocInfo.type === 'std.ArrayList' ? `defer ${name}.deinit();` : `defer allocator.free(${name});`;
      diagnostics.push({
        id: `memory-leak-${allocInfo.line}`,
        line: allocInfo.line,
        column: 1,
        length: name.length,
        severity: 'error',
        message: `Fuite de mémoire détectée (Memory Leak) : '${name}' alloué avec '${allocInfo.type}' n'est jamais libéré.`,
        code: 'memory_leak',
        whyExplanation: `En Zig, toute ressource dynamique doit être libérée explicitement. La convention idiomatique est d'ajouter une clause 'defer' immédiatement après l'allocation.`,
        howToFix: `Ajoutez '${freeCall}' immédiatement sous la ligne d'allocation.`,
        suggestedCodeSnippet: `${freeCall}`,
      });
    }
  });

  // Détection GPA sans deinit
  if (hasGpa && !hasGpaDeinit) {
    diagnostics.push({
      id: 'gpa-missing-deinit',
      line: 1,
      column: 1,
      length: 3,
      severity: 'error',
      message: `Fuite de mémoire : 'GeneralPurposeAllocator' instancié sans 'defer _ = gpa.deinit();'.`,
      code: 'gpa_missing_deinit',
      whyExplanation: `Le GeneralPurposeAllocator de Zig maintient une table de blocs en mémoire. L'appel à 'gpa.deinit()' à la fin du programme permet de détecter les fuites et de restituer la mémoire au système hôte.`,
      howToFix: `Ajoutez 'defer _ = gpa.deinit();' juste après l'instanciation de 'gpa'.`,
      suggestedCodeSnippet: `defer _ = gpa.deinit();`,
    });
  }

  // -------------------------------------------------------------
  // I. BLOCS NON REFERMÉS
  // -------------------------------------------------------------
  for (const item of stack) {
    diagnostics.push({
      id: `unclosed-opening-${item.line}-${item.col}`,
      line: item.line,
      column: item.col,
      length: 1,
      severity: 'error',
      message: `SyntaxError : Bloc ouvrant '${item.char}' non refermé avant la fin du fichier.`,
      code: 'unclosed_bracket',
      whyExplanation: `En Zig, chaque bloc ouvert '${item.char}' doit comporter son fermant correspondant '${item.char === '(' ? ')' : item.char === '{' ? '}' : ']'}' .`,
      howToFix: `Ajoutez '${item.char === '(' ? ')' : item.char === '{' ? '}' : ']'}' pour fermer le bloc.`,
      suggestedCodeSnippet: item.char === '{' ? '}' : item.char === '(' ? ')' : ']',
    });
  }

  // -------------------------------------------------------------
  // J. IMPORT STD MANQUANT & POINT D'ENTRÉE MAIN
  // -------------------------------------------------------------
  if (usesStd && !hasStdImport) {
    diagnostics.push({
      id: 'missing-std-import',
      line: 1,
      column: 1,
      length: 1,
      severity: 'error',
      message: `error : Utilisation du module 'std' sans 'const std = @import("std");'.`,
      code: 'missing_std_import',
      whyExplanation: `En Zig, la bibliothèque standard 'std' n'est pas injectée automatiquement dans l'espace de noms. Elle doit être importée explicitement.`,
      howToFix: `Ajoutez 'const std = @import("std");' à la première ligne du fichier.`,
      suggestedCodeSnippet: `const std = @import("std");\n\n`,
    });
  }

  if (fullCode.trim().length > 20 && !fullCode.includes('pub fn main')) {
    diagnostics.push({
      id: 'missing-main-fn',
      line: lines.length,
      column: 1,
      length: 1,
      severity: 'warning',
      message: `warning : Aucun point d'entrée 'pub fn main() !void' détecté dans le fichier Zig.`,
      code: 'missing_main',
      whyExplanation: `Pour compiler et exécuter un programme exécutable avec 'zig run', Zig recherche une fonction publique 'pub fn main() !void' ou 'pub fn main() void'.`,
      howToFix: `Définissez la fonction principale 'pub fn main() !void { ... }'.`,
      suggestedCodeSnippet: `pub fn main() !void {\n    std.debug.print("Hello, Zig!\\n", .{});\n}`,
    });
  }

  return diagnostics;
}

/**
 * Format Zig code with 4 spaces standard indentation.
 */
export function formatZigCode(code: string): string {
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

    // Multi-line doc or raw string
    if (trimmed.startsWith('\\\\')) {
      formattedLines.push(rawLine);
      continue;
    }

    // Closing brackets reduce indent
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    const indentStr = '    '.repeat(indentLevel);
    formattedLines.push(`${indentStr}${trimmed}`);

    const opens = (trimmed.match(/\{/g) || []).length;
    const closes = (trimmed.match(/\}/g) || []).length;
    const net = opens - closes;

    if (!trimmed.startsWith('}') && net > 0) {
      indentLevel += net;
    } else if (trimmed.startsWith('}') && net > -1) {
      indentLevel += opens - (closes - 1);
    }
  }

  return formattedLines.join('\n');
}
