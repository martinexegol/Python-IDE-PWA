/**
 * High-performance Lexical Tokenizer & Syntax Highlighter dedicated to Python.
 * Supports Python 3.12 syntax: keywords, f-strings, decorators, docstrings,
 * type annotations, operators, and built-ins.
 */

export type TokenType =
  | 'keyword'
  | 'type'
  | 'string'
  | 'interpolation'
  | 'number'
  | 'comment'
  | 'doc-comment'
  | 'function'
  | 'annotation'
  | 'operator'
  | 'punctuation'
  | 'constant'
  | 'variable'
  | 'default';

export interface Token {
  type: TokenType;
  value: string;
}

// Full set of Python 3.x keywords
const PYTHON_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'case',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'match',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'try',
  'while',
  'with',
  'yield',
]);

const PYTHON_CONSTANTS = new Set(['True', 'False', 'None', 'Ellipsis', '__debug__']);

// Standard Python Built-in Types and Typing primitives
const PYTHON_CORE_TYPES = new Set([
  'int',
  'float',
  'str',
  'bool',
  'list',
  'dict',
  'set',
  'tuple',
  'bytes',
  'bytearray',
  'memoryview',
  'complex',
  'frozenset',
  'object',
  'type',
  'Any',
  'Optional',
  'Union',
  'List',
  'Dict',
  'Set',
  'Tuple',
  'Iterable',
  'Iterator',
  'Callable',
  'Sequence',
  'Mapping',
  'Self',
]);

// Standard Python Built-in Functions
const PYTHON_BUILTIN_FUNCS = new Set([
  'print',
  'len',
  'range',
  'enumerate',
  'zip',
  'map',
  'filter',
  'sorted',
  'reversed',
  'sum',
  'min',
  'max',
  'abs',
  'round',
  'divmod',
  'pow',
  'all',
  'any',
  'isinstance',
  'issubclass',
  'hasattr',
  'getattr',
  'setattr',
  'delattr',
  'id',
  'hash',
  'dir',
  'repr',
  'open',
  'input',
  'super',
  'help',
  'format',
]);

/**
 * Tokenize a single line of Python code.
 * Preserves multi-line triple-quoted string / docstring state across lines.
 */
export function tokenizePythonLine(
  line: string,
  inDocString: string | null = null
): { tokens: Token[]; endedInDocString: string | null } {
  const tokens: Token[] = [];
  let i = 0;
  const n = line.length;
  let currentDocString = inDocString;

  while (i < n) {
    // 1. If currently inside a multi-line docstring (""" or ''')
    if (currentDocString) {
      const endIdx = line.indexOf(currentDocString, i);
      if (endIdx === -1) {
        tokens.push({ type: 'doc-comment', value: line.slice(i) });
        return { tokens, endedInDocString: currentDocString };
      } else {
        tokens.push({
          type: 'doc-comment',
          value: line.slice(i, endIdx + currentDocString.length),
        });
        i = endIdx + currentDocString.length;
        currentDocString = null;
        continue;
      }
    }

    // 2. Comments (# to end of line)
    if (line[i] === '#') {
      tokens.push({
        type: 'comment',
        value: line.slice(i),
      });
      return { tokens, endedInDocString: null };
    }

    // 3. Whitespace
    if (/\s/.test(line[i])) {
      let space = '';
      while (i < n && /\s/.test(line[i])) {
        space += line[i];
        i++;
      }
      tokens.push({ type: 'default', value: space });
      continue;
    }

    // 4. Decorators (@staticmethod, @property, @dataclass, etc.)
    if (line[i] === '@') {
      let annot = '@';
      i++;
      while (i < n && /[a-zA-Z0-9_\.]/.test(line[i])) {
        annot += line[i];
        i++;
      }
      tokens.push({ type: 'annotation', value: annot });
      continue;
    }

    // 5. String Literals (f"", r"", b"", u"", fr"", and normal "", '')
    // Detect optional string prefixes: f, r, b, u, fr, rf
    let prefix = '';
    let pIdx = i;
    while (pIdx < n && /[frbuFRBU]/.test(line[pIdx])) {
      prefix += line[pIdx].toLowerCase();
      pIdx++;
    }

    if (pIdx < n && (line[pIdx] === "'" || line[pIdx] === '"')) {
      const isFString = prefix.includes('f');
      const quoteChar = line[pIdx];
      const isTriple = line.slice(pIdx, pIdx + 3) === quoteChar.repeat(3);
      const delim = isTriple ? quoteChar.repeat(3) : quoteChar;

      // Include prefix in token
      let startIdx = i;
      i = pIdx + delim.length;

      if (isTriple) {
        // Multi-line triple quotes
        const endIdx = line.indexOf(delim, i);
        if (endIdx === -1) {
          // Open docstring continues to next lines
          tokens.push({
            type: 'doc-comment',
            value: line.slice(startIdx),
          });
          return { tokens, endedInDocString: delim };
        } else {
          tokens.push({
            type: 'doc-comment',
            value: line.slice(startIdx, endIdx + delim.length),
          });
          i = endIdx + delim.length;
          continue;
        }
      }

      // Single-line string
      if (prefix) {
        tokens.push({ type: 'keyword', value: prefix });
      }

      tokens.push({ type: 'string', value: quoteChar });

      // Parse string content
      let content = '';
      while (i < n) {
        if (line[i] === '\\' && i + 1 < n) {
          content += line[i] + line[i + 1];
          i += 2;
          continue;
        }

        if (line[i] === quoteChar) {
          if (content) {
            tokens.push({ type: 'string', value: content });
            content = '';
          }
          tokens.push({ type: 'string', value: quoteChar });
          i++;
          break;
        }

        // f-string interpolation: {expression}
        if (isFString && line[i] === '{' && line[i + 1] !== '{') {
          if (content) {
            tokens.push({ type: 'string', value: content });
            content = '';
          }

          // Parse inside { ... }
          tokens.push({ type: 'interpolation', value: '{' });
          i++;
          let expr = '';
          let braceDepth = 1;
          while (i < n && braceDepth > 0) {
            if (line[i] === '{') braceDepth++;
            else if (line[i] === '}') braceDepth--;
            if (braceDepth === 0) {
              if (expr) tokens.push({ type: 'variable', value: expr });
              tokens.push({ type: 'interpolation', value: '}' });
              i++;
              break;
            } else {
              expr += line[i];
              i++;
            }
          }
          continue;
        }

        content += line[i];
        i++;
      }

      if (content) {
        tokens.push({ type: 'string', value: content });
      }
      continue;
    }

    // 6. Numeric Literals (Hex 0x, Binary 0b, Float 3.14, Exp 1e-5, Int 42)
    if (/[0-9]/.test(line[i])) {
      let num = '';
      if (line[i] === '0' && i + 1 < n && /[xXbBoO]/.test(line[i + 1])) {
        num += line.slice(i, i + 2);
        i += 2;
        while (i < n && /[0-9a-fA-F_]/.test(line[i])) {
          num += line[i];
          i++;
        }
      } else {
        while (i < n && /[0-9_]/.test(line[i])) {
          num += line[i];
          i++;
        }
        if (i < n && line[i] === '.' && i + 1 < n && /[0-9]/.test(line[i + 1])) {
          num += '.';
          i++;
          while (i < n && /[0-9_]/.test(line[i])) {
            num += line[i];
            i++;
          }
        }
        if (i < n && /[eE]/.test(line[i])) {
          num += line[i];
          i++;
          if (i < n && /[+-]/.test(line[i])) {
            num += line[i];
            i++;
          }
          while (i < n && /[0-9_]/.test(line[i])) {
            num += line[i];
            i++;
          }
        }
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 7. Operators & Delimiters
    // Multi-char operators: ==, !=, <=, >=, //, **, ->, :=, +=, -=, *=, /=
    const twoChars = line.slice(i, i + 2);
    if (['==', '!=', '<=', '>=', '//', '**', '->', ':=', '+=', '-=', '*=', '/='].includes(twoChars)) {
      tokens.push({ type: 'operator', value: twoChars });
      i += 2;
      continue;
    }

    if (['+', '-', '*', '/', '%', '=', '<', '>', '&', '|', '^', '~'].includes(line[i])) {
      tokens.push({ type: 'operator', value: line[i] });
      i++;
      continue;
    }

    // Punctuation
    if (['(', ')', '[', ']', '{', '}', ':', ',', '.', ';'].includes(line[i])) {
      tokens.push({ type: 'punctuation', value: line[i] });
      i++;
      continue;
    }

    // 8. Identifiers (Keywords, Functions, Types, Variables)
    if (/[a-zA-Z_]/.test(line[i])) {
      let id = '';
      while (i < n && /[a-zA-Z0-9_]/.test(line[i])) {
        id += line[i];
        i++;
      }

      if (PYTHON_KEYWORDS.has(id)) {
        tokens.push({ type: 'keyword', value: id });
      } else if (PYTHON_CONSTANTS.has(id)) {
        tokens.push({ type: 'constant', value: id });
      } else if (PYTHON_CORE_TYPES.has(id)) {
        tokens.push({ type: 'type', value: id });
      } else if (PYTHON_BUILTIN_FUNCS.has(id)) {
        tokens.push({ type: 'function', value: id });
      } else if (id === 'self' || id === 'cls') {
        tokens.push({ type: 'constant', value: id });
      } else {
        // Check if followed by '(' to color as function call/definition
        let nextNonSpace = i;
        while (nextNonSpace < n && /\s/.test(line[nextNonSpace])) nextNonSpace++;
        if (nextNonSpace < n && line[nextNonSpace] === '(') {
          tokens.push({ type: 'function', value: id });
        } else {
          tokens.push({ type: 'variable', value: id });
        }
      }
      continue;
    }

    // Fallback default character
    tokens.push({ type: 'default', value: line[i] });
    i++;
  }

  return { tokens, endedInDocString: currentDocString };
}
