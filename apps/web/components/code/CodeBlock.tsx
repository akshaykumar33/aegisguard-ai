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
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden text-xs shadow-xs', className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
          </div>
          {filename && <span className="ml-2 font-mono text-[11px] text-foreground font-medium">{filename}</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">{language}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted hover:bg-secondary text-foreground transition-colors text-[11px] font-mono cursor-pointer shadow-xs active:scale-95 border border-border"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-success" />
                <span className="text-success font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-muted-foreground" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="p-5 overflow-x-auto font-mono leading-[1.8] bg-background">
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
                    isHighlighted ? 'bg-primary/10 -mx-5 px-5' : 'hover:bg-muted/20'
                  )}
                >
                  {showLineNumbers && (
                    <td className="w-10 pr-5 text-right select-none text-muted-foreground/60 font-mono text-[12px]">
                      {lineNum}
                    </td>
                  )}
                  <td className="text-foreground/90 whitespace-pre font-mono text-[13px]">
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

function formatSyntax(line: string, _language: string): React.ReactNode {
  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
    return <span className="text-muted-foreground italic">{line}</span>;
  }

  // Tokenize basic keywords & strings
  const parts = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|\b(?:import|export|from|const|let|var|function|return|async|await|if|else|interface|type|class|try|catch|throw|new)\b)/g);

  return parts.map((part, i) => {
    if (/^['"`]/.test(part)) {
      return (
        <span key={i} className="text-success">
          {part}
        </span>
      );
    }
    if (/^(import|export|from|const|let|var|function|return|async|await|if|else|interface|type|class|try|catch|throw|new)$/.test(part)) {
      return (
        <span key={i} className="text-primary font-semibold">
          {part}
        </span>
      );
    }
    if (/^[0-9]+$/.test(part)) {
      return (
        <span key={i} className="text-warning">
          {part}
        </span>
      );
    }
    return part;
  });
}
