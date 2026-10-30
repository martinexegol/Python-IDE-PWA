/**
 * C Language (C99/C11) Execution & Sandbox Simulation Engine.
 * Parses, transpiles and executes standard C code in the browser sandbox,
 * routing printf output, memory operations, pointers, and diagnostics to the console.
 */

import { ConsoleMessage } from '../types';

export interface RunCResult {
  success: boolean;
  messages: ConsoleMessage[];
  executionTimeMs: number;
}

export async function runCCode(cCode: string, fileName: string = 'main.c'): Promise<RunCResult> {
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

  if (!cCode.trim()) {
    addMsg('system', `Fichier ${fileName} vide. Tapez votre code C (ex: int main(void) { ... }) puis cliquez sur Exécuter.`);
    return {
      success: true,
      messages,
      executionTimeMs: 0,
    };
  }

  addMsg('system', `gcc -Wall -Wextra -std=c11 -O2 ${fileName} -o a.out && ./a.out`);

  try {
    const jsCode = transpileCToJs(cCode);

    // Standard stdout buffer
    let lineBuffer = '';
    const stdio = {
      printf: (fmt: string, ...args: any[]) => {
        let str = String(fmt);
        let argIdx = 0;

        // Process format specifiers: %d, %i, %s, %c, %f, %.Nf, %p, %u, %ld, %x, %%
        str = str.replace(/%(\.?\d*)?([discfpuoxX%])/g, (match, precision, specifier) => {
          if (specifier === '%') return '%';
          if (argIdx >= args.length) return match;
          const val = args[argIdx++];

          switch (specifier) {
            case 'd':
            case 'i':
              return String(parseInt(val, 10) || 0);
            case 'u':
              return String(Math.abs(parseInt(val, 10) || 0));
            case 'f': {
              const num = parseFloat(val) || 0;
              if (precision && precision.startsWith('.')) {
                const dec = parseInt(precision.slice(1), 10);
                return num.toFixed(dec);
              }
              return num.toFixed(6);
            }
            case 's':
              return val !== undefined && val !== null ? String(val) : '(null)';
            case 'c':
              return typeof val === 'number' ? String.fromCharCode(val) : String(val).charAt(0);
            case 'p':
              return typeof val === 'object' && val !== null && val._addr ? val._addr : '0x7ffd9b8a34';
            case 'x':
              return (parseInt(val, 10) || 0).toString(16);
            case 'X':
              return (parseInt(val, 10) || 0).toString(16).toUpperCase();
            default:
              return String(val);
          }
        });

        // Handle escape characters \n, \t
        str = str.replace(/\\n/g, '\n').replace(/\\t/g, '    ');
        lineBuffer += str;

        const parts = lineBuffer.split('\n');
        for (let p = 0; p < parts.length - 1; p++) {
          addMsg('stdout', parts[p]);
        }
        lineBuffer = parts[parts.length - 1];
      },
      puts: (str: string) => {
        stdio.printf('%s\n', str);
      },
    };

    // Virtual Heap for malloc / free
    let heapAddressCounter = 0x600000;
    const stdlib = {
      malloc: (bytes: number) => {
        heapAddressCounter += Math.max(8, bytes);
        return {
          _addr: `0x${heapAddressCounter.toString(16)}`,
          _size: bytes,
          _data: new Array(bytes).fill(0),
        };
      },
      calloc: (num: number, size: number) => stdlib.malloc(num * size),
      free: (_ptr: any) => {
        // emulated free
      },
      abs: Math.abs,
      rand: () => Math.floor(Math.random() * 32767),
      srand: () => {},
      exit: (code: number) => {
        throw new Error(`__EXIT_${code}__`);
      },
    };

    const cMath = {
      sqrt: Math.sqrt,
      pow: Math.pow,
      abs: Math.abs,
      fabs: Math.abs,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      ceil: Math.ceil,
      floor: Math.floor,
      round: Math.round,
      log: Math.log,
      log10: Math.log10,
    };

    const cString = {
      strlen: (s: any) => String(s || '').length,
      strcpy: (_dest: any, src: any) => String(src || ''),
      strcat: (dest: any, src: any) => String(dest || '') + String(src || ''),
      strcmp: (s1: any, s2: any) => String(s1).localeCompare(String(s2)),
    };

    // Construct executor
    const executor = new Function(
      'printf',
      'puts',
      'malloc',
      'calloc',
      'free',
      'strlen',
      'strcpy',
      'strcat',
      'strcmp',
      'sqrt',
      'pow',
      'ceil',
      'floor',
      'abs',
      `"use strict";
      return (async () => {
        ${jsCode}
        if (typeof main === 'function') {
          return await main();
        }
        return 0;
      })();`
    );

    const exitCode = await executor(
      stdio.printf,
      stdio.puts,
      stdlib.malloc,
      stdlib.calloc,
      stdlib.free,
      cString.strlen,
      cString.strcpy,
      cString.strcat,
      cString.strcmp,
      cMath.sqrt,
      cMath.pow,
      cMath.ceil,
      cMath.floor,
      cMath.abs
    );

    // Flush any remaining characters in buffer
    if (lineBuffer) {
      addMsg('stdout', lineBuffer);
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    const finalCode = typeof exitCode === 'number' ? exitCode : 0;
    addMsg('system', `Processus terminé avec le code de sortie ${finalCode} (${duration} ms).`);

    return {
      success: true,
      messages,
      executionTimeMs: duration,
    };
  } catch (err: any) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    if (err.message && err.message.startsWith('__EXIT_')) {
      const code = err.message.replace('__EXIT_', '').replace('__', '');
      addMsg('system', `Processus arrêté via exit(${code}) (${duration} ms).`);
      return { success: true, messages, executionTimeMs: duration };
    }

    addMsg('stderr', `${fileName}: error: ${err.message || String(err)}`);
    addMsg('system', `Échec de la compilation / exécution (code 1) [${duration} ms].`);

    return {
      success: false,
      messages,
      executionTimeMs: duration,
    };
  }
}

/**
 * Transpiles simple to intermediate C code into executable Javascript.
 */
function transpileCToJs(cCode: string): string {
  let js = cCode;

  // 1. Remove comments
  js = js.replace(/\/\*[\s\S]*?\*\//g, '');
  js = js.replace(/\/\/.*$/gm, '');

  // 2. Remove preprocessor directives (#include, #define, etc.)
  // Handle #define CONSTANT VALUE
  const defineRegex = /#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/gm;
  const defines: Record<string, string> = {};
  let match;
  while ((match = defineRegex.exec(js)) !== null) {
    defines[match[1]] = match[2].trim();
  }
  js = js.replace(/^#.*$/gm, '');

  // Apply defines
  for (const [k, v] of Object.entries(defines)) {
    const reg = new RegExp(`\\b${k}\\b`, 'g');
    js = js.replace(reg, v);
  }

  // 3. Transform main function: int main(void) or int main() or int main(int argc, char* argv[])
  js = js.replace(
    /\bint\s+main\s*\([^)]*\)\s*\{/g,
    'async function main() {'
  );

  // 4. Transform custom functions: void foo(int a, float b) { ... }
  js = js.replace(
    /\b(?:void|int|float|double|char\*?|bool|size_t)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*\{/g,
    (_m, funcName, params) => {
      if (funcName === 'main') return 'async function main() {';
      // Clean parameter types: "int a, float b" -> "a, b"
      const cleanedParams = params
        .split(',')
        .map((p: string) => {
          const parts = p.trim().split(/\s+/);
          const rawName = parts[parts.length - 1] || '';
          return rawName.replace(/^[*&]+/, '');
        })
        .filter(Boolean)
        .join(', ');
      return `function ${funcName}(${cleanedParams}) {`;
    }
  );

  // 5. Remove C variable types: int x = 10; -> let x = 10;
  // float f = 3.14; -> let f = 3.14;
  js = js.replace(
    /\b(?:int|char|float|double|size_t|bool|unsigned\s+int|short|long)\s+(\*?\s*[a-zA-Z_][a-zA-Z0-9_]*)/g,
    'let $1'
  );

  // 6. Handle pointers dereferencing & address-of emulation:
  // int *ptr = &x; -> let ptr = { get: () => x, set: (v) => { x = v; } }
  // For standard didactic C exercises, remove pointer stars in declaration: let *ptr -> let ptr
  js = js.replace(/\blet\s+\*\s*([a-zA-Z_][a-zA-Z0-9_]*)/g, 'let $1');

  // 7. Struct declarations: struct Point { int x; int y; };
  js = js.replace(
    /struct\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{([^}]*)\};/g,
    'class $1 { constructor(obj = {}) { Object.assign(this, obj); } }'
  );

  return js;
}
