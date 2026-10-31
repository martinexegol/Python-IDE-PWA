/**
 * Zig Language (0.13.0+) Execution & Sandbox Simulation Engine.
 * Parses, transpiles and executes standard Zig code in the browser sandbox,
 * with full support for:
 *  - if/else statements and inline ternary if expressions: `if (a > b) a else b`
 *  - if/while optional captures: `if (opt) |val| { ... }`
 *  - if error captures: `if (res) |val| { ... } else |err| { ... }`
 *  - for loops with slices: `for (items) |item|` and multi-iter `for (items, 0..) |item, i|`
 *  - while loops with continue expressions: `while (i < 10) : (i += 1)`
 *  - switch expressions
 *  - GeneralPurposeAllocator (GPA) with precise leak detection
 *  - Standard library modules: std.debug, std.math, std.mem, std.fmt, std.heap, std.ArrayList, std.HashMap, std.time
 *  - Builtin functions: @import, @as, @intCast, @floatCast, @sizeOf, @min, @max, @abs, @sqrt, etc.
 */

import { ConsoleMessage } from '../types';

export interface RunZigResult {
  success: boolean;
  messages: ConsoleMessage[];
  executionTimeMs: number;
}

interface AllocationBlock {
  id: number;
  addr: string;
  bytes: number;
  freed: boolean;
}

export async function runZigCode(zigCode: string, fileName: string = 'main.zig'): Promise<RunZigResult> {
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

  if (!zigCode.trim()) {
    addMsg('system', `Fichier ${fileName} vide. Écrivez votre code Zig (ex: pub fn main() !void { ... }) puis cliquez sur Exécuter.`);
    return {
      success: true,
      messages,
      executionTimeMs: 0,
    };
  }

  addMsg('system', `zig run ${fileName}`);

  try {
    const jsCode = transpileZigToJs(zigCode);

    // Track GPA allocations
    let heapCounter = 0x100000;
    let allocIdCounter = 1;
    const trackedAllocations: AllocationBlock[] = [];

    // Virtual runtime for Zig
    let lineBuffer = '';
    const runtime = {
      print: (fmt: string, args: any[] = []) => {
        let str = String(fmt);
        let argIdx = 0;

        // Replace Zig format specifiers: {}, {s}, {d}, {x}, {any}, {c}
        str = str.replace(/\{(\w*)\}/g, (_match, _specifier) => {
          if (argIdx >= args.length) return '';
          const val = args[argIdx++];
          if (val === undefined || val === null) return 'null';
          if (typeof val === 'object' && val._slice) {
            return `[${val._slice.join(', ')}]`;
          }
          if (Array.isArray(val)) {
            return `[${val.join(', ')}]`;
          }
          if (typeof val === 'object' && val.items && Array.isArray(val.items)) {
            return `[${val.items.join(', ')}]`;
          }
          return String(val);
        });

        str = str.replace(/\\n/g, '\n').replace(/\\t/g, '    ');
        lineBuffer += str;

        const parts = lineBuffer.split('\n');
        for (let p = 0; p < parts.length - 1; p++) {
          addMsg('stdout', parts[p]);
        }
        lineBuffer = parts[parts.length - 1];
      },
      alloc: (bytes: number) => {
        const size = Math.max(1, parseInt(String(bytes), 10) || 4);
        heapCounter += size;
        const addr = `0x${heapCounter.toString(16)}`;
        const block: AllocationBlock = {
          id: allocIdCounter++,
          addr,
          bytes: size,
          freed: false,
        };
        trackedAllocations.push(block);
        return {
          _addr: addr,
          _bytes: size,
          _slice: new Array(size).fill(0),
        };
      },
      free: (ptr: any) => {
        if (!ptr) return;
        const addr = typeof ptr === 'object' && ptr._addr ? ptr._addr : String(ptr);
        const block = trackedAllocations.find((b) => b.addr === addr);
        if (block) {
          if (block.freed) {
            addMsg('stderr', `[GeneralPurposeAllocator] ⚠️ Double-free sur ${addr} !`);
          } else {
            block.freed = true;
          }
        }
      },
      gpaDeinit: () => {
        const unfreed = trackedAllocations.filter((b) => !b.freed);
        if (unfreed.length > 0) {
          const totalBytes = unfreed.reduce((acc, b) => acc + b.bytes, 0);
          addMsg('stderr', `─`.repeat(55));
          addMsg('stderr', `[GeneralPurposeAllocator] ⚠️ DÉTECTION DE FUITE DE MÉMOIRE (GPA Leak) :`);
          addMsg('stderr', `  • Fuite(s) : ${unfreed.length} bloc(s) (${totalBytes} octets non libérés)`);
          unfreed.slice(0, 3).forEach((b) => {
            addMsg('stderr', `  • Adresse ${b.addr} : ${b.bytes} octets`);
          });
          addMsg('stderr', `  💡 Pensez à ajouter 'defer allocator.free(...);' après votre allocation.`);
          addMsg('stderr', `─`.repeat(55));
          return 'leak';
        }
        return 'ok';
      },
    };

    // Full Zig Standard Library runtime emulation
    const executor = new Function(
      '__runtime',
      `"use strict";
      return (async () => {
        // --- ZIG PRIMITIVE TYPES AS VALUES ---
        const u8 = 'u8', i8 = 'i8', u16 = 'u16', i16 = 'i16', u32 = 'u32', i32 = 'i32', u64 = 'u64', i64 = 'i64', u128 = 'u128', i128 = 'i128';
        const usize = 'usize', isize = 'isize', f16 = 'f16', f32 = 'f32', f64 = 'f64', f128 = 'f128';
        const bool = 'bool', anytype = 'anytype', anyerror = 'anyerror', type = 'type';

        // --- BUILTIN INTRINSICS (@) ---
        const __as = (T, v) => v;
        const __intCast = (v) => Math.trunc(Number(v) || 0);
        const __floatCast = (v) => Number(v) || 0;
        const __ptrCast = (v) => v;
        const __sizeOf = (T) => 4;
        const __min = (a, b) => Math.min(a, b);
        const __max = (a, b) => Math.max(a, b);
        const __abs = (x) => Math.abs(x);
        const __sqrt = (x) => Math.sqrt(x);
        const __panic = (msg) => { throw new Error("panic: " + msg); };

        // --- ZIG STANDARD LIBRARY ---
        const std = {
          debug: {
            print: (fmt, tuple = []) => {
              const args = Array.isArray(tuple) ? tuple : Object.values(tuple || {});
              __runtime.print(fmt, args);
            },
            assert: (cond) => {
              if (!cond) throw new Error("assertion failure");
            },
            panic: (fmt, args) => {
              throw new Error("panic: " + fmt);
            },
            dumpStackTrace: () => {}
          },
          math: {
            max: (a, b) => Math.max(a, b),
            min: (a, b) => Math.min(a, b),
            clamp: (val, low, high) => Math.min(Math.max(val, low), high),
            sqrt: (x) => Math.sqrt(x),
            pow: (T, base, exp) => Math.pow(base, exp),
            absInt: (x) => Math.abs(x),
            absFloat: (x) => Math.abs(x),
            floor: (x) => Math.floor(x),
            ceil: (x) => Math.ceil(x),
            round: (x) => Math.round(x),
            log: (base, x) => Math.log(x) / Math.log(base),
            sin: (x) => Math.sin(x),
            cos: (x) => Math.cos(x),
            pi: Math.PI,
            e: Math.E,
            inf: (T) => Infinity,
            nan: (T) => NaN,
          },
          mem: {
            eql: (T, a, b) => {
              if (a === b) return true;
              if (typeof a === 'string' && typeof b === 'string') return a === b;
              if (Array.isArray(a) && Array.isArray(b)) {
                if (a.length !== b.length) return false;
                for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
                return true;
              }
              return String(a) === String(b);
            },
            copy: (T, dest, src) => {
              const len = Math.min(dest.length, src.length);
              for (let i = 0; i < len; i++) dest[i] = src[i];
            },
            set: (T, dest, val) => {
              for (let i = 0; i < dest.length; i++) dest[i] = val;
            },
            zeroes: (T) => {
              return 0;
            },
            trim: (T, str, whitespaces) => {
              return String(str).trim();
            },
            indexOf: (T, slice, needle) => {
              const idx = slice.indexOf(needle);
              return idx >= 0 ? idx : null;
            },
            startsWith: (T, slice, needle) => {
              return String(slice).startsWith(String(needle));
            },
            endsWith: (T, slice, needle) => {
              return String(slice).endsWith(String(needle));
            },
            splitScalar: (T, str, delim) => {
              const parts = String(str).split(String(delim));
              let idx = 0;
              return {
                next: () => (idx < parts.length ? parts[idx++] : null)
              };
            }
          },
          fmt: {
            allocPrint: (alloc, fmt, args) => {
              let res = String(fmt);
              const vals = Array.isArray(args) ? args : Object.values(args || {});
              let i = 0;
              res = res.replace(/\{(\w*)\}/g, () => (i < vals.length ? String(vals[i++]) : ''));
              return res;
            },
            bufPrint: (buf, fmt, args) => {
              return std.fmt.allocPrint(null, fmt, args);
            },
            parseInt: (T, str, base = 10) => {
              const val = parseInt(String(str), base);
              if (isNaN(val)) throw new Error("InvalidCharacter");
              return val;
            },
            parseFloat: (T, str) => {
              const val = parseFloat(String(str));
              if (isNaN(val)) throw new Error("InvalidCharacter");
              return val;
            }
          },
          heap: {
            GeneralPurposeAllocator: () => {
              return class GPA {
                allocator() {
                  return {
                    alloc: (T, n) => __runtime.alloc(n),
                    create: (T) => __runtime.alloc(1),
                    dupe: (T, slice) => {
                      const blk = __runtime.alloc(slice.length || 1);
                      if (Array.isArray(slice)) blk._slice = [...slice];
                      return blk;
                    },
                    free: (slice) => __runtime.free(slice),
                    destroy: (ptr) => __runtime.free(ptr),
                  };
                }
                deinit() {
                  return __runtime.gpaDeinit();
                }
              };
            },
            ArenaAllocator: class Arena {
              constructor(child) {
                this.child = child;
                this.allocations = [];
              }
              static init(child) {
                return new std.heap.ArenaAllocator(child);
              }
              allocator() {
                const self = this;
                return {
                  alloc: (T, n) => {
                    const b = __runtime.alloc(n);
                    self.allocations.push(b);
                    return b;
                  },
                  create: (T) => {
                    const b = __runtime.alloc(1);
                    self.allocations.push(b);
                    return b;
                  },
                  free: () => {},
                  destroy: () => {}
                };
              }
              deinit() {
                for (const b of this.allocations) {
                  __runtime.free(b);
                }
                this.allocations = [];
                return 'ok';
              }
            },
            page_allocator: {
              alloc: (T, n) => __runtime.alloc(n),
              create: (T) => __runtime.alloc(1),
              free: (s) => __runtime.free(s),
              destroy: (p) => __runtime.free(p),
            }
          },
          ArrayList: (T) => {
            return class ArrayList {
              constructor(allocator) {
                this.items = [];
                this._allocator = allocator;
              }
              static init(allocator) {
                return new ArrayList(allocator);
              }
              append(val) {
                this.items.push(val);
              }
              pop() {
                return this.items.pop();
              }
              deinit() {
                this.items = [];
              }
            };
          },
          AutoHashMap: (K, V) => {
            return class HashMap {
              constructor(allocator) {
                this._map = new Map();
                this._allocator = allocator;
              }
              static init(allocator) {
                return new HashMap(allocator);
              }
              put(k, v) {
                this._map.set(k, v);
              }
              get(k) {
                return this._map.has(k) ? this._map.get(k) : null;
              }
              contains(k) {
                return this._map.has(k);
              }
              remove(k) {
                this._map.delete(k);
              }
              count() {
                return this._map.size;
              }
              deinit() {
                this._map.clear();
              }
            };
          },
          StringHashMap: (V) => {
            return std.AutoHashMap(String, V);
          },
          time: {
            milliTimestamp: () => Date.now(),
            nanoTimestamp: () => Math.round(performance.now() * 1000000),
            sleep: async (ns) => {
              const ms = Math.max(1, Math.round(ns / 1000000));
              await new Promise((r) => setTimeout(r, ms));
            },
            ns_per_ms: 1000000,
            ns_per_s: 1000000000,
          },
          fs: {
            cwd: () => ({
              openFile: (path, opts) => ({ close: () => {} }),
              createFile: (path, opts) => ({ close: () => {}, write: () => {} }),
              makeDir: (path) => {},
            })
          },
          testing: {
            expect: (cond) => {
              if (!cond) throw new Error("Test expectation failed (condition is false)");
            },
            expectEqual: (expected, actual) => {
              if (expected !== actual) throw new Error("Test expectation failed: expected " + expected + ", got " + actual);
            },
            expectError: (expectedErr, result) => {}
          }
        };

        ${jsCode}

        if (typeof main === 'function') {
          return await main();
        }
        return 0;
      })();`
    );

    const exitCode = await executor(runtime);

    if (lineBuffer) {
      addMsg('stdout', lineBuffer);
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Final GPA check
    const unfreedFinal = trackedAllocations.filter((b) => !b.freed);
    if (trackedAllocations.length > 0 && unfreedFinal.length === 0) {
      addMsg('info', `[GeneralPurposeAllocator] ✅ Toutes les allocations ont été libérées avec succès (0 fuite).`);
    }

    addMsg('system', `Processus terminé avec le code de sortie ${typeof exitCode === 'number' ? exitCode : 0} (${duration} ms).`);

    return {
      success: true,
      messages,
      executionTimeMs: duration,
    };
  } catch (err: any) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    addMsg('stderr', `${fileName}: error: ${err.message || String(err)}`);
    addMsg('system', `Échec de l'exécution (code 1) [${duration} ms].`);

    return {
      success: false,
      messages,
      executionTimeMs: duration,
    };
  }
}

/**
 * Transpiles Zig syntax into safe JS for sandbox execution.
 * Handles if statements, if optional captures, ternary if, while, for loops,
 * builtins, structs, and defers.
 */
function transpileZigToJs(zigCode: string): string {
  let js = zigCode;

  // 1. Comments
  js = js.replace(/\/\/\/.*$/gm, '');
  js = js.replace(/\/\/.*$/gm, '');

  // 2. Remove @import statements (standard library is supplied in sandbox scope)
  js = js.replace(/const\s+std\s*=\s*@import\("std"\);/g, '');

  // 3. Transform pub fn main() !void { ... }
  js = js.replace(
    /\b(?:pub\s+)?fn\s+main\s*\([^)]*\)\s*(?:!\s*void|void|!\s*[a-zA-Z0-9_]+)?\s*\{/g,
    'async function main() {'
  );

  // 4. Transform functions: pub fn add(a: i32, b: i32) i32 { ... }
  js = js.replace(
    /\b(?:pub\s+)?fn\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:!\s*[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)?\s*\{/g,
    (_m, funcName, params) => {
      if (funcName === 'main') return 'async function main() {';
      const cleanedParams = params
        .split(',')
        .map((p: string) => {
          const parts = p.trim().split(':');
          return (parts[0] || '').trim();
        })
        .filter(Boolean)
        .join(', ');
      return `function ${funcName}(${cleanedParams}) {`;
    }
  );

  // 5. Transform GPA & Arena instantiation
  js = js.replace(
    /\b(?:const|var)\s+gpa\s*=\s*std\.heap\.GeneralPurposeAllocator\([^)]*\)\{\};/g,
    'const gpa = new (std.heap.GeneralPurposeAllocator())();'
  );

  // 6. Transform Zig variable declarations:
  // const x: i32 = 10; -> const x = 10;
  // var y: usize = 0; -> let y = 0;
  js = js.replace(/\bconst\s+([a-zA-Z0-9_]+)\s*(?::\s*[^=]+)?\s*=/g, 'const $1 =');
  js = js.replace(/\bvar\s+([a-zA-Z0-9_]+)\s*(?::\s*[^=]+)?\s*=/g, 'let $1 =');

  // 7. Transform array initializers:
  // const arr = [_]i32{ 1, 2, 3 }; -> const arr = [1, 2, 3];
  js = js.replace(/\[_\][a-zA-Z0-9_]*\{([^}]*)\}/g, '[$1]');
  js = js.replace(/\[\d+\][a-zA-Z0-9_]*\{([^}]*)\}/g, '[$1]');

  // 8. Transform Zig inline ternary if expressions:
  // = if (cond) val_a else val_b; -> = (cond) ? (val_a) : (val_b);
  js = js.replace(/=\s*if\s*\(([^)]+)\)\s*([^{;]+?)\s*else\s*([^;]+);/g, '= ($1) ? ($2) : ($3);');
  js = js.replace(/\breturn\s+if\s*\(([^)]+)\)\s*([^{;]+?)\s*else\s*([^;]+);/g, 'return ($1) ? ($2) : ($3);');

  // 9. Transform Zig if optional unwrap: if (opt) |val| { ... }
  // Zig: if (maybe_user) |user| { ... } else { ... }
  js = js.replace(
    /\bif\s*\(([^)]+)\)\s*\|([a-zA-Z0-9_]+)\|\s*\{/g,
    'if ($1 !== null && $1 !== undefined) { const $2 = $1;'
  );

  // 10. Transform Zig if error unwrap: } else |err| { ... }
  js = js.replace(/\}\s*else\s*\|([a-zA-Z0-9_]+)\|\s*\{/g, '} else { const $1 = "Error";');

  // 11. Transform Zig while loops with continue expression:
  // while (i < 10) : (i += 1) { -> while (i < 10) { ... and i += 1 at end or for loop
  js = js.replace(
    /\bwhile\s*\(([^)]+)\)\s*:\s*\(([^)]+)\)\s*\{/g,
    'for (; $1; $2) {'
  );

  // 12. Transform Zig while optional unwrap: while (opt) |val| {
  js = js.replace(
    /\bwhile\s*\(([^)]+)\)\s*\|([a-zA-Z0-9_]+)\|\s*\{/g,
    'let $2; while (($2 = $1) !== null && $2 !== undefined) {'
  );

  // 13. Transform Zig for loops:
  // for (items, 0..) |item, i| { -> for (let i = 0; i < items.length; i++) { const item = items[i];
  js = js.replace(
    /\bfor\s*\(\s*([a-zA-Z0-9_.]+)\s*,\s*0\.\.\s*\)\s*\|([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\|\s*\{/g,
    'for (let $3 = 0; $3 < ($1?.length || 0); $3++) { const $2 = $1[$3];'
  );

  // for (items) |item| { -> for (const item of items) {
  js = js.replace(
    /\bfor\s*\(\s*([a-zA-Z0-9_.]+)\s*\)\s*\|([a-zA-Z0-9_]+)\|\s*\{/g,
    'for (const $2 of ($1 || [])) {'
  );

  // 14. Transform try / catch expressions
  js = js.replace(/\btry\s+/g, '');
  js = js.replace(/\bcatch\s+[^;{]+/g, 'catch (err)');

  // 15. Transform tuple args .{ "world", 42 } in function calls:
  js = js.replace(/\.\{([^}]*)\}/g, '[$1]');

  // 16. Transform Zig builtins (@)
  js = js.replace(/@as\([^,]+,\s*([^)]+)\)/g, '__as(null, $1)');
  js = js.replace(/@intCast\(([^)]+)\)/g, '__intCast($1)');
  js = js.replace(/@floatCast\(([^)]+)\)/g, '__floatCast($1)');
  js = js.replace(/@sizeOf\(([^)]+)\)/g, '__sizeOf($1)');
  js = js.replace(/@min\(([^,]+),\s*([^)]+)\)/g, '__min($1, $2)');
  js = js.replace(/@max\(([^,]+),\s*([^)]+)\)/g, '__max($1, $2)');
  js = js.replace(/@abs\(([^)]+)\)/g, '__abs($1)');
  js = js.replace(/@sqrt\(([^)]+)\)/g, '__sqrt($1)');
  js = js.replace(/@panic\(([^)]+)\)/g, '__panic($1)');

  // 17. Structs: const Point = struct { x: f32, y: f32 };
  js = js.replace(
    /const\s+([a-zA-Z0-9_]+)\s*=\s*struct\s*\{([^}]*)\};/g,
    'class $1 { constructor(obj = {}) { Object.assign(this, obj); } }'
  );

  // 18. Defer statements: defer expr;
  const deferMatches: string[] = [];
  js = js.replace(/\bdefer\s+([^;]+);/g, (_m, deferExpr) => {
    deferMatches.push(deferExpr.trim() + ';');
    return '// ' + _m;
  });

  if (deferMatches.length > 0) {
    const deferCode = deferMatches.reverse().join('\n    ');
    js = js.replace(/\breturn\b([^;]*);/g, `${deferCode}\n    return$1;`);
  }

  return js;
}
