'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  className?: string;
}

export function CodeBlock({
  code,
  language = 'typescript',
  filename,
  showLineNumbers = true,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className={cn('terminal-window text-xs overflow-hidden', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          {filename && <span className="ml-2 font-mono text-[11px] text-zinc-400 font-medium">{filename}</span>}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors text-[11px]"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto font-mono leading-relaxed bg-[#0a0d14]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlighted = highlightLines.includes(lineNum);
              return (
                <tr
                  key={idx}
                  className={cn(
                    'transition-colors',
                    isHighlighted ? 'bg-primary/20 -mx-4 px-4' : 'hover:bg-white/[0.02]'
                  )}
                >
                  {showLineNumbers && (
                    <td className="w-8 pr-4 text-right select-none text-zinc-600 font-mono text-[11px]">
                      {lineNum}
                    </td>
                  )}
                  <td className="text-zinc-200 whitespace-pre font-mono text-[12px]">
                    {formatSyntax(line, language)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Lightweight syntax highlight styling without heavy bloat
function formatSyntax(line: string, _language: string): React.ReactNode {
  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }

  // Tokenize basic keywords & strings
  const parts = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|\b(?:import|export|from|const|let|var|function|return|async|await|if|else|interface|type|class|try|catch|throw|new)\b)/g);

  return parts.map((part, i) => {
    if (/^['"`]/.test(part)) {
      return (
        <span key={i} className="text-emerald-300">
          {part}
        </span>
      );
    }
    if (/^(import|export|from|const|let|var|function|return|async|await|if|else|interface|type|class|try|catch|throw|new)$/.test(part)) {
      return (
        <span key={i} className="text-purple-400 font-semibold">
          {part}
        </span>
      );
    }
    if (/^[0-9]+$/.test(part)) {
      return (
        <span key={i} className="text-amber-300">
          {part}
        </span>
      );
    }
    return part;
  });
}
