// @ts-nocheck
// Shared Ajv validators for the research module.
// Single source of compiled validators — used by load.ts (entry-by-entry
// during disk read) and validate-plan.ts (full ResearchPlan validation
// for external consumers like the synthesizer's --from-research CLI mode).
// Avoids double-compiling the schema and double-parsing the JSON file.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv, type ValidateFunction } from 'ajv';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(HERE, 'research-plan.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
const schemaDoc = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
ajv.addSchema(schemaDoc, 'research-plan');

export const validateEntry: ValidateFunction = ajv.compile({
  $ref: 'research-plan#/definitions/ResearchEntry',
});

export const validateResearchPlanShape: ValidateFunction = ajv.compile({
  $ref: 'research-plan',
});

export function errorsText(errors: ValidateFunction['errors']): string {
  return ajv.errorsText(errors);
}
