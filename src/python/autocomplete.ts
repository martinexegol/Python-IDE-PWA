/**
 * Python Autocomplete & Intellisense Provider.
 * Provides Python 3.12 keywords, snippets, built-ins, methods,
 * and dynamically extracts declared variables, functions, and classes from the active file.
 */

import { CompletionItem } from '../types';

export const PYTHON_COMPLETIONS: CompletionItem[] = [
  // Snippets
  {
    id: 'snip-main',
    label: 'main',
    kind: 'snippet',
    detail: 'def main(): ... if __name__ == "__main__":',
    documentation: 'Point d\'entrée standard d\'un script ou module Python exécutable.',
    insertText: 'def main():\n    $CURSOR\n\nif __name__ == "__main__":\n    main()',
  },
  {
    id: 'snip-def',
    label: 'def',
    kind: 'snippet',
    detail: 'def function_name(args): ...',
    documentation: 'Déclaration d\'une fonction Python.',
    insertText: 'def $CURSOR():\n    pass',
  },
  {
    id: 'snip-class',
    label: 'class',
    kind: 'snippet',
    detail: 'class ClassName: def __init__(self): ...',
    documentation: 'Déclaration d\'une classe orientée objet Python avec constructeur __init__.',
    insertText: 'class $CURSOR:\n    def __init__(self):\n        pass',
  },
  {
    id: 'snip-dataclass',
    label: 'dataclass',
    kind: 'snippet',
    detail: '@dataclass class Model: ...',
    documentation: 'Classe de données Python moderne avec génération automatique des méthodes spéciales.',
    insertText: '@dataclass\nclass $CURSOR:\n    name: str\n    value: int',
  },
  {
    id: 'snip-for-in',
    label: 'forin',
    kind: 'snippet',
    detail: 'for item in collection: ...',
    documentation: 'Boucle d\'itération sur un itérable Python (liste, dictionnaire, etc.).',
    insertText: 'for item in $CURSOR:\n    pass',
  },
  {
    id: 'snip-for-range',
    label: 'forrange',
    kind: 'snippet',
    detail: 'for i in range(n): ...',
    documentation: 'Boucle bornée avec la fonction built-in range().',
    insertText: 'for i in range($CURSOR):\n    pass',
  },
  {
    id: 'snip-try-except',
    label: 'tryexcept',
    kind: 'snippet',
    detail: 'try: ... except Exception as e: ...',
    documentation: 'Gestion des exceptions et erreurs d\'exécution Python.',
    insertText: 'try:\n    $CURSOR\nexcept Exception as e:\n    print(f"Erreur détectée : {e}")',
  },
  {
    id: 'snip-with',
    label: 'with',
    kind: 'snippet',
    detail: 'with open("file.txt") as f: ...',
    documentation: 'Gestionnaire de contexte (Context Manager) assurant la libération des ressources.',
    insertText: 'with open("$CURSOR", "r") as f:\n    content = f.read()',
  },
  {
    id: 'snip-listcomp',
    label: 'listcomp',
    kind: 'snippet',
    detail: '[x for x in iterable if cond]',
    documentation: 'Compréhension de liste Python concise et optimisée.',
    insertText: '[$CURSOR for item in items]',
  },
  {
    id: 'snip-dictcomp',
    label: 'dictcomp',
    kind: 'snippet',
    detail: '{k: v for k, v in iterable}',
    documentation: 'Compréhension de dictionnaire Python.',
    insertText: '{key: value for key, value in $CURSOR}',
  },
  {
    id: 'snip-lambda',
    label: 'lambda',
    kind: 'snippet',
    detail: 'lambda x: expression',
    documentation: 'Fonction anonyme concise.',
    insertText: 'lambda x: $CURSOR',
  },
  {
    id: 'snip-print',
    label: 'print',
    kind: 'function',
    detail: 'print(*values, sep=" ", end="\\n")',
    documentation: 'Affiche un ou plusieurs objets dans la console de sortie Python.',
    insertText: 'print($CURSOR)',
  },
  {
    id: 'snip-fstring',
    label: 'fstring',
    kind: 'snippet',
    detail: 'f"texte {expression}"',
    documentation: 'Chaîne de formatage littérale f-string Python.',
    insertText: 'f"$CURSOR"',
  },

  // Keywords
  { id: 'kw-if', label: 'if', kind: 'keyword', detail: 'Conditionnel if', insertText: 'if $CURSOR:\n    pass' },
  { id: 'kw-elif', label: 'elif', kind: 'keyword', detail: 'Alternative conditionnelle elif', insertText: 'elif $CURSOR:\n    pass' },
  { id: 'kw-else', label: 'else', kind: 'keyword', detail: 'Bloc alternatif else', insertText: 'else:\n    pass' },
  { id: 'kw-while', label: 'while', kind: 'keyword', detail: 'Boucle conditionnelle while', insertText: 'while $CURSOR:\n    pass' },
  { id: 'kw-return', label: 'return', kind: 'keyword', detail: 'Retourne une valeur', insertText: 'return ' },
  { id: 'kw-yield', label: 'yield', kind: 'keyword', detail: 'Générateur de flux yield', insertText: 'yield ' },
  { id: 'kw-import', label: 'import', kind: 'keyword', detail: 'Importation de module Python', insertText: 'import ' },
  { id: 'kw-from', label: 'from', kind: 'keyword', detail: 'Importation sélective from ... import', insertText: 'from $CURSOR import ' },
  { id: 'kw-as', label: 'as', kind: 'keyword', detail: 'Alias d\'importation ou capture d\'exception', insertText: 'as ' },
  { id: 'kw-in', label: 'in', kind: 'keyword', detail: 'Opérateur d\'appartenance / boucle', insertText: 'in ' },
  { id: 'kw-is', label: 'is', kind: 'keyword', detail: 'Opérateur d\'identité d\'objet', insertText: 'is ' },
  { id: 'kw-not', label: 'not', kind: 'keyword', detail: 'Négation logique not', insertText: 'not ' },
  { id: 'kw-and', label: 'and', kind: 'keyword', detail: 'Conjonction logique and', insertText: 'and ' },
  { id: 'kw-or', label: 'or', kind: 'keyword', detail: 'Disjonction logique or', insertText: 'or ' },
  { id: 'kw-pass', label: 'pass', kind: 'keyword', detail: 'Instruction neutre no-op', insertText: 'pass' },
  { id: 'kw-break', label: 'break', kind: 'keyword', detail: 'Interrompt la boucle courante', insertText: 'break' },
  { id: 'kw-continue', label: 'continue', kind: 'keyword', detail: 'Passe à l\'itération suivante', insertText: 'continue' },
  { id: 'kw-async', label: 'async', kind: 'keyword', detail: 'Déclaration asynchrone async def', insertText: 'async def $CURSOR():\n    pass' },
  { id: 'kw-await', label: 'await', kind: 'keyword', detail: 'Attend l\'exécution d\'une coroutine', insertText: 'await ' },

  // Built-in Constants & Types
  { id: 'const-true', label: 'True', kind: 'keyword', detail: 'Booléen vrai', insertText: 'True' },
  { id: 'const-false', label: 'False', kind: 'keyword', detail: 'Booléen faux', insertText: 'False' },
  { id: 'const-none', label: 'None', kind: 'keyword', detail: 'Valeur nulle / absence d\'objet', insertText: 'None' },
  { id: 'type-int', label: 'int', kind: 'type', detail: 'Entier de précision arbitraire', insertText: 'int' },
  { id: 'type-float', label: 'float', kind: 'type', detail: 'Nombre décimal flottant 64-bit', insertText: 'float' },
  { id: 'type-str', label: 'str', kind: 'type', detail: 'Chaîne de caractères Unicode', insertText: 'str' },
  { id: 'type-bool', label: 'bool', kind: 'type', detail: 'Type booléen (True/False)', insertText: 'bool' },
  { id: 'type-list', label: 'list', kind: 'type', detail: 'Liste dynamique ordonnée', insertText: 'list' },
  { id: 'type-dict', label: 'dict', kind: 'type', detail: 'Dictionnaire clé-valeur (table de hachage)', insertText: 'dict' },
  { id: 'type-set', label: 'set', kind: 'type', detail: 'Ensemble d\'éléments uniques non ordonnés', insertText: 'set' },
  { id: 'type-tuple', label: 'tuple', kind: 'type', detail: 'Tuple immuable ordonné', insertText: 'tuple' },

  // Built-in Functions
  { id: 'fn-len', label: 'len', kind: 'function', detail: 'len(s) -> int', documentation: 'Retourne la longueur ou le nombre d\'éléments.', insertText: 'len($CURSOR)' },
  { id: 'fn-range', label: 'range', kind: 'function', detail: 'range(stop) ou range(start, stop, step)', documentation: 'Génère une séquence arithmétique d\'entiers.', insertText: 'range($CURSOR)' },
  { id: 'fn-enumerate', label: 'enumerate', kind: 'function', detail: 'enumerate(iterable, start=0)', documentation: 'Retourne un itérateur de paires (index, valeur).', insertText: 'enumerate($CURSOR)' },
  { id: 'fn-zip', label: 'zip', kind: 'function', detail: 'zip(*iterables)', documentation: 'Agrège les éléments de plusieurs itérables en tuples.', insertText: 'zip($CURSOR)' },
  { id: 'fn-sum', label: 'sum', kind: 'function', detail: 'sum(iterable, start=0)', documentation: 'Additionne tous les éléments d\'un itérable.', insertText: 'sum($CURSOR)' },
  { id: 'fn-min', label: 'min', kind: 'function', detail: 'min(iterable) ou min(arg1, arg2, ...)', documentation: 'Retourne le plus petit élément.', insertText: 'min($CURSOR)' },
  { id: 'fn-max', label: 'max', kind: 'function', detail: 'max(iterable) ou max(arg1, arg2, ...)', documentation: 'Retourne le plus grand élément.', insertText: 'max($CURSOR)' },
  { id: 'fn-sorted', label: 'sorted', kind: 'function', detail: 'sorted(iterable, key=None, reverse=False)', documentation: 'Retourne une nouvelle liste triée.', insertText: 'sorted($CURSOR)' },
  { id: 'fn-isinstance', label: 'isinstance', kind: 'function', detail: 'isinstance(object, classinfo)', documentation: 'Vérifie si un objet est une instance de la classe.', insertText: 'isinstance($CURSOR, type)' },
  { id: 'fn-input', label: 'input', kind: 'function', detail: 'input(prompt) -> str', documentation: 'Lit une ligne saisie depuis l\'entrée utilisateur.', insertText: 'input("$CURSOR")' },

  // Dot-triggered Methods
  { id: 'm-append', label: 'append', kind: 'method', detail: 'list.append(object)', insertText: 'append($CURSOR)' },
  { id: 'm-extend', label: 'extend', kind: 'method', detail: 'list.extend(iterable)', insertText: 'extend($CURSOR)' },
  { id: 'm-pop', label: 'pop', kind: 'method', detail: 'list.pop([index]) -> item', insertText: 'pop()' },
  { id: 'm-keys', label: 'keys', kind: 'method', detail: 'dict.keys() -> dict_keys', insertText: 'keys()' },
  { id: 'm-values', label: 'values', kind: 'method', detail: 'dict.values() -> dict_values', insertText: 'values()' },
  { id: 'm-items', label: 'items', kind: 'method', detail: 'dict.items() -> dict_items', insertText: 'items()' },
  { id: 'm-get', label: 'get', kind: 'method', detail: 'dict.get(key, default=None)', insertText: 'get($CURSOR)' },
  { id: 'm-split', label: 'split', kind: 'method', detail: 'str.split(sep=None) -> list[str]', insertText: 'split($CURSOR)' },
  { id: 'm-strip', label: 'strip', kind: 'method', detail: 'str.strip([chars]) -> str', insertText: 'strip()' },
  { id: 'm-join', label: 'join', kind: 'method', detail: 'str.join(iterable) -> str', insertText: 'join($CURSOR)' },
  { id: 'm-replace', label: 'replace', kind: 'method', detail: 'str.replace(old, new) -> str', insertText: 'replace($CURSOR)' },
  { id: 'm-lower', label: 'lower', kind: 'method', detail: 'str.lower() -> str', insertText: 'lower()' },
  { id: 'm-upper', label: 'upper', kind: 'method', detail: 'str.upper() -> str', insertText: 'upper()' },
  { id: 'm-startswith', label: 'startswith', kind: 'method', detail: 'str.startswith(prefix) -> bool', insertText: 'startswith($CURSOR)' },
  { id: 'm-endswith', label: 'endswith', kind: 'method', detail: 'str.endswith(suffix) -> bool', insertText: 'endswith($CURSOR)' },

  // Decorators
  { id: 'annot-property', label: '@property', kind: 'annotation', detail: 'Décorateur accesseur de propriété', insertText: '@property\n' },
  { id: 'annot-staticmethod', label: '@staticmethod', kind: 'annotation', detail: 'Méthode statique de classe', insertText: '@staticmethod\n' },
  { id: 'annot-classmethod', label: '@classmethod', kind: 'annotation', detail: 'Méthode recevant la classe (cls)', insertText: '@classmethod\n' },
];

const PYTHON_KEYWORDS_SET = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'case', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
  'if', 'import', 'in', 'is', 'lambda', 'match', 'nonlocal', 'not', 'or',
  'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None'
]);

/**
 * Extracts declared variables, functions, and classes from Python source code
 * so that they immediately appear in the autocompletion menu.
 */
export function extractDeclaredSymbols(code: string): CompletionItem[] {
  if (!code || !code.trim()) return [];

  const symbols: CompletionItem[] = [];
  const seenLabels = new Set<string>();

  // Strip comments and strings to avoid false matches
  const cleanCode = code
    .replace(/#[^\r\n]*/g, '')
    .replace(/"""[\s\S]*?"""/g, '""')
    .replace(/'''[\s\S]*?'''/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""');

  // 1. Function declarations: def function_name(params):
  const funcRegex = /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = funcRegex.exec(cleanCode)) !== null) {
    const funcName = match[1];
    const rawParams = match[2];

    if (PYTHON_KEYWORDS_SET.has(funcName) || seenLabels.has(funcName)) continue;
    seenLabels.add(funcName);

    symbols.push({
      id: `declared-fn-${funcName}`,
      label: funcName,
      kind: 'function',
      detail: `def ${funcName}(${rawParams.trim()})`,
      documentation: `Fonction définie dans ce module Python.`,
      insertText: `${funcName}($CURSOR)`,
    });
  }

  // 2. Class declarations: class ClassName(Parents):
  const classRegex = /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\([^)]*\))?\s*:/g;
  while ((match = classRegex.exec(cleanCode)) !== null) {
    const className = match[1];

    if (PYTHON_KEYWORDS_SET.has(className) || seenLabels.has(className)) continue;
    seenLabels.add(className);

    symbols.push({
      id: `declared-class-${className}`,
      label: className,
      kind: 'type',
      detail: `class ${className}`,
      documentation: `Classe Python définie dans ce module.`,
      insertText: `${className}($CURSOR)`,
    });
  }

  // 3. Variable assignments:
  // e.g. door_locked = True
  // e.g. alarm_on = False
  // e.g. count: int = 0
  // e.g. for item in ...
  const varRegex = /^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*[a-zA-Z0-9_\[\], ]+)?\s*=/gm;
  while ((match = varRegex.exec(cleanCode)) !== null) {
    const varName = match[1];

    if (PYTHON_KEYWORDS_SET.has(varName) || seenLabels.has(varName)) continue;
    seenLabels.add(varName);

    symbols.push({
      id: `declared-var-${varName}`,
      label: varName,
      kind: 'variable',
      detail: `variable ${varName}`,
      documentation: `Variable définie dans le code.`,
      insertText: varName,
    });
  }

  // 4. For loop targets: for var_name in ...
  const forRegex = /\bfor\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\b/g;
  while ((match = forRegex.exec(cleanCode)) !== null) {
    const varName = match[1];
    if (PYTHON_KEYWORDS_SET.has(varName) || seenLabels.has(varName)) continue;
    seenLabels.add(varName);

    symbols.push({
      id: `declared-var-${varName}`,
      label: varName,
      kind: 'variable',
      detail: `variable ${varName}`,
      documentation: `Variable d'itération locale.`,
      insertText: varName,
    });
  }

  return symbols;
}

/**
 * Filter completions based on query, dot context, and current document code.
 */
export function getCompletionsForQuery(
  query: string,
  isAfterDot: boolean = false,
  code?: string
): CompletionItem[] {
  const cleanQuery = query.toLowerCase().trim();
  let candidates: CompletionItem[] = [];

  if (isAfterDot) {
    // If typing after a dot, prioritize methods
    candidates = PYTHON_COMPLETIONS.filter((c) => c.kind === 'method');
  } else {
    // Top-level candidates: user-declared symbols first, then built-in completions
    const declaredSymbols = code ? extractDeclaredSymbols(code) : [];
    const seen = new Set<string>();

    for (const sym of declaredSymbols) {
      candidates.push(sym);
      seen.add(sym.label);
    }

    for (const item of PYTHON_COMPLETIONS) {
      if (!seen.has(item.label)) {
        candidates.push(item);
      }
    }
  }

  if (!cleanQuery) {
    return candidates.slice(0, 12);
  }

  const filtered = candidates.filter((item) => {
    const labelMatch = item.label.toLowerCase().includes(cleanQuery);
    const detailMatch = item.detail.toLowerCase().includes(cleanQuery);
    return labelMatch || detailMatch;
  });

  // Sort: prefix match first, then prioritize user declared variables & functions
  filtered.sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(cleanQuery);
    const bStarts = b.label.toLowerCase().startsWith(cleanQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aIsUser = a.kind === 'variable' || a.id.startsWith('declared-');
    const bIsUser = b.kind === 'variable' || b.id.startsWith('declared-');
    if (aIsUser && !bIsUser) return -1;
    if (!aIsUser && bIsUser) return 1;

    return a.label.localeCompare(b.label);
  });

  return filtered.slice(0, 12);
}
