#!/usr/bin/env -S node --experimental-strip-types
// @ts-nocheck
/**
 * R4 — ts-morph-based check.
 *
 * Every named export from src/domain/*.ts must have:
 *   1. A matching <base>.unit.ts file co-located, AND
 *   2. The export name actually appears in the text of that .unit.ts.
 *
 * Exits 1 on any violation.
 */
import { Project } from 'ts-morph';
import { existsSync, readFileSync } from 'node:fs';

const project = new Project({
  skipAddingFilesFromTsConfig: true,
  compilerOptions: { allowJs: false, target: 99 /* ESNext */ },
});

project.addSourceFilesAtPaths([
  'src/domain/**/*.ts',
  '!src/domain/**/*.unit.ts',
  '!src/domain/**/*.integration.ts',
  '!src/domain/**/*.audit.ts',
  '!src/domain/**/*.test.ts',
  '!src/domain/**/*.spec.ts',
  '!src/domain/**/index.ts',
]);

const sourceFiles = project.getSourceFiles();
const violations: string[] = [];

for (const sf of sourceFiles) {
  const filePath = sf.getFilePath();
  const exported = sf.getExportedDeclarations();

  // Skip files with no named exports (e.g. type-only re-exports already excluded by index.ts filter)
  const names = [...exported.keys()].filter((n) => n !== 'default');
  if (names.length === 0) continue;

  const base = filePath.replace(/\.ts$/, '');
  const unitPath = `${base}.unit.ts`;

  if (!existsSync(unitPath)) {
    violations.push(`${filePath} → missing ${unitPath}`);
    continue;
  }

  const unitText = readFileSync(unitPath, 'utf8');
  for (const name of names) {
    // Word-boundary check: name must appear as identifier in the unit-test text.
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (!re.test(unitText)) {
      violations.push(
        `${filePath} → ${unitPath} exists but does not reference exported "${name}"`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error('R4 violations:');
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log(`R4: ${sourceFiles.length} domain file(s) checked, all exports have matching .unit.ts with name reference.`);
process.exit(0);
