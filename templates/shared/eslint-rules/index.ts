import { noUnsafeZodParse } from './no-unsafe-zod-parse.ts';
import { noDirectTimeRandomness } from './no-direct-time-randomness.ts';
import { requireOtelSpan } from './require-otel-span.ts';

export const rules = {
  'no-unsafe-zod-parse': noUnsafeZodParse,
  'no-direct-time-randomness': noDirectTimeRandomness,
  'require-otel-span': requireOtelSpan,
};

export default { rules };
