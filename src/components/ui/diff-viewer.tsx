'use client';

import * as React from 'react';
import { Copy, Check, FileCode, Columns, AlignJustify, Download } from 'lucide-react';

interface DiffViewerProps {
  patch: string;
  filename?: string | null;
}

type ParsedLine = {
  content: string;
  type: 'addition' | 'deletion' | 'header' | 'normal';
  oldLineNum: string;
  newLineNum: string;
};

type SplitLine = {
  left?: {
    lineNum: string;
    content: string;
    type: 'deletion' | 'header' | 'normal' | 'empty';
  };
  right?: {
    lineNum: string;
    content: string;
    type: 'addition' | 'header' | 'normal' | 'empty';
  };
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ patch, filename }) => {
  const [copied, setCopied] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'unified' | 'split'>('unified');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(patch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy patch', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([patch], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (filename ? filename.replace(/[/\\]/g, '_') : 'patch') + '.diff';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = React.useMemo(() => {
    if (!patch) return [];
    return patch.split('\n');
  }, [patch]);

  const { parsedLines, additions, deletions } = React.useMemo(() => {
    let oldNum = 0;
    let newNum = 0;
    let adds = 0;
    let dels = 0;

    const parsed: ParsedLine[] = lines.map((line) => {
      let type: ParsedLine['type'] = 'normal';
      let oldDisplay = '';
      let newDisplay = '';

      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('Index:') || line.startsWith('diff --git')) {
        type = 'header';
      } else if (line.startsWith('@@')) {
        type = 'header';
        const match = line.match(/^@@\s+-(\d+),?\d*\s+\+(\d+),?\d*\s+@@/);
        if (match) {
          oldNum = parseInt(match[1], 10) - 1;
          newNum = parseInt(match[2], 10) - 1;
        }
      } else if (line.startsWith('+')) {
        type = 'addition';
        adds++;
        newNum++;
        newDisplay = newNum.toString();
      } else if (line.startsWith('-')) {
        type = 'deletion';
        dels++;
        oldNum++;
        oldDisplay = oldNum.toString();
      } else {
        oldNum++;
        newNum++;
        oldDisplay = oldNum.toString();
        newDisplay = newNum.toString();
      }

      return {
        content: line,
        type,
        oldLineNum: oldDisplay,
        newLineNum: newDisplay,
      };
    });

    return { parsedLines: parsed, additions: adds, deletions: dels };
  }, [lines]);

  // Construct split side-by-side rows
  const splitRows = React.useMemo(() => {
    const rows: SplitLine[] = [];
    let i = 0;

    while (i < parsedLines.length) {
      const line = parsedLines[i];

      if (line.type === 'header') {
        rows.push({
          left: { lineNum: '', content: line.content, type: 'header' },
          right: { lineNum: '', content: line.content, type: 'header' },
        });
        i++;
      } else if (line.type === 'normal') {
        rows.push({
          left: { lineNum: line.oldLineNum, content: line.content, type: 'normal' },
          right: { lineNum: line.newLineNum, content: line.content, type: 'normal' },
        });
        i++;
      } else if (line.type === 'deletion') {
        // Collect batch of deletions
        const delBatch: ParsedLine[] = [];
        while (i < parsedLines.length && parsedLines[i].type === 'deletion') {
          delBatch.push(parsedLines[i]);
          i++;
        }
        // Collect following additions
        const addBatch: ParsedLine[] = [];
        while (i < parsedLines.length && parsedLines[i].type === 'addition') {
          addBatch.push(parsedLines[i]);
          i++;
        }

        const maxLen = Math.max(delBatch.length, addBatch.length);
        for (let j = 0; j < maxLen; j++) {
          const d = delBatch[j];
          const a = addBatch[j];
          rows.push({
            left: d
              ? { lineNum: d.oldLineNum, content: d.content.slice(1), type: 'deletion' }
              : { lineNum: '', content: '', type: 'empty' },
            right: a
              ? { lineNum: a.newLineNum, content: a.content.slice(1), type: 'addition' }
              : { lineNum: '', content: '', type: 'empty' },
          });
        }
      } else if (line.type === 'addition') {
        rows.push({
          left: { lineNum: '', content: '', type: 'empty' },
          right: { lineNum: line.newLineNum, content: line.content.slice(1), type: 'addition' },
        });
        i++;
      } else {
        i++;
      }
    }

    return rows;
  }, [parsedLines]);

  return (
    <div className="border border-slate-700/80 rounded-xl overflow-hidden bg-slate-900 shadow-xl flex flex-col font-sans transition-all">
      {/* Diff Toolbar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FileCode className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold font-mono tracking-tight text-slate-200">
            {filename || 'patch.diff'}
          </span>
          <div className="flex items-center gap-1.5 ml-1 text-[11px] font-mono font-semibold">
            {additions > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                +{additions}
              </span>
            )}
            {deletions > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-400">
                -{deletions}
              </span>
            )}
          </div>
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-2">
          {/* Unified vs Split view toggle */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'unified'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Unified View"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Split View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Download Patch (.diff)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
            title="Copy patch content"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diff Output Area */}
      {viewMode === 'unified' ? (
        <div className="overflow-x-auto max-h-[460px] bg-slate-950 text-slate-200 font-mono text-[11px] leading-5">
          <table className="w-full border-collapse select-text">
            <tbody>
              {parsedLines.map((line, idx) => {
                let bgClass = 'hover:bg-slate-900/60';
                let textClass = 'text-slate-300';
                let sign = ' ';

                if (line.type === 'addition') {
                  bgClass = 'bg-emerald-950/40 hover:bg-emerald-950/60 border-l-2 border-emerald-500';
                  textClass = 'text-emerald-300 font-semibold';
                  sign = '+';
                } else if (line.type === 'deletion') {
                  bgClass = 'bg-red-950/30 hover:bg-red-950/50 border-l-2 border-red-500';
                  textClass = 'text-red-300';
                  sign = '-';
                } else if (line.type === 'header') {
                  bgClass = 'bg-slate-900/80 border-y border-slate-800/80';
                  textClass = 'text-indigo-300 font-bold';
                  sign = ' ';
                }

                return (
                  <tr key={idx} className={`${bgClass} transition-colors group`}>
                    <td className="w-9 text-right pr-2 select-none text-[10px] text-slate-600 border-r border-slate-800/80 font-mono">
                      {line.oldLineNum}
                    </td>
                    <td className="w-9 text-right pr-2 select-none text-[10px] text-slate-600 border-r border-slate-800/80 font-mono">
                      {line.newLineNum}
                    </td>
                    <td
                      className={`w-6 text-center select-none font-bold font-mono pl-1 ${
                        line.type === 'addition'
                          ? 'text-emerald-400'
                          : line.type === 'deletion'
                          ? 'text-red-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {sign}
                    </td>
                    <td className={`px-3 py-0.5 whitespace-pre font-mono ${textClass}`}>
                      {line.type === 'addition' || line.type === 'deletion'
                        ? line.content.slice(1)
                        : line.content}
                    </td>
                  </tr>
                );
              })}
              {parsedLines.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-500 italic" colSpan={4}>
                    No patch diff generated for this failure.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Split Side-by-Side View */
        <div className="overflow-x-auto max-h-[460px] bg-slate-950 text-slate-200 font-mono text-[11px] leading-5">
          <table className="w-full border-collapse select-text table-fixed">
            <colgroup>
              <col className="w-9" />
              <col className="w-1/2" />
              <col className="w-9" />
              <col className="w-1/2" />
            </colgroup>
            <tbody>
              {splitRows.map((row, idx) => {
                const isHeader = row.left?.type === 'header';
                return (
                  <tr
                    key={idx}
                    className={`border-b border-slate-900/40 ${
                      isHeader ? 'bg-slate-900/80 text-indigo-300 font-bold' : ''
                    }`}
                  >
                    {/* Left Pane (Old / Deletion) */}
                    <td className="text-right pr-2 select-none text-[10px] text-slate-600 border-r border-slate-800 bg-slate-950/60 font-mono">
                      {row.left?.lineNum}
                    </td>
                    <td
                      className={`px-3 py-0.5 whitespace-pre font-mono border-r border-slate-800/80 overflow-hidden text-ellipsis ${
                        row.left?.type === 'deletion'
                          ? 'bg-red-950/35 text-red-300 border-l-2 border-red-500'
                          : row.left?.type === 'empty'
                          ? 'bg-slate-950/40 text-transparent'
                          : isHeader
                          ? 'text-indigo-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {row.left?.content || ' '}
                    </td>

                    {/* Right Pane (New / Addition) */}
                    <td className="text-right pr-2 select-none text-[10px] text-slate-600 border-r border-slate-800 bg-slate-950/60 font-mono">
                      {row.right?.lineNum}
                    </td>
                    <td
                      className={`px-3 py-0.5 whitespace-pre font-mono overflow-hidden text-ellipsis ${
                        row.right?.type === 'addition'
                          ? 'bg-emerald-950/40 text-emerald-300 font-semibold border-l-2 border-emerald-500'
                          : row.right?.type === 'empty'
                          ? 'bg-slate-950/40 text-transparent'
                          : isHeader
                          ? 'text-indigo-300'
                          : 'text-slate-300'
                      }`}
                    >
                      {row.right?.content || ' '}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
