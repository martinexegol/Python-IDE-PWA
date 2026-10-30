/**
 * C Language (C99/C11) Syntax Tokenizer & Lexer.
 * Accurately tokenizes C source code for syntax highlighting.
 */

export interface Token {
  type:
    | 'keyword'
    | 'type'
    | 'string'
    | 'char'
    | 'number'
    | 'comment'
    | 'preprocessor'
    | 'function'
    | 'operator'
    | 'punctuation'
    | 'identifier'
    | 'default';
  value: string;
}

const C_KEYWORDS = new Set([
  'auto',
  'break',
  'case',
  'const',
  'continue',
  'default',
  'do',
  'else',
  'enum',
  'extern',
  'for',
  'goto',
  'if',
  'inline',
  'register',
  'restrict',
  'return',
  'sizeof',
  'static',
  'struct',
  'switch',
  'typedef',
  'union',
  'volatile',
  'while',
  '_Alignas',
  '_Alignof',
  '_Atomic',
  '_Bool',
  '_Generic',
  '_Noreturn',
  '_Static_assert',
  '_Thread_local',
]);

const C_TYPES = new Set([
  'void',
  'char',
  'short',
  'int',
  'long',
  'float',
  'double',
  'signed',
  'unsigned',
  'bool',
  'size_t',
  'ssize_t',
  'int8_t',
  'int16_t',
  'int32_t',
  'int64_t',
  'uint8_t',
  'uint16_t',
  'uint32_t',
  'uint64_t',
  'FILE',
  'NULL',
  'true',
  'false',
]);

export function tokenizeCLine(line: string, inBlockComment: boolean = false): { tokens: Token[]; inBlockComment: boolean } {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  if (inBlockComment) {
    const endIdx = line.indexOf('*/');
    if (endIdx === -1) {
      tokens.push({ type: 'comment', value: line });
      return { tokens, inBlockComment: true };
    } else {
      tokens.push({ type: 'comment', value: line.slice(0, endIdx + 2) });
      i = endIdx + 2;
      inBlockComment = false;
    }
  }

  while (i < len) {
    const ch = line[i];

    // 1. Whitespace
    if (ch === ' ' || ch === '\t') {
      let spaceStr = ch;
      i++;
      while (i < len && (line[i] === ' ' || line[i] === '\t')) {
        spaceStr += line[i];
        i++;
      }
      tokens.push({ type: 'default', value: spaceStr });
      continue;
    }

    // 2. Preprocessor directive (#include, #define, #ifdef, #endif)
    if (ch === '#') {
      let prepStr = '#';
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        prepStr += line[i];
        i++;
      }
      tokens.push({ type: 'preprocessor', value: prepStr });
      continue;
    }

    // 3. Line Comment //
    if (ch === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) });
      break;
    }

    // 4. Block Comment /*
    if (ch === '/' && line[i + 1] === '*') {
      const endIdx = line.indexOf('*/', i + 2);
      if (endIdx === -1) {
        tokens.push({ type: 'comment', value: line.slice(i) });
        return { tokens, inBlockComment: true };
      } else {
        tokens.push({ type: 'comment', value: line.slice(i, endIdx + 2) });
        i = endIdx + 2;
        continue;
      }
    }

    // 5. String literal "..."
    if (ch === '"') {
      let strVal = '"';
      i++;
      while (i < len) {
        if (line[i] === '\\' && i + 1 < len) {
          strVal += line[i] + line[i + 1];
          i += 2;
          continue;
        }
        if (line[i] === '"') {
          strVal += '"';
          i++;
          break;
        }
        strVal += line[i];
        i++;
      }
      tokens.push({ type: 'string', value: strVal });
      continue;
    }

    // 6. Character literal 'c'
    if (ch === "'") {
      let charVal = "'";
      i++;
      while (i < len) {
        if (line[i] === '\\' && i + 1 < len) {
          charVal += line[i] + line[i + 1];
          i += 2;
          continue;
        }
        if (line[i] === "'") {
          charVal += "'";
          i++;
          break;
        }
        charVal += line[i];
        i++;
      }
      tokens.push({ type: 'char', value: charVal });
      continue;
    }

    // 7. Numbers (0x hex, float, integer)
    if (/[0-9]/.test(ch)) {
      let numStr = ch;
      i++;
      while (i < len && /[0-9a-fA-FxX._fFlLuU]/.test(line[i])) {
        numStr += line[i];
        i++;
      }
      tokens.push({ type: 'number', value: numStr });
      continue;
    }

    // 8. Operators and arrows ->, ++, --, ==, !=, <=, >=, &&, ||
    const twoChars = line.slice(i, i + 2);
    if (
      twoChars === '->' ||
      twoChars === '++' ||
      twoChars === '--' ||
      twoChars === '==' ||
      twoChars === '!=' ||
      twoChars === '<=' ||
      twoChars === '>=' ||
      twoChars === '&&' ||
      twoChars === '||' ||
      twoChars === '+=' ||
      twoChars === '-=' ||
      twoChars === '*=' ||
      twoChars === '/='
    ) {
      tokens.push({ type: 'operator', value: twoChars });
      i += 2;
      continue;
    }

    if ('+-*/%<>=!&|^~'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i++;
      continue;
    }

    if (';,()[]{}.?:'.includes(ch)) {
      tokens.push({ type: 'punctuation', value: ch });
      i++;
      continue;
    }

    // 9. Identifiers, Keywords, Types & Function calls
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = ch;
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        ident += line[i];
        i++;
      }

      if (C_KEYWORDS.has(ident)) {
        tokens.push({ type: 'keyword', value: ident });
      } else if (C_TYPES.has(ident) || ident.endsWith('_t')) {
        tokens.push({ type: 'type', value: ident });
      } else {
        // Look ahead for function call: foo(...)
        let lookAhead = i;
        while (lookAhead < len && (line[lookAhead] === ' ' || line[lookAhead] === '\t')) {
          lookAhead++;
        }
        if (line[lookAhead] === '(') {
          tokens.push({ type: 'function', value: ident });
        } else {
          tokens.push({ type: 'identifier', value: ident });
        }
      }
      continue;
    }

    // Default fallback
    tokens.push({ type: 'default', value: ch });
    i++;
  }

  return { tokens, inBlockComment: false };
}
