/**
 * Rust Intelligent Auto-Completion Engine.
 */

import { CompletionItem } from '../types';

export const RUST_STANDARD_COMPLETIONS: CompletionItem[] = [
  // Macros
  {
    id: 'rust-println',
    label: 'println!',
    kind: 'snippet',
    detail: 'println!("format", args...) — Affichage avec saut de ligne',
    insertText: 'println!("{}", $1);',
  },
  {
    id: 'rust-print',
    label: 'print!',
    kind: 'snippet',
    detail: 'print!("format", args...) — Affichage standard',
    insertText: 'print!("{}", $1);',
  },
  {
    id: 'rust-eprintln',
    label: 'eprintln!',
    kind: 'snippet',
    detail: 'eprintln!("error", ...) — Affichage sur stderr',
    insertText: 'eprintln!("{}", $1);',
  },
  {
    id: 'rust-format',
    label: 'format!',
    kind: 'snippet',
    detail: 'format!("...", args...) -> String',
    insertText: 'format!("{}", $1)',
  },
  {
    id: 'rust-vec-macro',
    label: 'vec!',
    kind: 'snippet',
    detail: 'vec![e1, e2, ...] — Création de vecteur sur le tas',
    insertText: 'vec![$1]',
  },

  // Skeletons
  {
    id: 'rust-main',
    label: 'main',
    kind: 'snippet',
    detail: 'Point d\'entrée standard fn main()',
    insertText: 'fn main() {\n    \n}',
  },
  {
    id: 'rust-fn',
    label: 'fn',
    kind: 'snippet',
    detail: 'Déclaration de fonction fn name(args) -> ReturnType',
    insertText: 'fn $1($2) -> $3 {\n    \n}',
  },
  {
    id: 'rust-struct',
    label: 'struct',
    kind: 'snippet',
    detail: 'Déclaration de structure struct Name { ... }',
    insertText: 'struct $1 {\n    id: u32,\n    name: String,\n}',
  },
  {
    id: 'rust-enum',
    label: 'enum',
    kind: 'snippet',
    detail: 'Déclaration d\'énumération enum Name { ... }',
    insertText: 'enum $1 {\n    Active,\n    Inactive,\n}',
  },
  {
    id: 'rust-impl',
    label: 'impl',
    kind: 'snippet',
    detail: 'Bloc d\'implémentation de méthodes impl Name { ... }',
    insertText: 'impl $1 {\n    fn new() -> Self {\n        Self {}\n    }\n}',
  },
  {
    id: 'rust-match',
    label: 'match',
    kind: 'snippet',
    detail: 'Pattern matching exhaustif match val { ... }',
    insertText: 'match $1 {\n    Some(val) => println!("{val}"),\n    None => (),\n}',
  },
  {
    id: 'rust-for-in',
    label: 'for in',
    kind: 'snippet',
    detail: 'Boucle for in itérateur',
    insertText: 'for item in $1 {\n    println!("{item}");\n}',
  },
  {
    id: 'rust-derive-debug',
    label: '#[derive(Debug)]',
    kind: 'snippet',
    detail: 'Génération automatique du trait Debug pour {:?}',
    insertText: '#[derive(Debug)]\n',
  },

  // Keywords & Modifiers
  { id: 'rust-let-mut', label: 'let mut', kind: 'keyword', detail: 'Variable locale mutable', insertText: 'let mut ' },
  { id: 'rust-let', label: 'let', kind: 'keyword', detail: 'Variable locale immuable', insertText: 'let ' },
  { id: 'rust-pub', label: 'pub', kind: 'keyword', detail: 'Modificateur de visibilité publique', insertText: 'pub ' },
  { id: 'rust-use-std', label: 'use std::', kind: 'snippet', detail: 'Import de la bibliothèque standard', insertText: 'use std::$1;\n' },
  { id: 'rust-return', label: 'return', kind: 'keyword', detail: 'Retour explicite', insertText: 'return ' },

  // Types
  { id: 'rust-t-string', label: 'String', kind: 'type', detail: 'Chaîne allouée sur le tas (UTF-8)', insertText: 'String' },
  { id: 'rust-t-str', label: '&str', kind: 'type', detail: 'Slice de chaîne immuable', insertText: '&str' },
  { id: 'rust-t-vec', label: 'Vec<T>', kind: 'type', detail: 'Tableau redimensionnable sur le tas', insertText: 'Vec<$1>' },
  { id: 'rust-t-opt', label: 'Option<T>', kind: 'type', detail: 'Type optionnel Some(v) | None', insertText: 'Option<$1>' },
  { id: 'rust-t-res', label: 'Result<T, E>', kind: 'type', detail: 'Type résultat Ok(v) | Err(e)', insertText: 'Result<$1, $2>' },
  { id: 'rust-t-i32', label: 'i32', kind: 'type', detail: 'Entier signé 32 bits standard', insertText: 'i32' },
  { id: 'rust-t-u32', label: 'u32', kind: 'type', detail: 'Entier non signé 32 bits', insertText: 'u32' },
  { id: 'rust-t-usize', label: 'usize', kind: 'type', detail: 'Taille mémoire / index de tableau', insertText: 'usize' },
  { id: 'rust-t-f64', label: 'f64', kind: 'type', detail: 'Flottant 64 bits double précision', insertText: 'f64' },
  { id: 'rust-t-bool', label: 'bool', kind: 'type', detail: 'Valeur booléenne true | false', insertText: 'bool' },
];

export function getRustCompletionsForQuery(query: string, currentCode: string = ''): CompletionItem[] {
  const q = query.toLowerCase().trim();
  const customItems: CompletionItem[] = [];
  const lines = currentCode.split('\n');

  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();

    // Match variables: let count = 0; or let mut val = ...;
    const letMatch = trimmed.match(/^let\s+(?:mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (letMatch && !RUST_STANDARD_COMPLETIONS.some((c) => c.label === letMatch[1])) {
      customItems.push({
        id: `rust-var-${letMatch[1]}-${idx}`,
        label: letMatch[1],
        kind: 'variable',
        detail: `Variable Rust locale`,
        insertText: letMatch[1],
      });
    }

    // Match functions: fn calculate_total(...)
    const fnMatch = trimmed.match(/^fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (fnMatch && fnMatch[1] !== 'main' && !RUST_STANDARD_COMPLETIONS.some((c) => c.label === fnMatch[1])) {
      customItems.push({
        id: `rust-fn-${fnMatch[1]}-${idx}`,
        label: fnMatch[1],
        kind: 'function',
        detail: `Fonction Rust locale`,
        insertText: `${fnMatch[1]}()`,
      });
    }

    // Match structs: struct Device {
    const structMatch = trimmed.match(/^struct\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (structMatch && !RUST_STANDARD_COMPLETIONS.some((c) => c.label === structMatch[1])) {
      customItems.push({
        id: `rust-struct-${structMatch[1]}-${idx}`,
        label: structMatch[1],
        kind: 'type',
        detail: `Structure Rust définie`,
        insertText: structMatch[1],
      });
    }
  }

  const all = [...RUST_STANDARD_COMPLETIONS, ...customItems];

  if (!q) {
    return all.slice(0, 12);
  }

  return all
    .filter((item) => item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q))
    .slice(0, 12);
}
