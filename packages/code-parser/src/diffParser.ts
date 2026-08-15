export interface DiffLine {
  type: 'add' | 'del' | 'normal';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffFile {
  oldPath: string;
  newPath: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  changedLineNumbers: number[]; // All added/modified new line numbers
}

export interface ParsedDiff {
  files: DiffFile[];
  totalAdditions: number;
  totalDeletions: number;
}

/**
 * Parse a unified diff string into structured DiffFile[] representations
 */
export function parseUnifiedDiff(rawDiff: string): ParsedDiff {
  const files: DiffFile[] = [];
  if (!rawDiff || !rawDiff.trim()) {
    return { files: [], totalAdditions: 0, totalDeletions: 0 };
  }

  const rawFiles = rawDiff.split(/^diff --git /m).filter(Boolean);

  let totalAdditions = 0;
  let totalDeletions = 0;

  for (const rawFile of rawFiles) {
    const lines = rawFile.split('\n');
    let oldPath = '';
    let newPath = '';
    let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified';

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let currentOldLine = 0;
    let currentNewLine = 0;
    let additions = 0;
    let deletions = 0;
    const changedLineNumbers: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('--- a/')) {
        oldPath = line.replace('--- a/', '');
      } else if (line.startsWith('--- /dev/null')) {
        oldPath = '';
        status = 'added';
      } else if (line.startsWith('+++ b/')) {
        newPath = line.replace('+++ b/', '');
      } else if (line.startsWith('+++ /dev/null')) {
        newPath = '';
        status = 'deleted';
      } else if (line.startsWith('new file mode')) {
        status = 'added';
      } else if (line.startsWith('deleted file mode')) {
        status = 'deleted';
      } else if (line.startsWith('similarity index') || line.startsWith('rename from')) {
        status = 'renamed';
      } else if (line.startsWith('@@ ')) {
        // Hunk header e.g. @@ -10,5 +10,8 @@
        const match = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
        if (match) {
          const oldStart = parseInt(match[1], 10);
          const oldLines = match[2] ? parseInt(match[2], 10) : 1;
          const newStart = parseInt(match[3], 10);
          const newLines = match[4] ? parseInt(match[4], 10) : 1;

          currentOldLine = oldStart;
          currentNewLine = newStart;

          currentHunk = {
            header: line,
            oldStart,
            oldLines,
            newStart,
            newLines,
            lines: []
          };
          hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
          totalAdditions++;
          changedLineNumbers.push(currentNewLine);
          currentHunk.lines.push({
            type: 'add',
            newLineNumber: currentNewLine,
            content: line.slice(1)
          });
          currentNewLine++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
          totalDeletions++;
          currentHunk.lines.push({
            type: 'del',
            oldLineNumber: currentOldLine,
            content: line.slice(1)
          });
          currentOldLine++;
        } else if (line.startsWith(' ') || line === '') {
          currentHunk.lines.push({
            type: 'normal',
            oldLineNumber: currentOldLine,
            newLineNumber: currentNewLine,
            content: line.startsWith(' ') ? line.slice(1) : line
          });
          currentOldLine++;
          currentNewLine++;
        }
      }
    }

    if (newPath || oldPath) {
      files.push({
        oldPath: oldPath || newPath,
        newPath: newPath || oldPath,
        status,
        additions,
        deletions,
        hunks,
        changedLineNumbers
      });
    }
  }

  return { files, totalAdditions, totalDeletions };
}
