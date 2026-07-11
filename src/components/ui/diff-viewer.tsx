import * as React from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface DiffViewerProps {
  patch: string;
  filename?: string | null;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ patch, filename }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(patch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy patch', err);
    }
  };

  const lines = React.useMemo(() => {
    if (!patch) return [];
    return patch.split('\n');
  }, [patch]);

  // A very simple parse of line numbers for unified diff
  let oldLineNum = 0;
  let newLineNum = 0;

  const parsedLines = React.useMemo(() => {
    return lines.map((line) => {
      let type: 'addition' | 'deletion' | 'header' | 'normal' = 'normal';
      let oldDisplay = '';
      let newDisplay = '';

      if (line.startsWith('+++') || line.startsWith('---') || line.startsWith('Index:') || line.startsWith('diff --git')) {
        type = 'header';
      } else if (line.startsWith('@@')) {
        type = 'header';
        // Parse @@ -oldStart,oldCount +newStart,newCount @@
        const match = line.match(/^@@\s+-(\d+),?\d*\s+\+(\d+),?\d*\s+@@/);
        if (match) {
          oldLineNum = parseInt(match[1], 10) - 1;
          newLineNum = parseInt(match[2], 10) - 1;
        }
      } else if (line.startsWith('+')) {
        type = 'addition';
        newLineNum++;
        newDisplay = newLineNum.toString();
      } else if (line.startsWith('-')) {
        type = 'deletion';
        oldLineNum++;
        oldDisplay = oldLineNum.toString();
      } else {
        oldLineNum++;
        newLineNum++;
        oldDisplay = oldLineNum.toString();
        newDisplay = newLineNum.toString();
      }

      return {
        content: line,
        type,
        oldLineNum: oldDisplay,
        newLineNum: newDisplay,
      };
    });
  }, [lines]);

  return (
    <div className="border border-surface-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
      {/* Diff Toolbar */}
      <div className="bg-surface-50 border-b border-surface-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-surface-700">
          <FileCode className="w-4 h-4 text-surface-500" />
          <span className="text-xs font-semibold font-mono tracking-tight text-surface-800">
            {filename || 'patch.diff'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md hover:bg-surface-200/60 active:bg-surface-200 text-surface-500 hover:text-surface-800 transition-smooth border border-surface-200/30 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Copy patch content"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Patch</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Output */}
      <div className="overflow-x-auto max-h-[450px] bg-surface-900 text-surface-100 font-mono text-xs leading-5">
        <table className="w-full border-collapse select-text">
          <tbody>
            {parsedLines.map((line, idx) => {
              let bgClass = 'hover:bg-surface-800/40';
              let textClass = 'text-surface-300';
              let sign = ' ';

              if (line.type === 'addition') {
                bgClass = 'bg-emerald-950/40 hover:bg-emerald-950/60';
                textClass = 'text-emerald-300';
                sign = '+';
              } else if (line.type === 'deletion') {
                bgClass = 'bg-red-950/30 hover:bg-red-950/50';
                textClass = 'text-red-300';
                sign = '-';
              } else if (line.type === 'header') {
                bgClass = 'bg-surface-800/70';
                textClass = 'text-brand-200 font-semibold';
                sign = ' ';
              }

              return (
                <tr key={idx} className={`${bgClass} transition-colors group`}>
                  {/* Old Line Number */}
                  <td className="w-10 text-right pr-3 select-none text-[10px] text-surface-500 border-r border-surface-800/80 font-mono">
                    {line.oldLineNum}
                  </td>
                  {/* New Line Number */}
                  <td className="w-10 text-right pr-3 select-none text-[10px] text-surface-500 border-r border-surface-800/80 font-mono">
                    {line.newLineNum}
                  </td>
                  {/* Sign (+/-) */}
                  <td className={`w-6 text-center select-none font-bold font-mono pl-1 ${
                    line.type === 'addition' ? 'text-emerald-400' : line.type === 'deletion' ? 'text-red-400' : 'text-surface-600'
                  }`}>
                    {sign}
                  </td>
                  {/* Code Line */}
                  <td className={`px-4 py-0.5 whitespace-pre font-mono ${textClass}`}>
                    {line.type === 'addition' || line.type === 'deletion'
                      ? line.content.slice(1)
                      : line.content}
                  </td>
                </tr>
              );
            })}
            {parsedLines.length === 0 && (
              <tr>
                <td className="p-4 text-center text-surface-500 italic" colSpan={4}>
                  No changes in this run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
