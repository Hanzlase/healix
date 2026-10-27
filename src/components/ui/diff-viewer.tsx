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

  const { parsedLines, additions, deletions } = React.useMemo(() => {
    if (!patch) return { parsedLines: [], additions: 0, deletions: 0 };
    const rawLines = patch.split('\n');

    let oldCounter = 0;
    let newCounter = 0;
    let adds = 0;
    let dels = 0;

    const parsed: ParsedLine[] = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      let type: ParsedLine['type'] = 'normal';
      let oldDisplay = '';
      let newDisplay = '';

      if (
        line.startsWith('+++') ||
        line.startsWith('---') ||
        line.startsWith('Index:') ||
        line.startsWith('diff --git')
      ) {
        type = 'header';
      } else if (line.startsWith('@@')) {
        type = 'header';
        const match = line.match(/^@@\s+-(\d+),?\d*\s+\+(\d+),?\d*\s+@@/);
        if (match) {
          oldCounter = parseInt(match[1], 10) - 1;
          newCounter = parseInt(match[2], 10) - 1;
        }
      } else if (line.startsWith('+')) {
        type = 'addition';
        adds++;
        newCounter++;
        newDisplay = newCounter.toString();
      } else if (line.startsWith('-')) {
        type = 'deletion';
        dels++;
        oldCounter++;
        oldDisplay = oldCounter.toString();
      } else {
        oldCounter++;
        newCounter++;
        oldDisplay = oldCounter.toString();
        newDisplay = newCounter.toString();
      }

      parsed.push({
        content: line,
        type,
        oldLineNum: oldDisplay,
        newLineNum: newDisplay,
      });
    }

    return { parsedLines: parsed, additions: adds, deletions: dels };
  }, [patch]);

  const splitLines = React.useMemo<SplitLine[]>(() => {
    const rows: SplitLine[] = [];
    let i = 0;

    while (i < parsedLines.length) {
      const line = parsedLines[i];

      if (line.type === 'deletion') {
        const delLines: ParsedLine[] = [];
        while (i < parsedLines.length && parsedLines[i].type === 'deletion') {
          delLines.push(parsedLines[i]);
          i++;
        }

        const addLines: ParsedLine[] = [];
        while (i < parsedLines.length && parsedLines[i].type === 'addition') {
          addLines.push(parsedLines[i]);
          i++;
        }

        const maxPairs = Math.max(delLines.length, addLines.length);
        for (let k = 0; k < maxPairs; k++) {
          const leftLine = delLines[k];
          const rightLine = addLines[k];
          rows.push({
            left: leftLine
              ? { lineNum: leftLine.oldLineNum, content: leftLine.content, type: 'deletion' }
              : { lineNum: '', content: '', type: 'empty' },
            right: rightLine
              ? { lineNum: rightLine.newLineNum, content: rightLine.content, type: 'addition' }
              : { lineNum: '', content: '', type: 'empty' },
          });
        }
      } else if (line.type === 'addition') {
        rows.push({
          left: { lineNum: '', content: '', type: 'empty' },
          right: { lineNum: line.newLineNum, content: line.content, type: 'addition' },
        });
        i++;
      } else {
        rows.push({
          left: { lineNum: line.oldLineNum, content: line.content, type: line.type },
          right: { lineNum: line.newLineNum, content: line.content, type: line.type },
        });
        i++;
      }
    }

    return rows;
  }, [parsedLines]);

  if (!patch) {
    return (
      <div className="bg-[#191B19] border border-[#353934] rounded-lg p-6 text-center text-xs font-mono text-[#A0A49B]">
        No patch diff generated for this incident.
      </div>
    );
  }

  return (
    <div className="bg-[#191B19] border border-[#353934] rounded-lg overflow-hidden shadow-sm flex flex-col text-[#E8E9E3]">
      {/* Diff Toolbar */}
      <div className="px-3.5 py-2 bg-[#222522] border-b border-[#353934] flex items-center justify-between gap-3 text-xs flex-wrap">
        <div className="flex items-center gap-2 font-mono min-w-0">
          <FileCode className="w-3.5 h-3.5 text-[#A0A49B] flex-shrink-0" />
          <span className="font-semibold text-[#E8E9E3] truncate">
            {filename || 'Remediation.patch'}
          </span>
          <div className="flex items-center gap-1.5 ml-2 text-[11px]">
            <span className="px-1.5 py-0.2 rounded bg-[rgba(131,201,149,0.15)] text-[#83C995] font-semibold border border-[#83C995]/30">
              +{additions}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[rgba(229,140,133,0.15)] text-[#E58C85] font-semibold border border-[#E58C85]/30">
              -{deletions}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-[#191B19] p-0.5 rounded border border-[#353934]">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                viewMode === 'unified'
                  ? 'bg-[#353934] text-white'
                  : 'text-[#A0A49B] hover:text-[#E8E9E3]'
              }`}
              title="Unified View"
            >
              <AlignJustify className="w-3 h-3" />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                viewMode === 'split'
                  ? 'bg-[#353934] text-white'
                  : 'text-[#A0A49B] hover:text-[#E8E9E3]'
              }`}
              title="Split View"
            >
              <Columns className="w-3 h-3" />
              <span>Split</span>
            </button>
          </div>

          {/* Copy Patch */}
          <button
            onClick={handleCopy}
            className="px-2 py-1 rounded bg-[#191B19] hover:bg-[#2D312D] text-[#E8E9E3] border border-[#353934] text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Copy Raw Diff"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-[#83C995]" />
                <span className="text-[#83C995]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#A0A49B]" />
                <span>Copy Diff</span>
              </>
            )}
          </button>

          {/* Download Patch */}
          <button
            onClick={handleDownload}
            className="p-1 rounded bg-[#191B19] hover:bg-[#2D312D] text-[#A0A49B] hover:text-[#E8E9E3] border border-[#353934] transition-colors cursor-pointer"
            title="Download .diff"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Code Container */}
      <div className="overflow-x-auto font-mono text-[11px] leading-[20px] terminal-scroll max-h-[500px]">
        {viewMode === 'unified' ? (
          <table className="w-full border-collapse">
            <tbody>
              {parsedLines.map((line, idx) => {
                const isAdd = line.type === 'addition';
                const isDel = line.type === 'deletion';
                const isHdr = line.type === 'header';

                const rowBg = isAdd
                  ? 'bg-[rgba(131,201,149,0.12)]'
                  : isDel
                  ? 'bg-[rgba(229,140,133,0.12)]'
                  : isHdr
                  ? 'bg-[#222522]/80 text-[#A0A49B]'
                  : 'hover:bg-[#222522]/40';

                const textCol = isAdd
                  ? 'text-[#83C995]'
                  : isDel
                  ? 'text-[#E58C85]'
                  : isHdr
                  ? 'text-[#A0A49B] italic'
                  : 'text-[#E8E9E3]';

                return (
                  <tr key={idx} className={`${rowBg} transition-colors select-text`}>
                    <td className="w-10 text-right pr-2 select-none text-[#696D65] border-r border-[#353934]/60 font-mono text-[10px] tabular-nums">
                      {line.oldLineNum}
                    </td>
                    <td className="w-10 text-right pr-2 select-none text-[#696D65] border-r border-[#353934]/60 font-mono text-[10px] tabular-nums">
                      {line.newLineNum}
                    </td>
                    <td className="w-6 text-center select-none font-bold">
                      {isAdd && <span className="text-[#83C995]">+</span>}
                      {isDel && <span className="text-[#E58C85]">-</span>}
                    </td>
                    <td className={`pl-2 pr-4 whitespace-pre font-mono ${textCol}`}>
                      {line.content.replace(/^[+-]/, '')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Split View */
          <table className="w-full border-collapse">
            <tbody>
              {splitLines.map((row, idx) => {
                const left = row.left;
                const right = row.right;

                return (
                  <tr key={idx} className="border-b border-[#353934]/30">
                    {/* Left Column (Original/Deletion) */}
                    <td className="w-9 text-right pr-2 select-none text-[#696D65] bg-[#222522]/50 border-r border-[#353934]/60 text-[10px] tabular-nums">
                      {left?.lineNum || ''}
                    </td>
                    <td
                      className={`w-1/2 pl-2 pr-2 whitespace-pre border-r border-[#353934] ${
                        left?.type === 'deletion'
                          ? 'bg-[rgba(229,140,133,0.12)] text-[#E58C85]'
                          : left?.type === 'header'
                          ? 'bg-[#222522] text-[#A0A49B] italic'
                          : left?.type === 'empty'
                          ? 'bg-[#191B19]'
                          : 'text-[#E8E9E3]'
                      }`}
                    >
                      {left?.content ? left.content.replace(/^[-]/, '') : ''}
                    </td>

                    {/* Right Column (New/Addition) */}
                    <td className="w-9 text-right pr-2 select-none text-[#696D65] bg-[#222522]/50 border-r border-[#353934]/60 text-[10px] tabular-nums">
                      {right?.lineNum || ''}
                    </td>
                    <td
                      className={`w-1/2 pl-2 pr-2 whitespace-pre ${
                        right?.type === 'addition'
                          ? 'bg-[rgba(131,201,149,0.12)] text-[#83C995]'
                          : right?.type === 'header'
                          ? 'bg-[#222522] text-[#A0A49B] italic'
                          : right?.type === 'empty'
                          ? 'bg-[#191B19]'
                          : 'text-[#E8E9E3]'
                      }`}
                    >
                      {right?.content ? right.content.replace(/^[+]/, '') : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
