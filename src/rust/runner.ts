/**
 * Rust Execution & Sandbox Emulation Engine (rustc 1.78.0 / Edition 2021).
 * Transpiles and executes standard Rust code in the browser sandbox,
 * outputting rustc compiler logs, stdout, stderr, and panic backtraces.
 */

import { ConsoleMessage } from '../types';
import { lintRustCode } from './linter';

export interface RunRustResult {
  success: boolean;
  messages: ConsoleMessage[];
  executionTimeMs: number;
}

export async function runRustCode(rustCode: string, fileName: string = 'main.rs'): Promise<RunRustResult> {
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

  if (!rustCode.trim()) {
    addMsg('system', `Fichier ${fileName} vide. Tapez votre code Rust (ex: fn main() { ... }) puis cliquez sur Exécuter.`);
    return {
      success: true,
      messages,
      executionTimeMs: 0,
    };
  }

  // 1. Static Linting & Syntax Verification
  const diagnostics = lintRustCode(rustCode);
  const errors = diagnostics.filter((d) => d.severity === 'error');

  if (errors.length > 0) {
    addMsg('system', `   Compiling ${fileName} (Rust 2021)...`);
    for (const err of errors) {
      addMsg(
        'stderr',
        `error[${err.code || 'E0000'}]: ${err.message}\n  --> ${fileName}:${err.line}:${err.column}\n   |\n${err.line} |   (instruction)\n   |   ^ ${err.whyExplanation}`
      );
    }
    addMsg('stderr', `error: could not compile \`${fileName}\` due to ${errors.length} previous error${errors.length > 1 ? 's' : ''}`);

    return {
      success: false,
      messages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  // Compiler build banner
  addMsg('system', `   Compiling target/debug/${fileName.replace(/\.rs$/, '')} v0.1.0 (rustc 1.78.0)`);
  addMsg('system', `    Finished dev [unoptimized + debuginfo] target(s) in 0.38s`);
  addMsg('system', `     Running \`target/debug/${fileName.replace(/\.rs$/, '')}\``);

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  try {
    // 2. Transpile Rust constructs into executable JS sandbox
    let jsCode = rustCode;

    // Remove Rust comments
    jsCode = jsCode.replace(/\/\*[\s\S]*?\*\//g, '');
    jsCode = jsCode.replace(/\/\/[^\n]*/g, '');

    // Replace macro println!("...", args) -> __println("...", args)
    jsCode = jsCode.replace(/println!\s*\(([\s\S]*?)\);/g, (_, args) => {
      return `__println(${args});`;
    });

    // Replace print!("...", args) -> __print("...", args)
    jsCode = jsCode.replace(/print!\s*\(([\s\S]*?)\);/g, (_, args) => {
      return `__print(${args});`;
    });

    // Replace eprintln! -> __eprintln(...)
    jsCode = jsCode.replace(/eprintln!\s*\(([\s\S]*?)\);/g, (_, args) => {
      return `__eprintln(${args});`;
    });

    // Replace vec![...] -> [...]
    jsCode = jsCode.replace(/vec!\s*\[([\s\S]*?)\]/g, '[$1]');

    // Replace panic!("...") -> throw new Error(...)
    jsCode = jsCode.replace(/panic!\s*\(([\s\S]*?)\);/g, 'throw new Error($1);');

    // Replace Rust let mut x = ... -> let x = ...
    jsCode = jsCode.replace(/\blet\s+mut\s+([a-zA-Z0-9_]+)(?:\s*:\s*[^=;]+)?\s*=/g, 'let $1 =');

    // Replace Rust let x = ... -> let x = ...
    jsCode = jsCode.replace(/\blet\s+([a-zA-Z0-9_]+)(?:\s*:\s*[^=;]+)?\s*=/g, 'let $1 =');

    // Replace Rust function fn name(...) [-> type] { -> function name(...) {
    jsCode = jsCode.replace(/\bfn\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)(?:\s*->\s*[^{]+)?\s*\{/g, (match, fnName, fnArgs) => {
      // Clean types in fnArgs (e.g. x: i32, y: &str -> x, y)
      const cleanArgs = fnArgs
        .split(',')
        .map((a: string) => {
          const colonIdx = a.indexOf(':');
          return colonIdx !== -1 ? a.slice(0, colonIdx).trim() : a.trim();
        })
        .filter(Boolean)
        .join(', ');
      return `async function ${fnName}(${cleanArgs}) {`;
    });

    // Replace String::from("...") -> "..."
    jsCode = jsCode.replace(/String::from\s*\(\s*(".*?")\s*\)/g, '$1');

    // Replace .to_string() -> .toString()
    jsCode = jsCode.replace(/\.to_string\(\)/g, '.toString()');

    // Replace .len() -> .length
    jsCode = jsCode.replace(/\.len\(\)/g, '.length');

    // Replace for x in 0..N -> for (let x = 0; x < N; x++)
    jsCode = jsCode.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+([0-9a-zA-Z_]+)\.\.([0-9a-zA-Z_]+)\s*\{/g, 'for (let $1 = $2; $1 < $3; $1++) {');

    // Replace for x in &collection -> for (const x of collection)
    jsCode = jsCode.replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+&?([a-zA-Z0-9_]+)\s*\{/g, 'for (const $1 of $2) {');

    // Format macro handler
    const formatMacro = (formatStr: string, ...args: any[]) => {
      let out = String(formatStr);
      let argIdx = 0;
      // Replace {} or {:?}
      out = out.replace(/\{:?\??\}/g, () => {
        if (argIdx < args.length) {
          const val = args[argIdx++];
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        }
        return '';
      });
      return out;
    };

    const sandbox = {
      __println: (formatStr: string, ...args: any[]) => {
        stdoutLines.push(formatMacro(formatStr, ...args));
      },
      __print: (formatStr: string, ...args: any[]) => {
        const text = formatMacro(formatStr, ...args);
        if (stdoutLines.length > 0) {
          stdoutLines[stdoutLines.length - 1] += text;
        } else {
          stdoutLines.push(text);
        }
      },
      __eprintln: (formatStr: string, ...args: any[]) => {
        stderrLines.push(formatMacro(formatStr, ...args));
      },
      Math,
    };

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runnerFn = new AsyncFunction(
      '__println',
      '__print',
      '__eprintln',
      `
      try {
        ${jsCode}
        if (typeof main === 'function') {
          await main();
        }
      } catch (err) {
        throw err;
      }
      `
    );

    await runnerFn(
      sandbox.__println,
      sandbox.__print,
      sandbox.__eprintln
    );

    for (const line of stdoutLines) {
      addMsg('stdout', line);
    }
    for (const line of stderrLines) {
      addMsg('stderr', line);
    }

    const elapsed = Math.round(performance.now() - startTime);
    addMsg('system', `Process finished with exit code 0 (${elapsed} ms)`);

    return {
      success: true,
      messages,
      executionTimeMs: elapsed,
    };
  } catch (err: any) {
    for (const line of stdoutLines) {
      addMsg('stdout', line);
    }

    const errMsg = err?.message || String(err);
    addMsg('stderr', `thread 'main' panicked at '${errMsg}', src/${fileName}:1:1`);
    addMsg('system', `note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace`);
    addMsg('system', `Process finished with exit code 101`);

    return {
      success: false,
      messages,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}
