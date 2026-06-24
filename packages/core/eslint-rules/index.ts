import { noUnsafeZodParse } from './no-unsafe-zod-parse.ts';
import { noDirectTimeRandomness } from './no-direct-time-randomness.ts';

const plugin = {
  meta: {
    name: '@rules-as-tests/core-eslint-rules',
    version: '0.1.0',
  },
  rules: {
    'no-unsafe-zod-parse': noUnsafeZodParse,
    'no-direct-time-randomness': noDirectTimeRandomness,
  },
};

export default plugin;
export const rules = plugin.rules;
