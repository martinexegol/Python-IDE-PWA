/**
 * C Language Intelligent Auto-Completion Engine.
 */

import { CompletionItem } from '../types';

export const C_STANDARD_COMPLETIONS: CompletionItem[] = [
  // Directives
  {
    id: 'c-include-stdio',
    label: '#include <stdio.h>',
    kind: 'snippet',
    detail: 'Entrées / Sorties standard (printf, scanf, fopen, etc.)',
    insertText: '#include <stdio.h>\n',
  },
  {
    id: 'c-include-stdlib',
    label: '#include <stdlib.h>',
    kind: 'snippet',
    detail: 'Allocation dynamique, conversions et utilitaires (malloc, free, rand)',
    insertText: '#include <stdlib.h>\n',
  },
  {
    id: 'c-include-string',
    label: '#include <string.h>',
    kind: 'snippet',
    detail: 'Manipulation de chaînes (strlen, strcpy, strcat, strcmp)',
    insertText: '#include <string.h>\n',
  },
  {
    id: 'c-include-math',
    label: '#include <math.h>',
    kind: 'snippet',
    detail: 'Fonctions mathématiques (sqrt, pow, sin, cos, ceil, floor)',
    insertText: '#include <math.h>\n',
  },
  {
    id: 'c-define',
    label: '#define',
    kind: 'keyword',
    detail: 'Constante symbolique ou macro préprocesseur',
    insertText: '#define ',
  },

  // Skeletons
  {
    id: 'c-main',
    label: 'main',
    kind: 'snippet',
    detail: 'Fonction principale int main(void)',
    insertText: 'int main(void) {\n    return 0;\n}',
  },
  {
    id: 'c-printf',
    label: 'printf',
    kind: 'function',
    detail: 'int printf(const char *format, ...)',
    insertText: 'printf("%s\\n", $1);',
  },
  {
    id: 'c-scanf',
    label: 'scanf',
    kind: 'function',
    detail: 'int scanf(const char *format, ...)',
    insertText: 'scanf("%d", &var);',
  },
  {
    id: 'c-malloc',
    label: 'malloc',
    kind: 'function',
    detail: 'void* malloc(size_t size) — Allocation sur le tas',
    insertText: 'malloc(sizeof(int) * 10)',
  },
  {
    id: 'c-free',
    label: 'free',
    kind: 'function',
    detail: 'void free(void *ptr) — Libération de mémoire',
    insertText: 'free(ptr);',
  },
  {
    id: 'c-sizeof',
    label: 'sizeof',
    kind: 'keyword',
    detail: 'sizeof(type) — Taille en octets en mémoire',
    insertText: 'sizeof(int)',
  },
  {
    id: 'c-for',
    label: 'for',
    kind: 'snippet',
    detail: 'Boucle for standard en C',
    insertText: 'for (int i = 0; i < count; i++) {\n    \n}',
  },
  {
    id: 'c-while',
    label: 'while',
    kind: 'snippet',
    detail: 'Boucle while en C',
    insertText: 'while (condition) {\n    \n}',
  },
  {
    id: 'c-if',
    label: 'if',
    kind: 'snippet',
    detail: 'Condition if en C',
    insertText: 'if (condition) {\n    \n}',
  },
  {
    id: 'c-struct',
    label: 'struct',
    kind: 'snippet',
    detail: 'Déclaration de structure struct',
    insertText: 'struct Device {\n    int id;\n    char name[64];\n};',
  },
  {
    id: 'c-typedef-struct',
    label: 'typedef struct',
    kind: 'snippet',
    detail: 'Définition d\'alias de structure avec typedef',
    insertText: 'typedef struct {\n    int x;\n    int y;\n} Point;',
  },

  // Types
  { id: 'c-type-int', label: 'int', kind: 'type', detail: 'Entier signé (standard 32-bit)', insertText: 'int ' },
  { id: 'c-type-char', label: 'char', kind: 'type', detail: 'Caractère 1 octet (ASCII)', insertText: 'char ' },
  { id: 'c-type-float', label: 'float', kind: 'type', detail: 'Nombre flottant simple précision (32-bit)', insertText: 'float ' },
  { id: 'c-type-double', label: 'double', kind: 'type', detail: 'Nombre flottant double précision (64-bit)', insertText: 'double ' },
  { id: 'c-type-void', label: 'void', kind: 'type', detail: 'Type vide / générique (void*)', insertText: 'void ' },
  { id: 'c-kw-const', label: 'const', kind: 'keyword', detail: 'Qualificateur de variable constante', insertText: 'const ' },
  { id: 'c-kw-return', label: 'return', kind: 'keyword', detail: 'Retour de fonction', insertText: 'return ' },
  { id: 'c-kw-null', label: 'NULL', kind: 'keyword', detail: 'Pointeur nul ((void*)0)', insertText: 'NULL' },
];

export function getCCompletionsForQuery(query: string, currentCode: string = ''): CompletionItem[] {
  const q = query.toLowerCase().trim();

  // Extract variables and functions declared in currentCode
  const customItems: CompletionItem[] = [];
  const lines = currentCode.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();

    // Match variables: int count = 0; or float val;
    const varMatch = trimmed.match(/^(?:int|char|float|double|void|size_t|bool)\s*\*?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (varMatch && !C_STANDARD_COMPLETIONS.some((c) => c.label === varMatch[1])) {
      customItems.push({
        id: `c-var-${varMatch[1]}-${idx}`,
        label: varMatch[1],
        kind: 'variable',
        detail: `Variable déclarée dans votre code source C`,
        insertText: varMatch[1],
      });
    }

    // Match functions: void afficher(int x) { ... }
    const funcMatch = trimmed.match(/^(?:int|void|char\*?|float|double)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (funcMatch && funcMatch[1] !== 'main' && !C_STANDARD_COMPLETIONS.some((c) => c.label === funcMatch[1])) {
      customItems.push({
        id: `c-fn-${funcMatch[1]}-${idx}`,
        label: funcMatch[1],
        kind: 'function',
        detail: `Fonction locale déclarée dans votre code C`,
        insertText: `${funcMatch[1]}()`,
      });
    }
  }

  const all = [...C_STANDARD_COMPLETIONS, ...customItems];

  if (!q) {
    return all.slice(0, 12);
  }

  return all
    .filter((item) => item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q))
    .slice(0, 12);
}
