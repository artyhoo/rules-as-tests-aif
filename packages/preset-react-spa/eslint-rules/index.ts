import { requireErrorBoundary } from './require-error-boundary.ts';

const plugin = {
  meta: {
    name: '@rules-as-tests/preset-react-spa-eslint-rules',
    version: '0.1.0',
  },
  rules: {
    'require-error-boundary': requireErrorBoundary,
  },
};

export default plugin;
export const rules = plugin.rules;
