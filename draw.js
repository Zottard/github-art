#!/usr/bin/env node
// Requiere correrlo dentro de un repo git. Hace push vos después.

import { execSync } from 'child_process';
import { readSync } from 'fs';

// Fuente pixel 5x5
const FONT = {
  S: [
    [0,1,1,1,0],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [0,1,1,1,0],
  ],
  T: [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  A: [
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  Y: [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
};

function buildGrid(text) {
  const W = 5, GAP = 1;
  const totalCols = text.length * (W + GAP) - GAP;
  const grid = Array.from({ length: 5 }, () => new Array(totalCols).fill(0));
  for (let i = 0; i < text.length; i++) {
    const pixels = FONT[text[i].toUpperCase()];
    if (!pixels) continue;
    const offset = i * (W + GAP);
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < W; c++)
        grid[r][offset + c] = pixels[r][c];
  }
  return grid;
}

// La contribution graph de 2025 arranca el domingo 29/12/2024
// col=0 row=0 → 29 dic 2024
const GRAPH_START = new Date('2024-12-29T12:00:00Z');

function cellToDate(col, row) {
  const d = new Date(GRAPH_START);
  d.setUTCDate(d.getUTCDate() + col * 7 + row);
  return d;
}

function makeCommits(date, n) {
  const iso = date.toISOString();
  for (let i = 0; i < n; i++) {
    execSync(
      `GIT_AUTHOR_DATE="${iso}" GIT_COMMITTER_DATE="${iso}" git commit --allow-empty -m "."`,
      { stdio: 'pipe' }
    );
  }
}

// ── Config ──────────────────────────────────────────────────
const TEXT = 'STAY';
const COMMITS_PER_CELL = 5;  // más commits = celda más oscura
const ROW_OFFSET = 1;        // row 1=lunes, letras ocupan rows 1-5
// ────────────────────────────────────────────────────────────

const grid = buildGrid(TEXT);
const gridCols = grid[0].length; // 23

// Centrar en cols 2-51 del graph (zona segura dentro de 2025)
const startCol = 2 + Math.floor((50 - gridCols) / 2); // → col 15

// Preview
console.log('\nPreview "STAY" en la contribution graph:\n');
for (let r = 0; r < 5; r++)
  console.log('  ' + grid[r].map(v => v ? '█' : '·').join(''));

const active = grid.flat().filter(Boolean).length;
console.log(`\n  Celdas activas : ${active}`);
console.log(`  Commits totales: ${active * COMMITS_PER_CELL}`);
console.log(`  Columna inicial: ${startCol} (semana del ${cellToDate(startCol, ROW_OFFSET).toISOString().split('T')[0]})`);

const dryRun = process.argv.includes('--dry-run');
if (dryRun) {
  console.log('\n[--dry-run] No se crearon commits.');
  process.exit(0);
}

console.log('\nPresioná Enter para crear los commits, Ctrl+C para cancelar...');
readSync(0, Buffer.alloc(1), 0, 1, null);

console.log('\nCreando commits...\n');

for (let r = 0; r < 5; r++) {
  for (let c = 0; c < gridCols; c++) {
    if (!grid[r][c]) continue;
    const col = startCol + c;
    const row = r + ROW_OFFSET;
    const date = cellToDate(col, row);
    const dateStr = date.toISOString().split('T')[0];
    process.stdout.write(`  ${dateStr}  `);
    makeCommits(date, COMMITS_PER_CELL);
    process.stdout.write('✓\n');
  }
}

console.log('\nListo. Hacé push al repo y andá a tu perfil de GitHub.\n');
