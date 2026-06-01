// @ts-nocheck
// Shared Ajv validator for SynthesisPlan structural shape.
// Re-uses synthesis-plan.schema.json as single source. Compiled once
// at module load, shared across gate 1 (schema check) and any future
// gate that needs structural pre-checks (e.g. gate 6 conflict expects
// a syntactically valid plan before semantic conflict scanning).

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv, type ValidateFunction } from 'ajv';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = resolve(
  HERE,
  '..',
  'synthesizer',
  'synthesis-plan.schema.json',
);

const ajv = new Ajv({ allErrors: true, strict: false });
const schemaDoc = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
ajv.addSchema(schemaDoc, 'synthesis-plan');

export const validateSynthesisPlan: ValidateFunction = ajv.compile({
  $ref: 'synthesis-plan',
});

export function errorsText(errors: ValidateFunction['errors']): string {
  return ajv.errorsText(errors);
}
