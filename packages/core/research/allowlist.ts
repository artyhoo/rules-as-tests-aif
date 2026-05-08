// Source allowlist registry: trusted documentation hosts per allowlist key.
// Curated research entries declare provenance with `allowlistKey` + `url`;
// validateProvenance enforces that the URL hostname belongs to the host list
// associated with that key. https-only.

import type { Provenance } from './types.ts';

export const ALLOWED_SOURCES = {
  'next.official': ['nextjs.org', 'vercel.com'],
  'react.official': ['react.dev'],
  'tailwind.official': ['tailwindcss.com'],
  'mdn': ['developer.mozilla.org'],
  'typescript.official': ['typescriptlang.org', 'www.typescriptlang.org'],
} as const satisfies Record<string, readonly string[]>;

export type AllowlistKey = keyof typeof ALLOWED_SOURCES;

export interface ProvenanceValidation {
  ok: boolean;
  reason?: string;
}

export function validateProvenance(p: Provenance): ProvenanceValidation {
  const hosts = (ALLOWED_SOURCES as Record<string, readonly string[]>)[p.allowlistKey];
  if (!hosts) {
    return { ok: false, reason: `unknown allowlistKey: ${p.allowlistKey}` };
  }
  let url: URL;
  try {
    url = new URL(p.url);
  } catch {
    return { ok: false, reason: `malformed URL: ${p.url}` };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, reason: `non-https URL: ${p.url}` };
  }
  const hostMatch = hosts.some(
    (h) => url.hostname === h || url.hostname.endsWith(`.${h}`),
  );
  if (!hostMatch) {
    return {
      ok: false,
      reason: `host ${url.hostname} not allowed under key ${p.allowlistKey} (expected one of: ${hosts.join(', ')})`,
    };
  }
  return { ok: true };
}
