#!/usr/bin/env tsx
// @ts-nocheck
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv } from 'ajv';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '../../..');
const MANIFEST_DIR = resolve(HERE, '../manifest');

type Check =
  | { type: 'eslint'; rule: string }
  | { type: 'command'; command: string }
  | { type: 'script'; script: string }
  | { type: 'manual'; rationale?: string };

interface RuleEntry {
  title: string;
  stack: string[];
  'applies-to'?: string[];
  'requires-package'?: string | string[];
  'auto-skip-if-missing'?: boolean;
  check: Check;
  examples: { bad: string; good: string };
  policy?: string;
}

type Manifest = Record<string, RuleEntry>;

const manifest: Manifest = JSON.parse(
  readFileSync(resolve(MANIFEST_DIR, 'rules-manifest.json'), 'utf8'),
);
const schema = JSON.parse(
  readFileSync(resolve(MANIFEST_DIR, 'rules-manifest.schema.json'), 'utf8'),
);

const ajv = new Ajv({ allErrors: true, strict: false });
if (!ajv.validate(schema, manifest)) {
  console.error('Manifest schema validation failed:', ajv.errorsText());
  process.exit(2);
}

const renderCheck = (c: Check): string => {
  switch (c.type) {
    case 'eslint':
      return `ESLint \`${c.rule}\``;
    case 'command':
      return `\`${c.command}\``;
    case 'script':
      return `\`${c.script}\``;
    case 'manual':
      return `Manual review${c.rationale ? ` — ${c.rationale}` : ''}`;
  }
};

const renderTable = (entries: Array<[string, RuleEntry]>): string => {
  const rows = entries.map(
    ([id, r]) =>
      `| **${id} ${r.title}** | ${r.stack.join(', ')} | ${renderCheck(r.check)} |`,
  );
  return ['| Rule | Stack | Check |', '|---|---|---|', ...rows].join('\n');
};

const ruleSortKey = (id: string): [number, number] => {
  const isIR = id.startsWith('IR');
  const num = parseInt(id.replace(/[^0-9]/g, ''), 10);
  return [isIR ? 1 : 0, num];
};

const sortedEntries = Object.entries(manifest).sort(([a], [b]) => {
  const [ka, na] = ruleSortKey(a);
  const [kb, nb] = ruleSortKey(b);
  return ka - kb || na - nb;
});

const output = renderTable(sortedEntries);

const isCheck = process.argv.includes('--check');
const isPrint = process.argv.includes('--print');

if (isPrint) {
  process.stdout.write(`${output}\n`);
  process.exit(0);
}

const targetPath = resolve(REPO_ROOT, 'packages/preset-next-15-canonical/RULES.md');
const targetSrc = readFileSync(targetPath, 'utf8');
const beginMarker = '<!-- begin: rules-table-generated -->';
const endMarker = '<!-- end: rules-table-generated -->';
const beginIdx = targetSrc.indexOf(beginMarker);
const endIdx = targetSrc.indexOf(endMarker);
if (beginIdx === -1 || endIdx === -1) {
  console.error(
    `Markers not found in ${targetPath}. Add ${beginMarker} and ${endMarker} around the rules table.`,
  );
  process.exit(2);
}
const currentRegion = targetSrc
  .slice(beginIdx + beginMarker.length, endIdx)
  .replace(/^\n+|\n+$/g, '');
const desiredRegion = `\n${output}\n`;

if (isCheck) {
  if (currentRegion === output) {
    console.log('rules-table region is up-to-date');
    process.exit(0);
  }
  console.error('rules-table region drift detected.');
  console.error('Run: npx tsx packages/core/render/render-rules.ts');
  process.exit(1);
}

const next =
  targetSrc.slice(0, beginIdx + beginMarker.length) +
  desiredRegion +
  targetSrc.slice(endIdx);
writeFileSync(targetPath, next);
console.log(`Updated ${targetPath} rules-table region`);
