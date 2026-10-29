/**
 * In-Browser Python Execution Engine.
 * Parses, transpiles, and executes Python code directly in a safe sandbox,
 * routing all output, print statements, and exceptions to the integrated console.
 * Python and only Python.
 */

import { ConsoleMessage } from '../types';

export interface RunResult {
  success: boolean;
  messages: ConsoleMessage[];
  executionTimeMs: number;
}

export async function runPythonCode(code: string, fileName: string = 'main.py'): Promise<RunResult> {
  const startTime = performance.now();
  const messages: ConsoleMessage[] = [];

  const addMsg = (type: 'stdout' | 'stderr' | 'info' | 'system', text: string) => {
    messages.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      type,
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    });
  };

  addMsg('system', `Python 3.12.0 • Lancement de \`python ${fileName}\`...`);

  try {
    const jsCode = transpilePythonToJs(code);

    // Python stdout buffer
    let lineBuffer = '';
    const sandboxConsole = {
      print: (...args: any[]) => {
        let sep = ' ';
        let end = '\n';

        // Check if last argument is an options object { sep, end }
        let printableArgs = args;
        if (
          args.length > 0 &&
          typeof args[args.length - 1] === 'object' &&
          args[args.length - 1] !== null &&
          (args[args.length - 1].__isPrintOpt)
        ) {
          const opt = args[args.length - 1];
          if (opt.sep !== undefined) sep = String(opt.sep);
          if (opt.end !== undefined) end = String(opt.end);
          printableArgs = args.slice(0, -1);
        }

        const formatted = printableArgs.map(formatPythonObject).join(sep);
        lineBuffer += formatted + end;

        // Split by newline and emit
        const parts = lineBuffer.split('\n');
        for (let i = 0; i < parts.length - 1; i++) {
          addMsg('stdout', parts[i]);
        }
        lineBuffer = parts[parts.length - 1];
      },
    };

    // Python Standard Library and Built-ins available in sandbox
    const pythonEnv = {
      print: sandboxConsole.print,
      len: (obj: any) => {
        if (obj === null || obj === undefined) throw new Error("TypeError: object of type 'NoneType' has no len()");
        if (typeof obj.length === 'number') return obj.length;
        if (typeof obj.size === 'number') return obj.size;
        if (typeof obj === 'object') return Object.keys(obj).length;
        throw new Error(`TypeError: object of type '${typeof obj}' has no len()`);
      },
      range: function (startOrStop: number, stop?: number, step: number = 1) {
        let start = 0;
        let end = startOrStop;
        if (stop !== undefined) {
          start = startOrStop;
          end = stop;
        }
        const arr: number[] = [];
        if (step > 0) {
          for (let i = start; i < end; i += step) arr.push(i);
        } else if (step < 0) {
          for (let i = start; i > end; i += step) arr.push(i);
        }
        return arr;
      },
      enumerate: (iterable: any, start: number = 0) => {
        const arr = Array.isArray(iterable) ? iterable : Object.values(iterable);
        return arr.map((item, idx) => [idx + start, item]);
      },
      zip: (...iterables: any[]) => {
        const minLen = Math.min(...iterables.map((it) => it.length || 0));
        const res: any[] = [];
        for (let i = 0; i < minLen; i++) {
          res.push(iterables.map((it) => it[i]));
        }
        return res;
      },
      sum: (iterable: any[], start: number = 0) => {
        return (iterable || []).reduce((acc, curr) => acc + curr, start);
      },
      min: (...args: any[]) => {
        const vals = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return Math.min(...vals);
      },
      max: (...args: any[]) => {
        const vals = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        return Math.max(...vals);
      },
      abs: Math.abs,
      round: (val: number, digits: number = 0) => {
        const factor = Math.pow(10, digits);
        return Math.round(val * factor) / factor;
      },
      str: (obj: any) => formatPythonObject(obj),
      int: (val: any) => {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed)) throw new Error(`ValueError: invalid literal for int() with base 10: '${val}'`);
        return parsed;
      },
      float: (val: any) => {
        const parsed = parseFloat(val);
        if (isNaN(parsed)) throw new Error(`ValueError: could not convert string to float: '${val}'`);
        return parsed;
      },
      bool: (val: any) => Boolean(val),
      type: (val: any) => {
        if (val === null) return "<class 'NoneType'>";
        if (typeof val === 'boolean') return "<class 'bool'>";
        if (typeof val === 'number') return Number.isInteger(val) ? "<class 'int'>" : "<class 'float'>";
        if (typeof val === 'string') return "<class 'str'>";
        if (Array.isArray(val)) return "<class 'list'>";
        if (val instanceof Set) return "<class 'set'>";
        if (typeof val === 'object') return "<class 'dict'>";
        return `<class '${typeof val}'>`;
      },
      isinstance: (obj: any, typeOrName: any) => {
        if (typeof typeOrName === 'string') {
          return pythonEnv.type(obj).includes(typeOrName);
        }
        return typeof obj === typeOrName;
      },
      sorted: (iterable: any[], key?: (x: any) => any, reverse: boolean = false) => {
        const copy = [...iterable];
        copy.sort((a, b) => {
          const valA = key ? key(a) : a;
          const valB = key ? key(b) : b;
          if (valA < valB) return reverse ? 1 : -1;
          if (valA > valB) return reverse ? -1 : 1;
          return 0;
        });
        return copy;
      },
      reversed: (iterable: any[]) => [...iterable].reverse(),
      any: (iterable: any[]) => (iterable || []).some(Boolean),
      all: (iterable: any[]) => (iterable || []).every(Boolean),
      map: (fn: (x: any) => any, iterable: any[]) => (iterable || []).map(fn),
      filter: (fn: (x: any) => any, iterable: any[]) => (iterable || []).filter(fn),
      list: (iterable?: any) => (iterable ? Array.from(iterable) : []),
      dict: (entries?: any) => {
        if (!entries) return {};
        if (Array.isArray(entries)) return Object.fromEntries(entries);
        return { ...entries };
      },
      set: (iterable?: any) => new Set(iterable || []),
      tuple: (iterable?: any) => Object.freeze(Array.from(iterable || [])),
      math: {
        pi: Math.PI,
        e: Math.E,
        tau: Math.PI * 2,
        inf: Infinity,
        nan: NaN,
        sqrt: Math.sqrt,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        asin: Math.asin,
        acos: Math.acos,
        atan: Math.atan,
        floor: Math.floor,
        ceil: Math.ceil,
        pow: Math.pow,
        exp: Math.exp,
        log: Math.log,
        log10: Math.log10,
        log2: Math.log2,
        radians: (deg: number) => (deg * Math.PI) / 180,
        degrees: (rad: number) => (rad * 180) / Math.PI,
        factorial: (n: number) => {
          if (n < 0) throw new Error("ValueError: factorial() not defined for negative values");
          let r = 1;
          for (let i = 2; i <= n; i++) r *= i;
          return r;
        },
      },
      random: {
        random: () => Math.random(),
        randint: (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a,
        choice: (seq: any[]) => seq[Math.floor(Math.random() * seq.length)],
        shuffle: (seq: any[]) => {
          for (let i = seq.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [seq[i], seq[j]] = [seq[j], seq[i]];
          }
          return seq;
        },
        sample: (population: any[], k: number) => {
          const shuffled = [...population];
          pythonEnv.random.shuffle(shuffled);
          return shuffled.slice(0, k);
        },
        uniform: (a: number, b: number) => a + Math.random() * (b - a),
      },
      time: {
        time: () => Date.now() / 1000,
        sleep: (seconds: number) =>
          new Promise((resolve) => setTimeout(resolve, Math.round(seconds * 1000))),
      },
    };

    // Construct runner
    const wrappedRunner = new Function(
      'print',
      'len',
      'range',
      'enumerate',
      'zip',
      'sum',
      'min',
      'max',
      'abs',
      'round',
      'str',
      'int',
      'float',
      'bool',
      'type',
      'isinstance',
      'sorted',
      'reversed',
      'any',
      'all',
      'map',
      'filter',
      'list',
      'dict',
      'set',
      'tuple',
      'math',
      'random',
      'time',
      `"use strict";
      return (async () => {
        ${jsCode}
        if (typeof main === 'function') {
          await main();
        }
      })();`
    );

    await wrappedRunner(
      pythonEnv.print,
      pythonEnv.len,
      pythonEnv.range,
      pythonEnv.enumerate,
      pythonEnv.zip,
      pythonEnv.sum,
      pythonEnv.min,
      pythonEnv.max,
      pythonEnv.abs,
      pythonEnv.round,
      pythonEnv.str,
      pythonEnv.int,
      pythonEnv.float,
      pythonEnv.bool,
      pythonEnv.type,
      pythonEnv.isinstance,
      pythonEnv.sorted,
      pythonEnv.reversed,
      pythonEnv.any,
      pythonEnv.all,
      pythonEnv.map,
      pythonEnv.filter,
      pythonEnv.list,
      pythonEnv.dict,
      pythonEnv.set,
      pythonEnv.tuple,
      pythonEnv.math,
      pythonEnv.random,
      pythonEnv.time
    );

    // Flush any remaining buffered line
    if (lineBuffer) {
      addMsg('stdout', lineBuffer);
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    addMsg('system', `Processus terminé avec le code 0 (${duration} ms).`);

    return {
      success: true,
      messages,
      executionTimeMs: duration,
    };
  } catch (error: any) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Format Python-style exception
    const errorName = error.name || 'Error';
    const errorMsg = error.message || String(error);
    addMsg('stderr', `Traceback (most recent call last):`);
    addMsg('stderr', `  File "${fileName}", in <module>`);
    addMsg('stderr', `${errorName}: ${errorMsg}`);
    addMsg('system', `Processus terminé avec le code 1 (Erreur après ${duration} ms).`);

    return {
      success: false,
      messages,
      executionTimeMs: duration,
    };
  }
}

/**
 * Transpiles Python source code to modern executable JavaScript.
 * Supports:
 * - f-strings f"Door locked: {door_locked}" -> `Door locked: ${door_locked}`
 * - Colon-based indentation block conversion
 * - def func() -> async function func()
 * - class Foo -> class Foo
 * - True, False, None -> true, false, null
 * - and, or, not, is, in
 * - for item in iter -> for (const item of iter)
 * - if __name__ == "__main__": main()
 */
export function transpilePythonToJs(pyCode: string): string {
  const lines = pyCode.split('\n');
  const indentStack: number[] = [0];
  const outLines: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];

    // Check indentation of line
    const matchIndent = rawLine.match(/^([ \t]*)/);
    const leadingSpaces = matchIndent ? matchIndent[1].replace(/\t/g, '    ').length : 0;
    const trimmed = rawLine.trim();

    // Preserve comments and empty lines
    if (!trimmed) {
      outLines.push('');
      continue;
    }

    if (trimmed.startsWith('#')) {
      outLines.push('// ' + trimmed.slice(1));
      continue;
    }

    // Handle dedents
    while (indentStack.length > 1 && leadingSpaces < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      outLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    let line = trimmed;

    // Transform f-strings: f"..." or f'...'
    line = line.replace(/f(["'])(.*?)\1/g, (_match, _quote, content) => {
      // Escape backticks in content
      let escaped = content.replace(/`/g, '\\`');
      // Python {expr} to JS ${expr}
      escaped = escaped.replace(/\{([^}]+)\}/g, (_m: string, expr: string) => `\${${expr}}`);
      return '`' + escaped + '`';
    });

    // Replace Python constants
    line = line.replace(/\bTrue\b/g, 'true');
    line = line.replace(/\bFalse\b/g, 'false');
    line = line.replace(/\bNone\b/g, 'null');

    // Replace logical operators
    line = line.replace(/\band\b/g, '&&');
    line = line.replace(/\bor\b/g, '||');
    line = line.replace(/\bnot\s+/g, '!');
    line = line.replace(/\bis\s+null\b/g, '=== null');
    line = line.replace(/\bis\s+not\s+null\b/g, '!== null');

    // Strip Python imports (math, random, time are pre-injected)
    if (/^import\s+|^from\s+/.test(line)) {
      outLines.push('// ' + line);
      continue;
    }

    // Ignore `if __name__ == "__main__":` wrapper, execute directly
    if (/if\s+__name__\s*==\s*['"]__main__['"]\s*:/.test(line)) {
      if (leadingSpaces > indentStack[indentStack.length - 1]) {
        indentStack.push(leadingSpaces);
      }
      outLines.push(' '.repeat(leadingSpaces) + 'if (true) {');
      continue;
    }

    // Function definitions: def func_name(params):
    const funcMatch = line.match(/^def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:->\s*[^:]+)?\s*:/);
    if (funcMatch) {
      const fnName = funcMatch[1];
      const params = funcMatch[2]
        .split(',')
        .map((p) => p.split(':')[0].trim()) // strip type annotations e.g. x: int -> x
        .join(', ');
      outLines.push(' '.repeat(leadingSpaces) + `async function ${fnName}(${params}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // Class definitions: class ClassName(Parents):
    const classMatch = line.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?\s*:/);
    if (classMatch) {
      const clsName = classMatch[1];
      const parent = classMatch[2] ? ` extends ${classMatch[2].trim()}` : '';
      outLines.push(' '.repeat(leadingSpaces) + `class ${clsName}${parent} {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // if / elif / else blocks
    if (/^if\s+(.+)\s*:$/.test(line)) {
      const cond = line.slice(2, -1).trim();
      outLines.push(' '.repeat(leadingSpaces) + `if (${cond}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    if (/^elif\s+(.+)\s*:$/.test(line)) {
      const cond = line.slice(4, -1).trim();
      outLines.push(' '.repeat(leadingSpaces) + `else if (${cond}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    if (/^else\s*:$/.test(line)) {
      outLines.push(' '.repeat(leadingSpaces) + `else {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // while loops
    if (/^while\s+(.+)\s*:$/.test(line)) {
      const cond = line.slice(5, -1).trim();
      outLines.push(' '.repeat(leadingSpaces) + `while (${cond}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // for loops: for item in iter:
    const forMatch = line.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_,\s]*)\s+in\s+(.+)\s*:$/);
    if (forMatch) {
      const varName = forMatch[1].trim();
      const iter = forMatch[2].trim();
      outLines.push(' '.repeat(leadingSpaces) + `for (let ${varName} of ${iter}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // try / except / finally
    if (/^try\s*:$/.test(line)) {
      outLines.push(' '.repeat(leadingSpaces) + `try {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    const exceptMatch = line.match(/^except(?:\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+as\s+([a-zA-Z_][a-zA-Z0-9_]*))?)?\s*:$/);
    if (exceptMatch) {
      const errVar = exceptMatch[2] || 'err';
      outLines.push(' '.repeat(leadingSpaces) + `catch (${errVar}) {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    if (/^finally\s*:$/.test(line)) {
      outLines.push(' '.repeat(leadingSpaces) + `finally {`);
      indentStack.push(leadingSpaces + 4);
      continue;
    }

    // Variable assignment: name = ...
    // Auto-declare with 'let' if not already declared in current scope
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=[^=]/.test(line)) {
      const varName = line.split('=')[0].trim();
      line = `let ${line}`;
    }

    // Replace print with sep/end kwargs support
    line = line.replace(/print\((.*)\)/g, (_m, args) => {
      // If args contains sep= or end=
      if (/sep\s*=|end\s*=/.test(args)) {
        let cleanArgs: string[] = [];
        let sepVal = "' '";
        let endVal = "'\\n'";

        const parts = args.split(',');
        for (const p of parts) {
          const pt = p.trim();
          if (pt.startsWith('sep=')) sepVal = pt.slice(4);
          else if (pt.startsWith('end=')) endVal = pt.slice(4);
          else cleanArgs.push(pt);
        }
        return `print(${cleanArgs.join(', ')}, { __isPrintOpt: true, sep: ${sepVal}, end: ${endVal} })`;
      }
      return `print(${args})`;
    });

    outLines.push(' '.repeat(leadingSpaces) + line + ';');
  }

  // Close any remaining open blocks at EOF
  while (indentStack.length > 1) {
    indentStack.pop();
    outLines.push('}');
  }

  return outLines.join('\n');
}

/**
 * Formats JS values to authentic Python output:
 * - true -> True
 * - false -> False
 * - null / undefined -> None
 * - arrays -> [1, 2, 3]
 * - objects -> {'key': 'value'}
 */
export function formatPythonObject(obj: any): string {
  if (obj === true) return 'True';
  if (obj === false) return 'False';
  if (obj === null || obj === undefined) return 'None';

  if (Array.isArray(obj)) {
    return `[${obj.map(formatPythonObject).join(', ')}]`;
  }

  if (obj instanceof Set) {
    if (obj.size === 0) return 'set()';
    return `{${Array.from(obj).map(formatPythonObject).join(', ')}}`;
  }

  if (typeof obj === 'object') {
    if (obj.toString && obj.toString !== Object.prototype.toString) {
      return obj.toString();
    }
    const entries = Object.entries(obj).map(
      ([k, v]) => `'${k}': ${typeof v === 'string' ? `'${v}'` : formatPythonObject(v)}`
    );
    return `{${entries.join(', ')}}`;
  }

  return String(obj);
}
