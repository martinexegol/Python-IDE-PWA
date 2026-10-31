/**
 * Zig Language (0.13.0+) Syntax Tokenizer & Lexer.
 * Tokenizes Zig source code for real-time syntax highlighting.
 */

export interface Token {
  type:
    | 'keyword'
    | 'type'
    | 'string'
    | 'char'
    | 'number'
    | 'comment'
    | 'docComment'
    | 'builtin'
    | 'function'
    | 'operator'
    | 'punctuation'
    | 'identifier'
    | 'default';
  value: string;
}

const ZIG_KEYWORDS = new Set([
  'addrspace',
  'align',
  'allowzero',
  'and',
  'anyerror',
  'anyframe',
  'anytype',
  'asm',
  'async',
  'await',
  'break',
  'callconv',
  'catch',
  'comptime',
  'const',
  'continue',
  'defer',
  'else',
  'enum',
  'errdefer',
  'error',
  'export',
  'extern',
  'fn',
  'for',
  'if',
  'inline',
  'linksection',
  'noalias',
  'noinline',
  'nosuspend',
  'opaque',
  'or',
  'orelse',
  'packed',
  'pub',
  'resume',
  'return',
  'struct',
  'suspend',
  'switch',
  'test',
  'threadlocal',
  'try',
  'union',
  'unreachable',
  'usingnamespace',
  'var',
  'volatile',
  'while',
]);

const ZIG_TYPES = new Set([
  'bool',
  'void',
  'noreturn',
  'type',
  'anyerror',
  'c_char',
  'c_short',
  'c_ushort',
  'c_int',
  'c_uint',
  'c_long',
  'c_ulong',
  'c_longlong',
  'c_ulonglong',
  'c_longdouble',
  'f16',
  'f32',
  'f64',
  'f80',
  'f128',
  'i8',
  'u8',
  'i16',
  'u16',
  'i32',
  'u32',
  'i64',
  'u64',
  'i128',
  'u128',
  'isize',
  'usize',
  'null',
  'undefined',
  'true',
  'false',
]);

export function tokenizeZigLine(line: string): { tokens: Token[] } {
  const tokens: Token[] = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    const ch = line[i];

    // 1. Whitespace
    if (/\s/.test(ch)) {
      let space = '';
      while (i < len && /\s/.test(line[i])) {
        space += line[i];
        i++;
      }
      tokens.push({ type: 'default', value: space });
      continue;
    }

    // 2. Comments (/// doc comment or // regular comment or \\ multi-line string)
    if (ch === '/' && line[i + 1] === '/') {
      const isDoc = line[i + 2] === '/' || line[i + 2] === '!';
      const commentText = line.slice(i);
      tokens.push({ type: isDoc ? 'docComment' : 'comment', value: commentText });
      break;
    }

    // Multi-line string in Zig: starts with \\
    if (ch === '\\' && line[i + 1] === '\\') {
      const strText = line.slice(i);
      tokens.push({ type: 'string', value: strText });
      break;
    }

    // 3. String literals "..."
    if (ch === '"') {
      let str = '"';
      i++;
      while (i < len) {
        if (line[i] === '\\' && i + 1 < len) {
          str += line[i] + line[i + 1];
          i += 2;
          continue;
        }
        str += line[i];
        if (line[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // 4. Character literals '.'
    if (ch === "'") {
      let charVal = "'";
      i++;
      while (i < len) {
        if (line[i] === '\\' && i + 1 < len) {
          charVal += line[i] + line[i + 1];
          i += 2;
          continue;
        }
        charVal += line[i];
        if (line[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      tokens.push({ type: 'char', value: charVal });
      continue;
    }

    // 5. Zig Built-in functions: @import, @as, @sizeOf, etc.
    if (ch === '@' && i + 1 < len && /[a-zA-Z_]/.test(line[i + 1])) {
      let builtin = '@';
      i++;
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        builtin += line[i];
        i++;
      }
      tokens.push({ type: 'builtin', value: builtin });
      continue;
    }

    // 6. Numbers: decimal, hex (0x..), binary (0b..), float
    if (/[0-9]/.test(ch)) {
      let num = '';
      if (ch === '0' && (line[i + 1] === 'x' || line[i + 1] === 'X')) {
        num += line[i] + line[i + 1];
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(line[i])) {
          num += line[i];
          i++;
        }
      } else if (ch === '0' && (line[i + 1] === 'b' || line[i + 1] === 'B')) {
        num += line[i] + line[i + 1];
        i += 2;
        while (i < len && /[01_]/.test(line[i])) {
          num += line[i];
          i++;
        }
      } else {
        while (i < len && /[0-9_]/.test(line[i])) {
          num += line[i];
          i++;
        }
        if (i < len && line[i] === '.' && line[i + 1] !== '.' && /[0-9]/.test(line[i + 1] || '')) {
          num += line[i];
          i++;
          while (i < len && /[0-9_]/.test(line[i])) {
            num += line[i];
            i++;
          }
        }
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 7. Identifiers, Keywords, Types, Functions
    if (/[a-zA-Z_]/.test(ch)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_]/.test(line[i])) {
        word += line[i];
        i++;
      }

      // Check if followed by '(' (likely a function call or declaration)
      let nextNonSpace = i;
      while (nextNonSpace < len && /\s/.test(line[nextNonSpace])) {
        nextNonSpace++;
      }
      const isFunction = line[nextNonSpace] === '(';

      if (ZIG_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (ZIG_TYPES.has(word)) {
        tokens.push({ type: 'type', value: word });
      } else if (isFunction) {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'identifier', value: word });
      }
      continue;
    }

    // 8. Operators: ! (error union), ? (optional), ==, !=, <=, >=, =>, ++, .., ..., +=, -=, etc.
    const twoChars = line.slice(i, i + 2);
    const threeChars = line.slice(i, i + 3);

    if (threeChars === '...' || threeChars === '<<=' || threeChars === '>>=') {
      tokens.push({ type: 'operator', value: threeChars });
      i += 3;
      continue;
    }

    if (
      twoChars === '==' ||
      twoChars === '!=' ||
      twoChars === '<=' ||
      twoChars === '>=' ||
      twoChars === '=>' ||
      twoChars === '+=' ||
      twoChars === '-=' ||
      twoChars === '*=' ||
      twoChars === '/=' ||
      twoChars === '||' ||
      twoChars === '++' ||
      twoChars === '..' ||
      twoChars === '.*' ||
      twoChars === '.?'
    ) {
      tokens.push({ type: 'operator', value: twoChars });
      i += 2;
      continue;
    }

    if ('+-*/%=<>!&|^~?:.'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i++;
      continue;
    }

    // 9. Punctuation: ;, ,, (, ), {, }, [, ]
    if (';,(){}'.includes(ch) || ch === '[' || ch === ']') {
      tokens.push({ type: 'punctuation', value: ch });
      i++;
      continue;
    }

    tokens.push({ type: 'default', value: ch });
    i++;
  }

  return { tokens };
}
