import { describe, expect, it } from 'vitest';
import {
  mergeEslintRuleConfig,
  RuleCollisionError,
} from './merge-eslint-config.ts';

describe('mergeEslintRuleConfig — B1 closure for synthesizer recipe merge', () => {
  it('copies a non-colliding key into accumulator', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'rules-as-tests/no-server-imports-in-client': 'error' },
      'react-server-components',
      sources,
    );
    expect(acc['rules-as-tests/no-server-imports-in-client']).toBe('error');
    expect(sources.get('rules-as-tests/no-server-imports-in-client')).toEqual([
      'react-server-components',
    ]);
  });

  it('merges no-restricted-imports paths[] across two recipes', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      {
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'next/router', message: 'use next/navigation' }] },
        ],
      },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      {
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'next/legacy-router', message: 'use next/navigation' }] },
        ],
      },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-imports'] as [string, { paths: { name: string }[] }];
    expect(merged[0]).toBe('error');
    expect(merged[1].paths.map((p) => p.name).sort()).toEqual([
      'next/legacy-router',
      'next/router',
    ]);
    expect(sources.get('no-restricted-imports')).toEqual(['recipe-a', 'recipe-b']);
  });

  it('dedupes no-restricted-imports paths by name (first wins)', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      {
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'next/router', message: 'first message' }] },
        ],
      },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      {
        'no-restricted-imports': [
          'error',
          { paths: [{ name: 'next/router', message: 'second message (would shadow)' }] },
        ],
      },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-imports'] as [
      string,
      { paths: { name: string; message: string }[] },
    ];
    expect(merged[1].paths).toHaveLength(1);
    expect(merged[1].paths[0].message).toBe('first message');
  });

  it('upgrades severity to error when either side is error', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-imports': ['warn', { paths: [{ name: 'a' }] }] },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-imports': ['error', { paths: [{ name: 'b' }] }] },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-imports'] as [string, unknown];
    expect(merged[0]).toBe('error');
  });

  it('throws RuleCollisionError on collision for a rule with no merge strategy', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'rules-as-tests/no-server-imports-in-client': 'error' },
      'recipe-a',
      sources,
    );
    expect(() =>
      mergeEslintRuleConfig(
        acc,
        { 'rules-as-tests/no-server-imports-in-client': 'warn' },
        'recipe-b',
        sources,
      ),
    ).toThrow(RuleCollisionError);
  });

  it('error message names both source recipes', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(acc, { 'some-rule': 'error' }, 'recipe-a', sources);
    expect(() =>
      mergeEslintRuleConfig(acc, { 'some-rule': 'warn' }, 'recipe-b', sources),
    ).toThrow(/recipe-a, recipe-b/);
  });

  // M2: no-restricted-syntax is the declarative-forbid-tier carrier — a second
  // declarative recipe MUST merge (concat selector entries), not throw.
  it('merges no-restricted-syntax selector entries across two declarative recipes (no throw)', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-syntax': ['error', { selector: 'CallExpression[x]', message: 'a' }] },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-syntax': ['error', { selector: 'CallExpression[y]', message: 'b' }] },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-syntax'] as [string, ...{ selector: string }[]];
    expect(merged[0]).toBe('error');
    expect(
      merged.slice(1).map((e) => (e as { selector: string }).selector).sort(),
    ).toEqual(['CallExpression[x]', 'CallExpression[y]']);
    expect(sources.get('no-restricted-syntax')).toEqual(['recipe-a', 'recipe-b']);
  });

  it('dedupes no-restricted-syntax entries by selector (first wins)', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-syntax': ['error', { selector: 'CallExpression[z]', message: 'first' }] },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      {
        'no-restricted-syntax': [
          'error',
          { selector: 'CallExpression[z]', message: 'second (would shadow)' },
        ],
      },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-syntax'] as [
      string,
      ...{ selector: string; message: string }[],
    ];
    expect(merged.slice(1)).toHaveLength(1);
    expect((merged[1] as { message: string }).message).toBe('first');
  });

  it('upgrades no-restricted-syntax severity to error when either side is error', () => {
    const acc: Record<string, unknown> = {};
    const sources = new Map<string, string[]>();
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-syntax': ['warn', { selector: 'A' }] },
      'recipe-a',
      sources,
    );
    mergeEslintRuleConfig(
      acc,
      { 'no-restricted-syntax': ['error', { selector: 'B' }] },
      'recipe-b',
      sources,
    );
    const merged = acc['no-restricted-syntax'] as [string, ...unknown[]];
    expect(merged[0]).toBe('error');
  });
});
