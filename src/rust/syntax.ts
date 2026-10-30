/**
 * Rust Language (Rust 2021 edition) Syntax Tokenizer & Lexer.
 */

import { Token } from '../c/syntax';

const RUST_KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'break',
  'const',
  'continue',
  'crate',
  'dyn',
  'else',
  'enum',
  'extern',
  'false',
  'fn',
  'for',
  'if',
  'impl',
  'in',
  'let',
  'loop',
  'match',
  'mod',
  'move',
  'mut',
  'pub',
  'ref',
  'return',
  'self',
  'Self',
  'static',
  'struct',
  'super',
  'trait',
  'true',
  'type',
  'unsafe',
  'use',
  'where',
  'while',
]);

const RUST_TYPES = new Set([
  'i8',
  'i16',
  'i32',
  'i64',
  'i128',
  'isize',
  'u8',
  'u16',
  'u32',
  'u64',
  'u128',
  'usize',
  'f32',
  'f64',
  'bool',
  'char',
  'str',
  'String',
  'Vec',
  'Option',
  'Some',
  'None',
  'Result',
  'Ok',
  'Err',
  'Box',
  'Rc',
  'Arc',
  'HashMap',
  'HashSet',
]);

export function tokenizeRustLine(line: string, inBlockComment: boolean = false): { tokens: Token[]; inBlockComment: boolean } {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (inBlockComment) {
      const endComment = line.indexOf('*/', i);
      if (endComment === -1) {
        tokens.push({ type: 'comment', value: line.slice(i) });
        return { tokens, inBlockComment: true };
      } else {
        tokens.push({ type: 'comment', value: line.slice(i, endComment + 2) });
        i = endComment + 2;
        inBlockComment = false;
        continue;
      }
    }

    // Line comments (including doc comments ///)
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // Block comment open
    if (line[i] === '/' && line[i + 1] === '*') {
      const endComment = line.indexOf('*/', i + 2);
      if (endComment === -1) {
        tokens.push({ type: 'comment', value: line.slice(i) });
        return { tokens, inBlockComment: true };
      } else {
        tokens.push({ type: 'comment', value: line.slice(i, endComment + 2) });
        i = endComment + 2;
        continue;
      }
    }

    // Attributes / Derives #[...] or #![...]
    if (line[i] === '#' && (line[i + 1] === '[' || (line[i + 1] === '!' && line[i + 2] === '['))) {
      let closeIdx = line.indexOf(']', i);
      if (closeIdx === -1) closeIdx = len - 1;
      tokens.push({ type: 'preprocessor', value: line.slice(i, closeIdx + 1) });
      i = closeIdx + 1;
      continue;
    }

    // String literals "..."
    if (line[i] === '"') {
      let s = '"';
      i++;
      let escaped = false;
      while (i < len) {
        const c = line[i];
        s += c;
        if (escaped) {
          escaped = false;
        } else if (c === '\\') {
          escaped = true;
        } else if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', value: s });
      continue;
    }

    // Character literals 'a' or Lifetimes 'a / 'static
    if (line[i] === "'") {
      let j = i + 1;
      if (j < len && (line[j] === '\\' || line[j + 1] === "'")) {
        // character literal
        let charVal = "'";
        i++;
        while (i < len) {
          charVal += line[i];
          if (line[i] === "'") {
            i++;
            break;
          }
          i++;
        }
        tokens.push({ type: 'char', value: charVal });
        continue;
      } else {
        // Lifetime like 'a or 'static
        let lifetime = "'";
        i++;
        while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
          lifetime += line[i];
          i++;
        }
        tokens.push({ type: 'type', value: lifetime });
        continue;
      }
    }

    // Numbers
    if (/[0-9]/.test(line[i])) {
      let num = '';
      if (line[i] === '0' && (line[i + 1] === 'x' || line[i + 1] === 'X' || line[i + 1] === 'b' || line[i + 1] === 'o')) {
        num += line.slice(i, i + 2);
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(line[i])) {
          num += line[i];
          i++;
        }
      } else {
        while (i < len && /[0-9._fui]/.test(line[i])) {
          num += line[i];
          i++;
        }
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Identifiers, Keywords, Types, Macros
    if (/[a-zA-Z_]/.test(line[i])) {
      let ident = '';
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        ident += line[i];
        i++;
      }

      // Check if followed by ! -> macro (e.g. println!, vec!)
      if (i < len && line[i] === '!') {
        ident += '!';
        i++;
        tokens.push({ type: 'preprocessor', value: ident });
        continue;
      }

      // Check if followed by ( -> function call or definition
      let peek = i;
      while (peek < len && /\s/.test(line[peek])) peek++;
      const isFnCall = peek < len && line[peek] === '(';

      if (RUST_KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident });
      } else if (RUST_TYPES.has(ident)) {
        tokens.push({ type: 'type', value: ident });
      } else if (isFnCall) {
        tokens.push({ type: 'function', value: ident });
      } else if (/^[A-Z]/.test(ident)) {
        tokens.push({ type: 'type', value: ident });
      } else {
        tokens.push({ type: 'identifier', value: ident });
      }
      continue;
    }

    // Operators and Punctuation
    const twoChars = line.slice(i, i + 2);
    const threeChars = line.slice(i, i + 3);

    if (threeChars === '..=') {
      tokens.push({ type: 'operator', value: threeChars });
      i += 3;
      continue;
    }

    if (
      ['::', '->', '=>', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '==', '!=', '<=', '>=', '&&', '||', '..'].includes(
        twoChars
      )
    ) {
      tokens.push({ type: 'operator', value: twoChars });
      i += 2;
      continue;
    }

    if ('+-*/%^=<>!&|?~'.includes(line[i])) {
      tokens.push({ type: 'operator', value: line[i] });
      i++;
      continue;
    }

    if (';,:()[]{}.'.includes(line[i])) {
      tokens.push({ type: 'punctuation', value: line[i] });
      i++;
      continue;
    }

    // Whitespace or other
    tokens.push({ type: 'default', value: line[i] });
    i++;
  }

  return { tokens, inBlockComment };
}
