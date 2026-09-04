import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Forbidden technical jargon in public UI
const FORBIDDEN_JARGON = [
  'FastAPI',
  'PostgreSQL',
  'SQLAlchemy',
  'Alembic',
  'RBAC',
  'WebSocket',
  'WebSockets',
  'Pydantic',
  'Jinja2',
];

function getAllFiles(dir: string, ext: string[]): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (ext.some(e => file.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Zero-Jargon Public UI Audit', () => {
  it('ensures no backend architecture jargon appears in public pages or components', () => {
    const srcDir = path.resolve(__dirname, '../pages');
    const compDir = path.resolve(__dirname, '../components');
    const files = [...getAllFiles(srcDir, ['.tsx']), ...getAllFiles(compDir, ['.tsx'])];

    const violations: { file: string; term: string; line: number; snippet: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((lineText, idx) => {
        // Skip import lines, comments, and internal type annotations
        const trimmed = lineText.trim();
        if (
          trimmed.startsWith('import ') ||
          trimmed.startsWith('//') ||
          trimmed.startsWith('/*') ||
          trimmed.startsWith('*')
        ) {
          return;
        }

        for (const term of FORBIDDEN_JARGON) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          if (regex.test(lineText)) {
            violations.push({
              file: path.relative(path.resolve(__dirname, '../..'), file),
              term,
              line: idx + 1,
              snippet: trimmed,
            });
          }
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('ensures index.html is free of internal tech jargon', () => {
    const indexHtmlPath = path.resolve(__dirname, '../../index.html');
    const content = fs.readFileSync(indexHtmlPath, 'utf-8');
    for (const term of FORBIDDEN_JARGON) {
      expect(content).not.toMatch(new RegExp(`\\b${term}\\b`, 'i'));
    }
  });
});
