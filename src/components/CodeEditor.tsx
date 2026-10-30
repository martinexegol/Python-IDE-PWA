import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PythonTheme, PythonDiagnostic, CompletionItem } from '../types';
import { tokenizeCLine, Token } from '../c/syntax';
import { tokenizeRustLine } from '../rust/syntax';
import { calculateIndentGuides, getActiveIndentGuideLevel } from '../utils/indentation';
import { getCCompletionsForQuery } from '../c/autocomplete';
import { getRustCompletionsForQuery } from '../rust/autocomplete';
import { AlertCircle, AlertTriangle, Sparkles, ChevronRight } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  activeTheme: PythonTheme;
  diagnostics: PythonDiagnostic[];
  jumpToLine?: number | null;
  onJumpComplete?: () => void;
  language?: 'c' | 'rust';
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  activeTheme,
  diagnostics,
  jumpToLine,
  onJumpComplete,
  language = 'c',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const codeOverlayRef = useRef<HTMLDivElement>(null);

  const [cursorLine, setCursorLine] = useState<number>(1);
  const [cursorCol, setCursorCol] = useState<number>(1);
  const [cursorOffset, setCursorOffset] = useState<number>(0);

  // Autocomplete state
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const [autocompletePos, setAutocompletePos] = useState({ top: 0, left: 0 });
  const [isAfterDot, setIsAfterDot] = useState(false);
  const [wordStartOffset, setWordStartOffset] = useState(0);

  // Hover diagnostic state
  const [hoveredDiagnostic, setHoveredDiagnostic] = useState<{
    diag: PythonDiagnostic;
    x: number;
    y: number;
  } | null>(null);

  const lines = useMemo(() => code.split('\n'), [code]);

  // Handle jumpToLine from diagnostics click
  useEffect(() => {
    if (jumpToLine && textareaRef.current) {
      let offset = 0;
      for (let i = 0; i < jumpToLine - 1 && i < lines.length; i++) {
        offset += lines[i].length + 1; // +1 for '\n'
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(offset, offset);
      setCursorLine(jumpToLine);
      setCursorCol(1);
      setCursorOffset(offset);

      // Scroll to line
      const lineHeight = 22;
      containerRef.current?.scrollTo({
        top: Math.max(0, (jumpToLine - 5) * lineHeight),
        behavior: 'smooth',
      });

      onJumpComplete?.();
    }
  }, [jumpToLine, lines, onJumpComplete]);

  // Calculate Indent Guides for each line
  const lineIndentInfos = useMemo(() => calculateIndentGuides(lines), [lines]);
  const activeGuideLevel = useMemo(
    () => getActiveIndentGuideLevel(lines, cursorLine),
    [lines, cursorLine]
  );

  // Map diagnostics by line for quick lookup
  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, PythonDiagnostic[]>();
    for (const d of diagnostics) {
      const existing = map.get(d.line) || [];
      existing.push(d);
      map.set(d.line, existing);
    }
    return map;
  }, [diagnostics]);

  // Find active error or warning to display visible suggestion
  const activeDiagnostic = useMemo(() => {
    return (
      diagnostics.find((d) => d.line === cursorLine && d.severity === 'error') ||
      diagnostics.find((d) => d.severity === 'error') ||
      diagnostics.find((d) => d.line === cursorLine && d.severity === 'warning') ||
      null
    );
  }, [diagnostics, cursorLine]);

  // Filter autocomplete candidates for C or Rust
  const completions = useMemo(() => {
    if (!autocompleteOpen) return [];
    if (language === 'rust') {
      return getRustCompletionsForQuery(autocompleteQuery, code);
    }
    return getCCompletionsForQuery(autocompleteQuery, code);
  }, [autocompleteOpen, autocompleteQuery, code, language]);

  // Synchronize scroll between textarea and syntax highlight overlay
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (codeOverlayRef.current) {
      codeOverlayRef.current.scrollTop = scrollTop;
      codeOverlayRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  // Ref for active autocomplete option to auto-scroll
  const activeOptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autocompleteOpen && activeOptionRef.current) {
      activeOptionRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [autocompleteIndex, autocompleteOpen]);

  // Update cursor position and check for autocomplete trigger
  const updateCursorPosition = useCallback(
    (resetIndex: boolean = true) => {
      if (!textareaRef.current) return;
      const pos = textareaRef.current.selectionStart;
      setCursorOffset(pos);

      // Compute line and column
      const textBefore = code.slice(0, pos);
      const lineList = textBefore.split('\n');
      const curLine = lineList.length;
      const curCol = lineList[lineList.length - 1].length + 1;

      setCursorLine(curLine);
      setCursorCol(curCol);

      // Autocomplete detection: check current word
      const currentLineText = lines[curLine - 1] || '';
      const lineBeforeCursor = currentLineText.slice(0, curCol - 1);
      const wordMatch = lineBeforeCursor.match(/([a-zA-Z0-9_$]+)$/);
      const afterDot = lineBeforeCursor.endsWith('.');

      if (wordMatch || afterDot) {
        const query = wordMatch ? wordMatch[1] : '';
        setAutocompleteQuery(query);
        setIsAfterDot(afterDot);
        setWordStartOffset(pos - query.length);

        // Approximate coordinates for popup
        const charWidth = 7.8;
        const lineHeight = 22;
        const top = (curLine - 1) * lineHeight + 26;
        const left = Math.min(500, Math.max(60, curCol * charWidth + 50));

        setAutocompletePos({ top, left });
        setAutocompleteOpen(true);
        if (resetIndex) {
          setAutocompleteIndex(0);
        }
      } else {
        setAutocompleteOpen(false);
      }
    },
    [code, lines]
  );

  // Insert completion candidate
  const applyCompletion = useCallback(
    (item: CompletionItem) => {
      let insert = item.insertText;
      let targetCursorPos = -1;

      const before = code.slice(0, wordStartOffset);
      const after = code.slice(cursorOffset);

      // Smart prefix deduplication:
      // If the code right before wordStartOffset already ends with the leading keyword(s) of insert,
      // strip that duplicate prefix from insert so we never produce duplicate keywords
      const prefixesToCheck = ['def', 'class', 'async def', 'from', 'import'];
      for (const p of prefixesToCheck) {
        const regex = new RegExp(`(?:^|\\s)${p}\\s*$`);
        if (regex.test(before) && insert.startsWith(`${p} `)) {
          insert = insert.slice(p.length + 1);
          break;
        }
      }

      // Check if snippet contains $CURSOR marker
      if (insert.includes('$CURSOR')) {
        const markerIdx = insert.indexOf('$CURSOR');
        insert = insert.replace('$CURSOR', '');
        targetCursorPos = wordStartOffset + markerIdx;
      }

      const newCode = before + insert + after;
      onChange(newCode);

      // Immediately close autocomplete
      setAutocompleteOpen(false);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const finalPos = targetCursorPos !== -1 ? targetCursorPos : wordStartOffset + insert.length;
          textareaRef.current.setSelectionRange(finalPos, finalPos);
          setCursorOffset(finalPos);

          // Update cursor position line and column without opening autocomplete
          const textBeforeCursor = newCode.slice(0, finalPos);
          const lineList = textBeforeCursor.split('\n');
          setCursorLine(lineList.length);
          setCursorCol(lineList[lineList.length - 1].length + 1);
          setAutocompleteOpen(false);
        }
      }, 10);
    },
    [code, wordStartOffset, cursorOffset, onChange]
  );

  // Synchronously update textarea value and cursor position to prevent cursor jump
  const updateCodeAndCursor = useCallback(
    (newCode: string, newCursorPos: number) => {
      if (textareaRef.current) {
        textareaRef.current.value = newCode;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
      onChange(newCode);
      setCursorOffset(newCursorPos);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          updateCursorPosition(true);
        }
      }, 0);
    },
    [onChange, updateCursorPosition]
  );

  // Insert matching pairs ('' or "" or () or {} or []) and place cursor in between
  const insertPair = useCallback(
    (openChar: string, closeChar: string) => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? 0;
      const end = textarea?.selectionEnd ?? 0;

      if (start !== end) {
        // Wrap selection in quotes/brackets
        const selectedText = code.slice(start, end);
        const before = code.slice(0, start);
        const after = code.slice(end);
        const newCode = before + openChar + selectedText + closeChar + after;
        const newPos = end + openChar.length;
        updateCodeAndCursor(newCode, newPos);
      } else {
        // Insert pair and place cursor in the middle
        const before = code.slice(0, start);
        const after = code.slice(start);
        const newCode = before + openChar + closeChar + after;
        const newPos = start + openChar.length;
        updateCodeAndCursor(newCode, newPos);
      }
    },
    [code, updateCodeAndCursor]
  );

  // Insert simple text symbol at current cursor position
  const insertSymbol = useCallback(
    (textToInsert: string) => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? 0;
      const end = textarea?.selectionEnd ?? 0;
      const before = code.slice(0, start);
      const after = code.slice(end);
      const newCode = before + textToInsert + after;
      const newPos = start + textToInsert.length;
      updateCodeAndCursor(newCode, newPos);
    },
    [code, updateCodeAndCursor]
  );

  // Insert 4 spaces for standard PEP 8 Python indentation
  const insertPythonTab = useCallback(() => {
    insertSymbol('    ');
  }, [insertSymbol]);

  // Handle BeforeInput event for mobile browsers / touch keyboards
  const handleBeforeInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const inputEvent = e.nativeEvent as InputEvent;
    if (!inputEvent || !inputEvent.data) return;
    const data = inputEvent.data;

    if (data === "'" || data === '"') {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;

      // Wrap selection
      if (start !== end) {
        e.preventDefault();
        const selectedText = code.slice(start, end);
        const before = code.slice(0, start);
        const after = code.slice(end);
        const newCode = before + data + selectedText + data + after;
        updateCodeAndCursor(newCode, end + 1);
        return;
      }

      // Overtype if cursor is directly before identical quote
      if (code[start] === data) {
        e.preventDefault();
        textarea.setSelectionRange(start + 1, start + 1);
        updateCursorPosition(true);
        return;
      }

      // Auto-pair quotes '' or "" with cursor in the middle
      e.preventDefault();
      const before = code.slice(0, start);
      const after = code.slice(start);
      const newCode = before + data + data + after;
      updateCodeAndCursor(newCode, start + 1);
    }
  };

  // Keyboard events: Auto-indentation, Arrow-key autocomplete navigation, Enter validation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. If Autocomplete popup is open:
    if (autocompleteOpen && completions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setAutocompleteIndex((prev) => (prev + 1) % completions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setAutocompleteIndex((prev) => (prev - 1 + completions.length) % completions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        const selected = completions[autocompleteIndex] || completions[0];
        if (selected) {
          applyCompletion(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setAutocompleteOpen(false);
        return;
      }
    }

    // 2. Explicit Autocomplete trigger (Ctrl+Space or Cmd+Space)
    if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
      e.preventDefault();
      setAutocompleteOpen(true);
      updateCursorPosition(true);
      return;
    }

    // 3. Auto-closing quotes (' and ") and brackets:
    if (e.key === "'" || e.key === '"' || e.key === '(' || e.key === '[' || e.key === '{') {
      const char = e.key;
      const matchingChar: Record<string, string> = {
        "'": "'",
        '"': '"',
        '(': ')',
        '[': ']',
        '{': '}',
      };
      const closer = matchingChar[char];
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;

      // Case A: Text is selected -> wrap selection in quotes or brackets
      if (start !== end) {
        e.preventDefault();
        const selectedText = code.slice(start, end);
        const before = code.slice(0, start);
        const after = code.slice(end);
        const newCode = before + char + selectedText + closer + after;
        updateCodeAndCursor(newCode, end + 1);
        return;
      }

      // Case B: Overtype closing quote if already present right after cursor
      if ((char === "'" || char === '"') && code[start] === char) {
        e.preventDefault();
        textareaRef.current?.setSelectionRange(start + 1, start + 1);
        updateCursorPosition(true);
        return;
      }

      // Case C: Insert matching pair and place cursor in the middle ('|' or "|")
      e.preventDefault();
      const before = code.slice(0, start);
      const after = code.slice(start);
      const newCode = before + char + closer + after;
      updateCodeAndCursor(newCode, start + 1);
      return;
    }

    // 4. Overtype closing brackets if typed right before them
    if (e.key === ')' || e.key === ']' || e.key === '}') {
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;
      if (start === end && code[start] === e.key) {
        e.preventDefault();
        textareaRef.current?.setSelectionRange(start + 1, start + 1);
        updateCursorPosition(true);
        return;
      }
    }

    // 5. Backspace between pairs: delete both quotes/brackets if cursor is between them
    if (e.key === 'Backspace') {
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;
      if (start === end && start > 0) {
        const prevChar = code[start - 1];
        const nextChar = code[start];
        const isPair =
          (prevChar === "'" && nextChar === "'") ||
          (prevChar === '"' && nextChar === '"') ||
          (prevChar === '(' && nextChar === ')') ||
          (prevChar === '[' && nextChar === ']') ||
          (prevChar === '{' && nextChar === '}');

        if (isPair) {
          e.preventDefault();
          const before = code.slice(0, start - 1);
          const after = code.slice(start + 1);
          onChange(before + after);
          setTimeout(() => {
            textareaRef.current?.setSelectionRange(start - 1, start - 1);
            updateCursorPosition(true);
          }, 0);
          return;
        }
      }
    }

    // 3. Tab Key: Insert 4 spaces (Standard PEP 8 Indentation)
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart ?? 0;
      const end = textareaRef.current?.selectionEnd ?? 0;

      if (!e.shiftKey) {
        // Simple insert 4 spaces
        const before = code.slice(0, start);
        const after = code.slice(end);
        onChange(before + '    ' + after);
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(start + 4, start + 4);
          updateCursorPosition();
        }, 0);
      } else {
        // Shift+Tab: Unindent 4 spaces
        const currentLineText = lines[cursorLine - 1] || '';
        if (currentLineText.startsWith('    ')) {
          const lineStartOffset = code.lastIndexOf('\n', start - 1) + 1;
          const newCode = code.slice(0, lineStartOffset) + currentLineText.slice(4) + code.slice(lineStartOffset + currentLineText.length);
          onChange(newCode);
          setTimeout(() => {
            textareaRef.current?.setSelectionRange(Math.max(lineStartOffset, start - 4), Math.max(lineStartOffset, end - 4));
            updateCursorPosition();
          }, 0);
        }
      }
      return;
    }

    // 4. Enter Key: Intelligent Python Auto-Indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart ?? 0;
      const textBeforeCursor = code.slice(0, start);
      const textAfterCursor = code.slice(start);
      const currentLineText = lines[cursorLine - 1] || '';

      // Count leading spaces of current line
      const match = currentLineText.match(/^(\s*)/);
      let indent = match ? match[1] : '';

      // Check if cursor is right after ':', '{', '(', or '['
      const lastChar = textBeforeCursor.trim().slice(-1);
      const isBlockOpener = lastChar === ':' || lastChar === '{' || lastChar === '(' || lastChar === '[';
      const isClosingRightAfter = textAfterCursor.trim().startsWith('}') || textAfterCursor.trim().startsWith(')') || textAfterCursor.trim().startsWith(']');

      if (isBlockOpener) {
        const extraIndent = '    '; // PEP 8 standard 4-spaces
        if (isClosingRightAfter) {
          // Put closing bracket on next line with original indent
          const insertText = `\n${indent}${extraIndent}\n${indent}`;
          onChange(textBeforeCursor + insertText + textAfterCursor);
          setTimeout(() => {
            const newPos = start + 1 + indent.length + extraIndent.length;
            textareaRef.current?.setSelectionRange(newPos, newPos);
            updateCursorPosition();
          }, 0);
          return;
        } else {
          indent += extraIndent;
        }
      }

      onChange(textBeforeCursor + '\n' + indent + textAfterCursor);
      setTimeout(() => {
        const newPos = start + 1 + indent.length;
        textareaRef.current?.setSelectionRange(newPos, newPos);
        updateCursorPosition();
      }, 0);
      return;
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If navigating through autocomplete, do not reset index
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }
    updateCursorPosition(true);
  };

  // Tokenize lines for rendering in C (C99/C11) or Rust (2021)
  const tokenizedLines = useMemo(() => {
    let inBlockComment = false;
    return lines.map((line) => {
      const res = language === 'rust'
        ? tokenizeRustLine(line, inBlockComment)
        : tokenizeCLine(line, inBlockComment);
      inBlockComment = res.inBlockComment;
      return res.tokens;
    });
  }, [lines, language]);

  const charWidthPx = 7.8; // monospace character width in JetBrains Mono 13px

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="relative flex-1 h-full overflow-hidden flex font-mono text-[13px] leading-[22px] select-text"
        style={{
          backgroundColor: activeTheme.colors.editorBg,
          color: activeTheme.colors.syntaxDefault,
        }}
      >
      {/* 1. Gutter / Line Numbers */}
      <div
        ref={gutterRef}
        className="w-12 shrink-0 select-none overflow-hidden text-right pr-3 border-r"
        style={{
          backgroundColor: activeTheme.colors.editorGutterBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.editorLineNumber,
        }}
      >
        <div style={{ height: `${lines.length * 22 + 40}px` }} className="pt-2">
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const isCur = lineNum === cursorLine;
            const lineDiags = diagnosticsByLine.get(lineNum);
            const hasError = lineDiags?.some((d) => d.severity === 'error');
            const hasWarning = lineDiags?.some((d) => d.severity === 'warning');
            const errorDiag = lineDiags?.find((d) => d.severity === 'error') || lineDiags?.[0];

            return (
              <div
                key={lineNum}
                className={`h-[22px] flex items-center justify-end gap-1.5 relative group px-1 rounded-xs transition-colors ${
                  hasError ? 'bg-red-500/25 text-red-400 font-bold' : ''
                }`}
                style={{
                  color: hasError
                    ? '#f87171'
                    : isCur
                    ? activeTheme.colors.editorLineNumberActive
                    : activeTheme.colors.editorLineNumber,
                  fontWeight: isCur || hasError ? 'bold' : 'normal',
                }}
              >
                {/* Pulsing Red Dot in the Margin for Automatic Errors */}
                {hasError && errorDiag ? (
                  <div
                    className="relative flex items-center justify-center w-3 h-3 cursor-pointer shrink-0"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredDiagnostic({
                        diag: errorDiag,
                        x: rect.right + 10,
                        y: Math.min(rect.top - 10, window.innerHeight - 260),
                      });
                    }}
                    onMouseLeave={() => setHoveredDiagnostic(null)}
                    title="Erreur détectée automatiquement • Cliquez ou survolez pour voir la solution"
                  >
                    {/* Glowing Ping Pulsation */}
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-red-500 opacity-80 animate-ping" />
                    {/* Pulsing Glow Ring */}
                    <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-500/50 animate-pulse" />
                    {/* Solid Vibrant Red Core */}
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 ring-1 ring-red-400 shadow-sm" />
                  </div>
                ) : hasWarning ? (
                  <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
                    <span className="inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </div>
                ) : null}
                <span className="tabular-nums">{lineNum}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Main Editor Area: Indent Guides + Syntax Tokens + Invisible Textarea */}
      <div className="relative flex-1 h-full overflow-hidden">
        {/* Layer A: Active Line Highlight & Visible Red Error Lines */}
        <div
          className="absolute left-0 right-0 pointer-events-none transition-all duration-75"
          style={{
            top: `${(cursorLine - 1) * 22 + 8}px`,
            height: '22px',
            backgroundColor: activeTheme.colors.activeLineBg,
            zIndex: 1,
          }}
        />

        {/* Lignes en rouge très visibles pour chaque anomalie */}
        {lines.map((_, lineIdx) => {
          const lineNum = lineIdx + 1;
          const lineDiags = diagnosticsByLine.get(lineNum);
          const hasError = lineDiags?.some((d) => d.severity === 'error');
          if (!hasError) return null;

          return (
            <div
              key={`err-row-${lineIdx}`}
              className="absolute left-0 right-0 pointer-events-none bg-red-500/20 border-l-4 border-red-500 shadow-[inset_0_0_10px_rgba(239,68,68,0.25)] transition-all duration-150"
              style={{
                top: `${lineIdx * 22 + 8}px`,
                height: '22px',
                zIndex: 1,
              }}
            />
          );
        })}

        {/* Layer B: Vertical Indent Guides & Syntax Highlighted Text */}
        <div
          ref={codeOverlayRef}
          className="absolute inset-0 overflow-hidden pointer-events-none px-4 pt-2 whitespace-pre"
          style={{ zIndex: 2 }}
        >
          <div style={{ height: `${lines.length * 22 + 60}px` }}>
            {lines.map((line, lineIdx) => {
              const lineNum = lineIdx + 1;
              const indentInfo = lineIndentInfos[lineIdx];
              const tokens = tokenizedLines[lineIdx];
              const lineDiags = diagnosticsByLine.get(lineNum);

              return (
                <div key={lineIdx} className="h-[22px] relative flex items-center">
                  {/* Vertical Indent Guides: lines connecting top to bottom */}
                  {indentInfo && indentInfo.indentGuidesCount > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {Array.from({ length: indentInfo.indentGuidesCount }).map((_, guideIdx) => {
                        const guideLeftPx = guideIdx * 4 * charWidthPx;
                        const isGuideActive = activeGuideLevel === guideIdx;

                        return (
                          <div
                            key={guideIdx}
                            className="absolute top-0 bottom-0"
                            style={{
                              left: `${guideLeftPx}px`,
                              width: '1px',
                              backgroundColor: isGuideActive
                                ? activeTheme.colors.indentGuideActive
                                : activeTheme.colors.indentGuide,
                              opacity: isGuideActive ? 1 : 0.6,
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Highlighted Tokens with Squiggly Errors */}
                  <span className="relative z-10">
                    {tokens.map((token, tIdx) => {
                      const tokenColor = getTokenColor(token, activeTheme);

                      // Check if this token or line has an error
                      const hasLineError = lineDiags?.some((d) => d.severity === 'error');
                      const hasLineWarning = lineDiags?.some((d) => d.severity === 'warning');

                      // Apply squiggly underline on the end of line or specific token
                      const isLastToken = tIdx === tokens.length - 1;
                      const showSquiggle = isLastToken && (hasLineError || hasLineWarning);

                      return (
                        <span
                          key={tIdx}
                          style={{
                            color: tokenColor,
                            fontStyle: token.type === 'comment' ? 'italic' : 'normal',
                          }}
                          className={
                            showSquiggle
                              ? hasLineError
                                ? 'squiggly-error'
                                : 'squiggly-warning'
                              : ''
                          }
                        >
                          {token.value}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Layer C: Interactive Textarea for Input */}
        <textarea
          id="python-code-editor-textarea"
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            const val = e.target.value;
            const curPos = e.target.selectionStart;

            // Mobile IME fallback: if 1 char was just inserted and it's ' or "
            if (val.length === code.length + 1 && curPos > 0) {
              const typedChar = val[curPos - 1];
              if (typedChar === "'" || typedChar === '"') {
                const nextChar = val[curPos];
                if (nextChar !== typedChar) {
                  const augmentedVal = val.slice(0, curPos) + typedChar + val.slice(curPos);
                  updateCodeAndCursor(augmentedVal, curPos);
                  return;
                }
              }
            }

            onChange(val);
            updateCursorPosition(true);
          }}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={() => updateCursorPosition(true)}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="absolute inset-0 w-full h-full p-0 px-4 pt-2 font-mono text-[13px] leading-[22px] bg-transparent resize-none outline-none border-none whitespace-pre overflow-auto"
          style={{
            zIndex: 3,
            color: 'transparent',
            caretColor: activeTheme.colors.cursorColor,
          }}
        />

        {/* Layer D: Autocomplete Intellisense Popup */}
        {autocompleteOpen && completions.length > 0 && (
          <div
            className="absolute z-40 rounded-lg shadow-2xl border text-xs overflow-hidden w-80 max-w-[calc(100vw-24px)] animate-in fade-in-50 duration-75"
            style={{
              top: `${Math.min(autocompletePos.top, window.innerHeight - 340)}px`,
              left: `${Math.max(8, Math.min(autocompletePos.left, window.innerWidth - 330))}px`,
              backgroundColor: activeTheme.colors.sidebarBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.textPrimary,
            }}
          >
            {/* Autocomplete Header */}
            <div
              className="flex items-center justify-between px-2.5 py-1 text-[10px] font-sans font-semibold border-b opacity-75"
              style={{
                backgroundColor: activeTheme.colors.tabInactiveBg,
                borderColor: activeTheme.colors.border,
              }}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Complétion Python (↑ ↓ flèches, Entrée pour valider)</span>
              </div>
              <span className="font-mono text-[9px]">Python 3.12</span>
            </div>

            {/* Candidates List */}
            <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
              {completions.map((item, idx) => {
                const isSelected = idx === autocompleteIndex;
                return (
                  <div
                    key={item.id}
                    ref={isSelected ? activeOptionRef : undefined}
                    onClick={() => applyCompletion(item)}
                    className="flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? activeTheme.colors.activeLineBg
                        : 'transparent',
                      color: isSelected
                        ? activeTheme.colors.accent
                        : activeTheme.colors.textPrimary,
                      borderLeft: isSelected
                        ? `2px solid ${activeTheme.colors.accent}`
                        : '2px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="text-[9px] px-1 py-0.2 rounded uppercase font-bold shrink-0 font-sans"
                        style={{
                          backgroundColor: getKindBadgeColor(item.kind),
                          color: '#000000',
                        }}
                      >
                        {item.kind.slice(0, 4)}
                      </span>
                      <span className="font-mono font-semibold truncate">
                        {item.label}
                      </span>
                    </div>

                    <span className="text-[10px] opacity-60 font-mono truncate max-w-[120px]">
                      {item.detail}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Selected item documentation footer */}
            {completions[autocompleteIndex]?.documentation && (
              <div
                className="px-2.5 py-1.5 text-[11px] font-sans border-t opacity-85 leading-snug"
                style={{
                  backgroundColor: activeTheme.colors.editorGutterBg,
                  borderColor: activeTheme.colors.border,
                }}
              >
                {completions[autocompleteIndex].documentation}
              </div>
            )}
          </div>
        )}
      </div>

        {/* Floating Error Diagnosis Tooltip (Pourquoi & Comment réparer) */}
        {hoveredDiagnostic && (
          <div
            className="fixed z-50 rounded-lg shadow-2xl border p-3.5 max-w-md font-sans text-xs animate-in fade-in-50 duration-100 pointer-events-none"
            style={{
              top: `${hoveredDiagnostic.y}px`,
              left: `${hoveredDiagnostic.x}px`,
              backgroundColor: activeTheme.colors.sidebarBg,
              borderColor: activeTheme.colors.errorText,
              color: activeTheme.colors.textPrimary,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1.5 pb-1 border-b" style={{ borderColor: activeTheme.colors.border }}>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-bold text-red-500 text-[11px] uppercase tracking-wider">
                Analyse Statique Python • Ligne {hoveredDiagnostic.diag.line}
              </span>
              {hoveredDiagnostic.diag.code && (
                <span className="ml-auto font-mono text-[10px] px-1.5 py-0.2 rounded border opacity-60">
                  {hoveredDiagnostic.diag.code}
                </span>
              )}
            </div>

            <p className="font-semibold text-xs mb-2 text-rose-400">
              {hoveredDiagnostic.diag.message}
            </p>

            {/* Pourquoi c'est une erreur */}
            <div className="mb-2 p-2 rounded bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <span className="font-bold text-[11px] text-amber-400 block mb-0.5">
                ❓ Pourquoi c'est une erreur :
              </span>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {hoveredDiagnostic.diag.whyExplanation}
              </p>
            </div>

            {/* Comment la réparer */}
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="font-bold text-[11px] text-emerald-400 block mb-0.5">
                💡 Comment la réparer :
              </span>
              <p className="text-[11px] opacity-90 leading-relaxed mb-1">
                {hoveredDiagnostic.diag.howToFix}
              </p>
              {hoveredDiagnostic.diag.suggestedCodeSnippet && (
                <pre className="font-mono text-[10px] p-1.5 rounded bg-black/20 text-emerald-300 overflow-x-auto whitespace-pre">
                  {hoveredDiagnostic.diag.suggestedCodeSnippet}
                </pre>
              )}
            </div>
          </div>
        )}

      {/* Editor Status Bar Helper */}
      <div
        className="absolute bottom-1 right-4 z-20 pointer-events-none text-[11px] font-mono px-2 py-0.5 rounded opacity-60 flex items-center gap-3"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          color: activeTheme.colors.textPrimary,
        }}
      >
        <span>Ln {cursorLine}, Col {cursorCol}</span>
        <span>Espaces: 4 (PEP 8)</span>
        <span>UTF-8</span>
      </div>
    </div>

    {/* Visible Error & Correction Suggestion Banner */}
    {activeDiagnostic && (
      <div
        className="border-t px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shrink-0 select-text animate-in slide-in-from-bottom-2 duration-150 z-30"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderTopColor: activeDiagnostic.severity === 'error' ? '#ef4444' : '#f59e0b',
        }}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px] ${
              activeDiagnostic.severity === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {activeDiagnostic.severity === 'error' ? '!' : 'i'}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`font-bold ${
                  activeDiagnostic.severity === 'error' ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                Ligne {activeDiagnostic.line} :
              </span>
              <span className="font-semibold">{activeDiagnostic.message}</span>
            </div>
            <div className="text-[11px] text-amber-200/90 flex items-start sm:items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-amber-400 shrink-0">💡 Suggestion de correction :</span>
              <span>{activeDiagnostic.howToFix}</span>
            </div>
          </div>
        </div>

        {activeDiagnostic.suggestedCodeSnippet && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                const lineIdx = activeDiagnostic.line - 1;
                const newLines = [...lines];
                if (lineIdx >= 0 && lineIdx < newLines.length) {
                  newLines[lineIdx] = activeDiagnostic.suggestedCodeSnippet!;
                  onChange(newLines.join('\n'));
                }
              }}
              className="px-2.5 py-1 rounded font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: activeDiagnostic.severity === 'error' ? '#ef4444' : activeTheme.colors.accent,
                color: '#ffffff',
              }}
              title="Remplacer automatiquement la ligne par la correction suggérée"
            >
              <span>⚡ Appliquer la correction</span>
            </button>
          </div>
        )}
      </div>
    )}

    {/* Mobile Ergonomic Quick Symbol Bar: fast Python typing for smartphones (phones only) */}
    <div
      className="md:hidden shrink-0 border-t flex items-center gap-1 px-2 py-1.5 overflow-x-auto select-none no-scrollbar shadow-inner"
      style={{
        backgroundColor: activeTheme.colors.tabBarBg,
        borderColor: activeTheme.colors.border,
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertPythonTab}
        className="px-2.5 py-1 rounded text-xs font-mono font-semibold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
        title="Indentation 4 espaces"
      >
        Tab
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol(';')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.accent,
        }}
        title="Point-virgule (;)"
      >
        ;
      </button>

      {language === 'rust' ? (
        <>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('::')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Chemin / Scope (::)"
          >
            ::
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('-> ')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Type de retour (->)"
          >
            -&gt;
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol(' => ')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxKeyword,
            }}
            title="Branche match (=>)"
          >
            =&gt;
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('&')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Emprunt / Référence (&)"
          >
            &
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('mut ')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxKeyword,
            }}
            title="Mutable (mut)"
          >
            mut
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('println!("{}");')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.accent,
            }}
            title="Macro println!()"
          >
            println!
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('*')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Pointeur / Déréférencement (*)"
          >
            *
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('&')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Adresse mémoire (&)"
          >
            &
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('->')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxOperator,
            }}
            title="Opérateur flèche structure (->)"
          >
            -&gt;
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertSymbol('// ')}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
            style={{
              backgroundColor: activeTheme.colors.tabInactiveBg,
              borderColor: activeTheme.colors.border,
              color: activeTheme.colors.syntaxComment,
            }}
            title="Commentaire (//)"
          >
            //
          </button>
        </>
      )}

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertPair("'", "'")}
        className="px-3 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.syntaxString,
        }}
        title="Guillemets simples doubles '' avec curseur au milieu"
      >
        ' '
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertPair('"', '"')}
        className="px-3 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.syntaxString,
        }}
        title='Guillemets doubles "" avec curseur au milieu'
      >
        " "
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertPair('(', ')')}
        className="px-3 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
        title="Parenthèses ()"
      >
        ( )
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertPair('[', ']')}
        className="px-3 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
        title="Crochets []"
      >
        [ ]
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertPair('{', '}')}
        className="px-3 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
        title="Accolades {}"
      >
        {'{ }'}
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol(' == ')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        ==
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol('.')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        .
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol(', ')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        ,
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol('_')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.textPrimary,
        }}
      >
        _
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol(' => ')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.syntaxKeyword,
        }}
        title="Flèche =>"
      >
        =&gt;
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol('!')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.syntaxOperator,
        }}
      >
        !
      </button>

      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => insertSymbol('?')}
        className="px-2.5 py-1 rounded text-xs font-mono font-bold border shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: activeTheme.colors.tabInactiveBg,
          borderColor: activeTheme.colors.border,
          color: activeTheme.colors.syntaxOperator,
        }}
      >
        ?
      </button>
    </div>
  </div>
  );
};

function getTokenColor(token: Token, theme: PythonTheme): string {
  switch (token.type) {
    case 'keyword':
      return theme.colors.syntaxKeyword;
    case 'type':
      return theme.colors.syntaxType;
    case 'string':
    case 'char':
      return theme.colors.syntaxString;
    case 'preprocessor':
      return theme.colors.syntaxAnnotation;
    case 'number':
      return theme.colors.syntaxNumber;
    case 'comment':
      return theme.colors.syntaxComment;
    case 'function':
      return theme.colors.syntaxFunction;
    case 'operator':
      return theme.colors.syntaxOperator;
    case 'punctuation':
      return theme.colors.textSecondary;
    case 'identifier':
      return theme.colors.syntaxVariable;
    default:
      return theme.colors.syntaxDefault;
  }
}

function getKindBadgeColor(kind: string): string {
  switch (kind) {
    case 'snippet':
      return '#f59e0b'; // amber
    case 'keyword':
      return '#c084fc'; // purple
    case 'type':
      return '#38bdf8'; // sky
    case 'method':
    case 'function':
      return '#4ade80'; // emerald
    case 'variable':
      return '#2dd4bf'; // teal
    case 'property':
      return '#fb7185'; // rose
    default:
      return '#e2e8f0';
  }
}
