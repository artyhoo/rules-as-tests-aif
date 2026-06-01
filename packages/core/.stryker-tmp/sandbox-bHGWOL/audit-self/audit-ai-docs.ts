/**
 * audit-ai-docs.ts — Code-vs-docs consistency audit for server-side TypeScript projects.
 * Wave 10.4: bash→TS port with D1–D5 structural hardening (code-fence-aware remark AST,
 * JSON.parse key-match for D2). Prior-art: prior-art-evaluations.md#58 (remark, ADOPT).
 *
 * Full rule mapping (mirrors audit-ai-docs.sh rule header; workflow rule-to-probe grep reads this):
 *   R1  TypeScript hygiene       → delegated to ESLint (no-explicit-any, no-non-null-assertion)
 *   R2  Validation at boundaries → delegated to local ESLint rule (rules-as-tests/no-unsafe-zod-parse)
 *   R3  Architectural boundaries → delegated to dependency-cruiser (run separately)
 *   R4  Tests for new code       → probeR4() — ts-morph: every domain export has .unit.ts
 *   R5  Async correctness        → delegated to ESLint no-floating-promises
 *   R6  Errors                   → delegated to ESLint (no-throw-literal, no-useless-catch)
 *   R7  Time/randomness/IO       → delegated to local ESLint rule (rules-as-tests/no-direct-time-randomness)
 *   R8  Observability            → delegated to local ESLint rule (rules-as-tests/require-otel-span)
 *   R9  Imports/dependencies     → delegated to ESLint (no-restricted-imports)
 *   R10 Naming                   → manual review only (not formalisable)
 *   R11 CI integrity             → manual review only
 *   D1  Skills declared exist    → probeD1() — remark AST (code-fence-aware; ignores negative mentions)
 *   D2  No TODO/_comment in JSON → probeD2() — JSON.parse key-match (not substring grep)
 *   D3  Goal-phrase parity       → probeD3() — includes() check on prose text
 *   D4  Tool-decisions staleness → probeD4() — mtime comparison
 *   D5  Inverse-completeness     → probeD5() — includes() grep over repo files + exemption list
 *
 * skip_unless R4 — active probe (probeR4 function below); all others delegated or manual.
 *
 * Exit codes:
 *   0 — all probes PASS (WARN allowed)
 *   1 — at least one FAIL
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { existsSync, readdirSync, statSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import { remark } from 'remark';
import type { Node } from 'unist';
import { visit } from 'unist-util-visit';

// ─── Canonical goal phrases (D3 / D5) ────────────────────────────────────────
export const CANON_PHRASE = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), "AI agents can't silently bypass undocumented conventions");
export const CANON_ALT = stryMutAct_9fa48("1") ? "" : (stryCov_9fa48("1"), 'AI cannot silently bypass what fails CI');
export const DOWNSTREAM_DOCS: readonly string[] = stryMutAct_9fa48("2") ? [] : (stryCov_9fa48("2"), [stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), '.claude/session-bootstrap.md'), stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'CLAUDE.md'), stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), '.claude/hooks/inject-session-bootstrap.sh'), stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), 'docs/meta-factory/EXECUTION-PLAN.md')]);

// ─── remark helpers for code-fence-aware parsing (D1) ───────────────────────

/** mdast node types we treat as "code" (skip during prose extraction). */
const CODE_NODE_TYPES = new Set(stryMutAct_9fa48("7") ? [] : (stryCov_9fa48("7"), [stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), 'code'), stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'inlineCode')]));

/**
 * Extract all prose text from a Markdown string using remark AST.
 * Skips `code` (fenced/indented blocks) and `inlineCode` (backtick-quoted)
 * nodes entirely — addressing D1's phantom-skill-from-code-example false-positive.
 *
 * Also skips HTML comment nodes (type 'html') to avoid matching content in
 * comment annotations.
 */
export function extractProseText(markdown: string): string {
  if (stryMutAct_9fa48("10")) {
    {}
  } else {
    stryCov_9fa48("10");
    const tree = remark().parse(markdown);
    const fragments: string[] = stryMutAct_9fa48("11") ? ["Stryker was here"] : (stryCov_9fa48("11"), []);

    // Walk every node; collect `value` only from non-code leaf nodes
    visit(tree, (node: Node) => {
      if (stryMutAct_9fa48("12")) {
        {}
      } else {
        stryCov_9fa48("12");
        if (stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13", "14"), CODE_NODE_TYPES.has(node.type))) return stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), 'skip'); // skip subtree
        if (stryMutAct_9fa48("18") ? node.type !== 'html' : stryMutAct_9fa48("17") ? false : stryMutAct_9fa48("16") ? true : (stryCov_9fa48("16", "17", "18"), node.type === (stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), 'html')))) return stryMutAct_9fa48("20") ? "" : (stryCov_9fa48("20"), 'skip'); // skip HTML comments
        const n = node as Node & {
          value?: string;
        };
        if (stryMutAct_9fa48("23") ? typeof n.value !== 'string' : stryMutAct_9fa48("22") ? false : stryMutAct_9fa48("21") ? true : (stryCov_9fa48("21", "22", "23"), typeof n.value === (stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), 'string')))) {
          if (stryMutAct_9fa48("25")) {
            {}
          } else {
            stryCov_9fa48("25");
            fragments.push(n.value);
          }
        }
      }
    });
    return fragments.join(stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), '\n'));
  }
}

/** Inline AST node types relevant to skill extraction. */
interface AstNode extends Node {
  type: string;
  value?: string;
  children?: AstNode[];
}

/**
 * Extract skill names declared in prose of a Markdown file.
 *
 * The pattern is: prose-text-node "... skill " immediately followed by an
 * inlineCode node "<name>" inside the same paragraph. This is structurally
 * the representation of "skill `<name>`" in mdast.
 *
 * D1 hardening (Wave 10.4):
 *   - code-fence-aware: walks only paragraph/heading children; fenced code
 *     blocks (type='code') are never visited for skill extraction.
 *   - negative-mention filter: if the preceding text node on the same line
 *     contains words like "removed", "deprecated", etc., skip the skill.
 *
 * Implementation note: we cannot simply regex-match the extracted prose text
 * because the backtick-quoted skill name is an `inlineCode` node — its value
 * does NOT appear in prose text extraction (by design). Instead we walk
 * paragraph children directly, looking for text→inlineCode pairs.
 */
export function extractDeclaredSkills(agentsMarkdown: string): string[] {
  if (stryMutAct_9fa48("27")) {
    {}
  } else {
    stryCov_9fa48("27");
    const tree = remark().parse(agentsMarkdown) as AstNode;
    const skills = new Set<string>();
    const SKILL_END_RE = stryMutAct_9fa48("30") ? /\bskill\S*$/i : stryMutAct_9fa48("29") ? /\bskill\s$/i : stryMutAct_9fa48("28") ? /\bskill\s*/i : (stryCov_9fa48("28", "29", "30"), /\bskill\s*$/i); // "... skill " at end of a text fragment
    const NEGATIVE_RE = /\b(removed|deprecated|deleted|was|old|former|previously)\b/i;

    /** Walk all paragraph/heading nodes and check for text→inlineCode "skill `name`" pairs. */
    function walkBlock(node: AstNode): void {
      if (stryMutAct_9fa48("31")) {
        {}
      } else {
        stryCov_9fa48("31");
        // Recurse into block-level containers (root, list, listItem, blockquote, etc.)
        if (stryMutAct_9fa48("34") ? false : stryMutAct_9fa48("33") ? true : stryMutAct_9fa48("32") ? node.children : (stryCov_9fa48("32", "33", "34"), !node.children)) return;
        if (stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36"), CODE_NODE_TYPES.has(node.type))) return; // skip code fences entirely

        // For paragraphs and headings: scan children for the pattern
        if (stryMutAct_9fa48("39") ? node.type === 'paragraph' && node.type === 'heading' : stryMutAct_9fa48("38") ? false : stryMutAct_9fa48("37") ? true : (stryCov_9fa48("37", "38", "39"), (stryMutAct_9fa48("41") ? node.type !== 'paragraph' : stryMutAct_9fa48("40") ? false : (stryCov_9fa48("40", "41"), node.type === (stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), 'paragraph')))) || (stryMutAct_9fa48("44") ? node.type !== 'heading' : stryMutAct_9fa48("43") ? false : (stryCov_9fa48("43", "44"), node.type === (stryMutAct_9fa48("45") ? "" : (stryCov_9fa48("45"), 'heading')))))) {
          if (stryMutAct_9fa48("46")) {
            {}
          } else {
            stryCov_9fa48("46");
            const children = stryMutAct_9fa48("47") ? node.children && [] : (stryCov_9fa48("47"), node.children ?? (stryMutAct_9fa48("48") ? ["Stryker was here"] : (stryCov_9fa48("48"), [])));
            for (let i = 0; stryMutAct_9fa48("51") ? i >= children.length - 1 : stryMutAct_9fa48("50") ? i <= children.length - 1 : stryMutAct_9fa48("49") ? false : (stryCov_9fa48("49", "50", "51"), i < (stryMutAct_9fa48("52") ? children.length + 1 : (stryCov_9fa48("52"), children.length - 1))); stryMutAct_9fa48("53") ? i-- : (stryCov_9fa48("53"), i++)) {
              if (stryMutAct_9fa48("54")) {
                {}
              } else {
                stryCov_9fa48("54");
                const curr = children[i]!;
                const next = children[stryMutAct_9fa48("55") ? i - 1 : (stryCov_9fa48("55"), i + 1)]!;
                if (stryMutAct_9fa48("58") ? curr.type === 'text' || next.type === 'inlineCode' : stryMutAct_9fa48("57") ? false : stryMutAct_9fa48("56") ? true : (stryCov_9fa48("56", "57", "58"), (stryMutAct_9fa48("60") ? curr.type !== 'text' : stryMutAct_9fa48("59") ? true : (stryCov_9fa48("59", "60"), curr.type === (stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), 'text')))) && (stryMutAct_9fa48("63") ? next.type !== 'inlineCode' : stryMutAct_9fa48("62") ? true : (stryCov_9fa48("62", "63"), next.type === (stryMutAct_9fa48("64") ? "" : (stryCov_9fa48("64"), 'inlineCode')))))) {
                  if (stryMutAct_9fa48("65")) {
                    {}
                  } else {
                    stryCov_9fa48("65");
                    const textVal = stryMutAct_9fa48("66") ? curr.value && '' : (stryCov_9fa48("66"), curr.value ?? (stryMutAct_9fa48("67") ? "Stryker was here!" : (stryCov_9fa48("67"), '')));
                    const codeName = stryMutAct_9fa48("68") ? next.value && '' : (stryCov_9fa48("68"), next.value ?? (stryMutAct_9fa48("69") ? "Stryker was here!" : (stryCov_9fa48("69"), '')));
                    if (stryMutAct_9fa48("72") ? false : stryMutAct_9fa48("71") ? true : stryMutAct_9fa48("70") ? SKILL_END_RE.test(textVal) : (stryCov_9fa48("70", "71", "72"), !SKILL_END_RE.test(textVal))) continue; // preceding text must end with "skill"
                    if (stryMutAct_9fa48("74") ? false : stryMutAct_9fa48("73") ? true : (stryCov_9fa48("73", "74"), NEGATIVE_RE.test(textVal))) continue; // negative-mention in preceding text
                    // Also check the text node that follows the inlineCode (if any)
                    const after = children[stryMutAct_9fa48("75") ? i - 2 : (stryCov_9fa48("75"), i + 2)];
                    if (stryMutAct_9fa48("78") ? after && after.type === 'text' || NEGATIVE_RE.test(after.value ?? '') : stryMutAct_9fa48("77") ? false : stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76", "77", "78"), (stryMutAct_9fa48("80") ? after || after.type === 'text' : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80"), after && (stryMutAct_9fa48("82") ? after.type !== 'text' : stryMutAct_9fa48("81") ? true : (stryCov_9fa48("81", "82"), after.type === (stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), 'text')))))) && NEGATIVE_RE.test(stryMutAct_9fa48("84") ? after.value && '' : (stryCov_9fa48("84"), after.value ?? (stryMutAct_9fa48("85") ? "Stryker was here!" : (stryCov_9fa48("85"), '')))))) continue;
                    if (stryMutAct_9fa48("89") ? codeName.length <= 0 : stryMutAct_9fa48("88") ? codeName.length >= 0 : stryMutAct_9fa48("87") ? false : stryMutAct_9fa48("86") ? true : (stryCov_9fa48("86", "87", "88", "89"), codeName.length > 0)) {
                      if (stryMutAct_9fa48("90")) {
                        {}
                      } else {
                        stryCov_9fa48("90");
                        skills.add(codeName);
                      }
                    }
                  }
                }
              }
            }
            return; // don't recurse into paragraph children (they're inline, not block)
          }
        }

        // Recurse into block containers
        for (const child of node.children) {
          if (stryMutAct_9fa48("91")) {
            {}
          } else {
            stryCov_9fa48("91");
            walkBlock(child);
          }
        }
      }
    }
    walkBlock(tree);
    return stryMutAct_9fa48("92") ? [...skills] : (stryCov_9fa48("92"), (stryMutAct_9fa48("93") ? [] : (stryCov_9fa48("93"), [...skills])).sort());
  }
}

// ─── R4: Tests for new public code (ts-morph via npx tsx) ────────────────────
/**
 * R4 probe: every domain export in src/domain has a matching .unit.ts file.
 * Delegates to `scripts/audit-r4.ts` in the consumer project via npx tsx.
 * Falls back to WARN(skipped) when env lacks Node/tsx/tsconfig.
 *
 * `opts.execSync` is the dependency-injection seam for warm-path tests
 * (DN-1 Path C, 2026-05-25); omit it in prod and contract tests — defaults
 * to the real `execSync` from node:child_process, preserving byte-for-byte
 * subprocess behaviour.
 */
export function probeR4(cwd: string, opts?: {
  execSync?: typeof execSync;
}): {
  result: 'pass' | 'fail' | 'warn';
  message: string;
} {
  if (stryMutAct_9fa48("94")) {
    {}
  } else {
    stryCov_9fa48("94");
    const exec = stryMutAct_9fa48("95") ? opts?.execSync && execSync : (stryCov_9fa48("95"), (stryMutAct_9fa48("96") ? opts.execSync : (stryCov_9fa48("96"), opts?.execSync)) ?? execSync);
    const RULE = stryMutAct_9fa48("97") ? "" : (stryCov_9fa48("97"), 'R4: Every public export in src/domain has matching .unit.ts (ts-morph)');
    if (stryMutAct_9fa48("100") ? false : stryMutAct_9fa48("99") ? true : stryMutAct_9fa48("98") ? existsSync(join(cwd, 'src/domain')) : (stryCov_9fa48("98", "99", "100"), !existsSync(join(cwd, stryMutAct_9fa48("101") ? "" : (stryCov_9fa48("101"), 'src/domain'))))) {
      if (stryMutAct_9fa48("102")) {
        {}
      } else {
        stryCov_9fa48("102");
        return stryMutAct_9fa48("103") ? {} : (stryCov_9fa48("103"), {
          result: stryMutAct_9fa48("104") ? "" : (stryCov_9fa48("104"), 'pass'),
          message: stryMutAct_9fa48("105") ? `` : (stryCov_9fa48("105"), `${RULE} (skipped: no src/domain)`)
        });
      }
    }
    try {
      if (stryMutAct_9fa48("106")) {
        {}
      } else {
        stryCov_9fa48("106");
        exec(stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), 'npx --version'), stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
          stdio: stryMutAct_9fa48("109") ? "" : (stryCov_9fa48("109"), 'ignore')
        }));
      }
    } catch {
      if (stryMutAct_9fa48("110")) {
        {}
      } else {
        stryCov_9fa48("110");
        return stryMutAct_9fa48("111") ? {} : (stryCov_9fa48("111"), {
          result: stryMutAct_9fa48("112") ? "" : (stryCov_9fa48("112"), 'warn'),
          message: stryMutAct_9fa48("113") ? `` : (stryCov_9fa48("113"), `${RULE} (skipped: npx not found)`)
        });
      }
    }
    const hasTsconfig = existsSync(join(cwd, stryMutAct_9fa48("114") ? "" : (stryCov_9fa48("114"), 'tsconfig.json')));
    const hasTsMorph = existsSync(join(cwd, stryMutAct_9fa48("115") ? "" : (stryCov_9fa48("115"), 'node_modules/ts-morph/package.json')));
    if (stryMutAct_9fa48("118") ? !hasTsconfig || !hasTsMorph : stryMutAct_9fa48("117") ? false : stryMutAct_9fa48("116") ? true : (stryCov_9fa48("116", "117", "118"), (stryMutAct_9fa48("119") ? hasTsconfig : (stryCov_9fa48("119"), !hasTsconfig)) && (stryMutAct_9fa48("120") ? hasTsMorph : (stryCov_9fa48("120"), !hasTsMorph)))) {
      if (stryMutAct_9fa48("121")) {
        {}
      } else {
        stryCov_9fa48("121");
        return stryMutAct_9fa48("122") ? {} : (stryCov_9fa48("122"), {
          result: stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), 'warn'),
          message: stryMutAct_9fa48("124") ? `` : (stryCov_9fa48("124"), `${RULE} (skipped: no tsconfig.json and ts-morph not installed)`)
        });
      }
    }
    try {
      if (stryMutAct_9fa48("125")) {
        {}
      } else {
        stryCov_9fa48("125");
        exec(stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'npx --no-install tsx scripts/audit-r4.ts'), stryMutAct_9fa48("127") ? {} : (stryCov_9fa48("127"), {
          cwd,
          stdio: stryMutAct_9fa48("128") ? "" : (stryCov_9fa48("128"), 'pipe')
        }));
        return stryMutAct_9fa48("129") ? {} : (stryCov_9fa48("129"), {
          result: stryMutAct_9fa48("130") ? "" : (stryCov_9fa48("130"), 'pass'),
          message: RULE
        });
      }
    } catch {
      if (stryMutAct_9fa48("131")) {
        {}
      } else {
        stryCov_9fa48("131");
        return stryMutAct_9fa48("132") ? {} : (stryCov_9fa48("132"), {
          result: stryMutAct_9fa48("133") ? "" : (stryCov_9fa48("133"), 'fail'),
          message: RULE
        });
      }
    }
  }
}

// ─── D1: Skills declared in AGENTS.md exist on disk ─────────────────────────
/**
 * D1 probe: code-fence-aware + negative-mention-aware skill existence check.
 * Returns list of violation strings (empty = pass).
 */
export function probeD1(cwd: string): string[] {
  if (stryMutAct_9fa48("134")) {
    {}
  } else {
    stryCov_9fa48("134");
    const agentsPath = join(cwd, stryMutAct_9fa48("135") ? "" : (stryCov_9fa48("135"), 'AGENTS.md'));
    if (stryMutAct_9fa48("138") ? false : stryMutAct_9fa48("137") ? true : stryMutAct_9fa48("136") ? existsSync(agentsPath) : (stryCov_9fa48("136", "137", "138"), !existsSync(agentsPath))) return stryMutAct_9fa48("139") ? ["Stryker was here"] : (stryCov_9fa48("139"), []); // no AGENTS.md → skip (no violation)

    const content = readFileSync(agentsPath, stryMutAct_9fa48("140") ? "" : (stryCov_9fa48("140"), 'utf8'));
    const skills = extractDeclaredSkills(content);
    const violations: string[] = stryMutAct_9fa48("141") ? ["Stryker was here"] : (stryCov_9fa48("141"), []);
    for (const skill of skills) {
      if (stryMutAct_9fa48("142")) {
        {}
      } else {
        stryCov_9fa48("142");
        const skillDir = join(cwd, stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), '.claude/skills'), skill);
        if (stryMutAct_9fa48("146") ? false : stryMutAct_9fa48("145") ? true : stryMutAct_9fa48("144") ? existsSync(skillDir) : (stryCov_9fa48("144", "145", "146"), !existsSync(skillDir))) {
          if (stryMutAct_9fa48("147")) {
            {}
          } else {
            stryCov_9fa48("147");
            violations.push(stryMutAct_9fa48("148") ? `` : (stryCov_9fa48("148"), `skill '${skill}' declared in AGENTS.md but missing from .claude/skills/`));
          }
        }
      }
    }
    return violations;
  }
}

// ─── D2: No TODO / _comment in JSON configs ───────────────────────────────────
/**
 * D2 probe: detect `_comment` keys or `TODO`/`FIXME` values in JSON configs.
 * Uses JSON.parse + key traversal — not substring grep — so a TODO inside a
 * string value nested under a non-comment key does NOT trigger a false-positive.
 *
 * D2 hardening (Wave 10.4):
 *   bash used grep -E "_comment|TODO|FIXME" which matched those strings ANYWHERE
 *   in the file, including inside legitimate string values. This port matches
 *   `_comment` as a key and `TODO`/`FIXME` as values at any JSON depth.
 */
export interface D2Finding {
  file: string;
  reason: string;
}
const COMMENT_KEY_RE = /_comment/i;
const TODO_VALUE_RE = /\b(TODO|FIXME)\b/;

/** Recursively walk a JSON value for _comment keys or TODO/FIXME string values. */
function walkJson(val: unknown, path: string, findings: D2Finding[], file: string): void {
  if (stryMutAct_9fa48("149")) {
    {}
  } else {
    stryCov_9fa48("149");
    if (stryMutAct_9fa48("152") ? val === null && typeof val !== 'object' : stryMutAct_9fa48("151") ? false : stryMutAct_9fa48("150") ? true : (stryCov_9fa48("150", "151", "152"), (stryMutAct_9fa48("154") ? val !== null : stryMutAct_9fa48("153") ? false : (stryCov_9fa48("153", "154"), val === null)) || (stryMutAct_9fa48("156") ? typeof val === 'object' : stryMutAct_9fa48("155") ? false : (stryCov_9fa48("155", "156"), typeof val !== (stryMutAct_9fa48("157") ? "" : (stryCov_9fa48("157"), 'object')))))) {
      if (stryMutAct_9fa48("158")) {
        {}
      } else {
        stryCov_9fa48("158");
        if (stryMutAct_9fa48("161") ? typeof val === 'string' || TODO_VALUE_RE.test(val) : stryMutAct_9fa48("160") ? false : stryMutAct_9fa48("159") ? true : (stryCov_9fa48("159", "160", "161"), (stryMutAct_9fa48("163") ? typeof val !== 'string' : stryMutAct_9fa48("162") ? true : (stryCov_9fa48("162", "163"), typeof val === (stryMutAct_9fa48("164") ? "" : (stryCov_9fa48("164"), 'string')))) && TODO_VALUE_RE.test(val))) {
          if (stryMutAct_9fa48("165")) {
            {}
          } else {
            stryCov_9fa48("165");
            findings.push(stryMutAct_9fa48("166") ? {} : (stryCov_9fa48("166"), {
              file,
              reason: stryMutAct_9fa48("167") ? `` : (stryCov_9fa48("167"), `value at ${path} contains TODO/FIXME: "${val}"`)
            }));
          }
        }
        return;
      }
    }
    if (stryMutAct_9fa48("169") ? false : stryMutAct_9fa48("168") ? true : (stryCov_9fa48("168", "169"), Array.isArray(val))) {
      if (stryMutAct_9fa48("170")) {
        {}
      } else {
        stryCov_9fa48("170");
        val.forEach(stryMutAct_9fa48("171") ? () => undefined : (stryCov_9fa48("171"), (item, i) => walkJson(item, stryMutAct_9fa48("172") ? `` : (stryCov_9fa48("172"), `${path}[${i}]`), findings, file)));
        return;
      }
    }
    for (const [key, child] of Object.entries(val as Record<string, unknown>)) {
      if (stryMutAct_9fa48("173")) {
        {}
      } else {
        stryCov_9fa48("173");
        if (stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175"), COMMENT_KEY_RE.test(key))) {
          if (stryMutAct_9fa48("176")) {
            {}
          } else {
            stryCov_9fa48("176");
            findings.push(stryMutAct_9fa48("177") ? {} : (stryCov_9fa48("177"), {
              file,
              reason: stryMutAct_9fa48("178") ? `` : (stryCov_9fa48("178"), `key "${key}" looks like a comment placeholder`)
            }));
          }
        }
        walkJson(child, stryMutAct_9fa48("179") ? `` : (stryCov_9fa48("179"), `${path}.${key}`), findings, file);
      }
    }
  }
}
export function probeD2(cwd: string): D2Finding[] {
  if (stryMutAct_9fa48("180")) {
    {}
  } else {
    stryCov_9fa48("180");
    const candidates = stryMutAct_9fa48("181") ? [] : (stryCov_9fa48("181"), [join(cwd, stryMutAct_9fa48("182") ? "" : (stryCov_9fa48("182"), '.mcp.json')), join(cwd, stryMutAct_9fa48("183") ? "" : (stryCov_9fa48("183"), '.claude/settings.json'))]);
    // Also scan .ai-factory/*.json
    const aiFactoryDir = join(cwd, stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), '.ai-factory'));
    if (stryMutAct_9fa48("186") ? false : stryMutAct_9fa48("185") ? true : (stryCov_9fa48("185", "186"), existsSync(aiFactoryDir))) {
      if (stryMutAct_9fa48("187")) {
        {}
      } else {
        stryCov_9fa48("187");
        try {
          if (stryMutAct_9fa48("188")) {
            {}
          } else {
            stryCov_9fa48("188");
            stryMutAct_9fa48("189") ? readdirSync(aiFactoryDir).forEach(f => candidates.push(join(aiFactoryDir, f))) : (stryCov_9fa48("189"), readdirSync(aiFactoryDir).filter(stryMutAct_9fa48("190") ? () => undefined : (stryCov_9fa48("190"), f => stryMutAct_9fa48("191") ? f.startsWith('.json') : (stryCov_9fa48("191"), f.endsWith(stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), '.json'))))).forEach(stryMutAct_9fa48("193") ? () => undefined : (stryCov_9fa48("193"), f => candidates.push(join(aiFactoryDir, f)))));
          }
        } catch {/* ignore unreadable dirs */}
      }
    }
    const findings: D2Finding[] = stryMutAct_9fa48("194") ? ["Stryker was here"] : (stryCov_9fa48("194"), []);
    for (const filePath of candidates) {
      if (stryMutAct_9fa48("195")) {
        {}
      } else {
        stryCov_9fa48("195");
        if (stryMutAct_9fa48("198") ? false : stryMutAct_9fa48("197") ? true : stryMutAct_9fa48("196") ? existsSync(filePath) : (stryCov_9fa48("196", "197", "198"), !existsSync(filePath))) continue;
        try {
          if (stryMutAct_9fa48("199")) {
            {}
          } else {
            stryCov_9fa48("199");
            const parsed: unknown = JSON.parse(readFileSync(filePath, stryMutAct_9fa48("200") ? "" : (stryCov_9fa48("200"), 'utf8')));
            const rel = (stryMutAct_9fa48("201") ? filePath.endsWith(cwd + '/') : (stryCov_9fa48("201"), filePath.startsWith(cwd + (stryMutAct_9fa48("202") ? "" : (stryCov_9fa48("202"), '/'))))) ? stryMutAct_9fa48("203") ? filePath : (stryCov_9fa48("203"), filePath.slice(stryMutAct_9fa48("204") ? cwd.length - 1 : (stryCov_9fa48("204"), cwd.length + 1))) : filePath;
            walkJson(parsed, stryMutAct_9fa48("205") ? "" : (stryCov_9fa48("205"), '$'), findings, rel);
          }
        } catch {
          // Malformed JSON — skip silently (not a D2 concern)
        }
      }
    }
    return findings;
  }
}

// ─── D3: Goal-phrase parity ───────────────────────────────────────────────────
/**
 * D3 probe: canonical goal phrase present in all downstream goal-bearing docs.
 */
export function probeD3(cwd: string): string[] {
  if (stryMutAct_9fa48("206")) {
    {}
  } else {
    stryCov_9fa48("206");
    const violations: string[] = stryMutAct_9fa48("207") ? ["Stryker was here"] : (stryCov_9fa48("207"), []);
    for (const docRelPath of DOWNSTREAM_DOCS) {
      if (stryMutAct_9fa48("208")) {
        {}
      } else {
        stryCov_9fa48("208");
        const full = join(cwd, docRelPath);
        if (stryMutAct_9fa48("211") ? false : stryMutAct_9fa48("210") ? true : stryMutAct_9fa48("209") ? existsSync(full) : (stryCov_9fa48("209", "210", "211"), !existsSync(full))) {
          if (stryMutAct_9fa48("212")) {
            {}
          } else {
            stryCov_9fa48("212");
            violations.push(stryMutAct_9fa48("213") ? `` : (stryCov_9fa48("213"), `  ${docRelPath}: file not found`));
            continue;
          }
        }
        const text = readFileSync(full, stryMutAct_9fa48("214") ? "" : (stryCov_9fa48("214"), 'utf8'));
        if (stryMutAct_9fa48("217") ? !text.includes(CANON_PHRASE) || !text.includes(CANON_ALT) : stryMutAct_9fa48("216") ? false : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), (stryMutAct_9fa48("218") ? text.includes(CANON_PHRASE) : (stryCov_9fa48("218"), !text.includes(CANON_PHRASE))) && (stryMutAct_9fa48("219") ? text.includes(CANON_ALT) : (stryCov_9fa48("219"), !text.includes(CANON_ALT))))) {
          if (stryMutAct_9fa48("220")) {
            {}
          } else {
            stryCov_9fa48("220");
            violations.push(stryMutAct_9fa48("221") ? `` : (stryCov_9fa48("221"), `  ${docRelPath}: missing canonical goal phrase or synonym`));
          }
        }
      }
    }
    return violations;
  }
}

// ─── D4: Tool-decisions staleness ────────────────────────────────────────────
/**
 * D4 probe: .ai-factory/tool-decisions.md mtime ≤ package.json mtime.
 * Returns { result, message } — only WARN, never FAIL.
 */
export function probeD4(cwd: string): {
  result: 'pass' | 'warn';
  message: string;
} {
  if (stryMutAct_9fa48("222")) {
    {}
  } else {
    stryCov_9fa48("222");
    const RULE = stryMutAct_9fa48("223") ? "" : (stryCov_9fa48("223"), 'D4 (drift): .ai-factory/tool-decisions.md up-to-date with package.json');
    const pkgPath = join(cwd, stryMutAct_9fa48("224") ? "" : (stryCov_9fa48("224"), 'package.json'));
    const decPath = join(cwd, stryMutAct_9fa48("225") ? "" : (stryCov_9fa48("225"), '.ai-factory/tool-decisions.md'));
    if (stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : stryMutAct_9fa48("226") ? existsSync(pkgPath) : (stryCov_9fa48("226", "227", "228"), !existsSync(pkgPath))) {
      if (stryMutAct_9fa48("229")) {
        {}
      } else {
        stryCov_9fa48("229");
        return stryMutAct_9fa48("230") ? {} : (stryCov_9fa48("230"), {
          result: stryMutAct_9fa48("231") ? "" : (stryCov_9fa48("231"), 'pass'),
          message: stryMutAct_9fa48("232") ? `` : (stryCov_9fa48("232"), `${RULE} (no package.json — skipped)`)
        });
      }
    }
    if (stryMutAct_9fa48("235") ? false : stryMutAct_9fa48("234") ? true : stryMutAct_9fa48("233") ? existsSync(decPath) : (stryCov_9fa48("233", "234", "235"), !existsSync(decPath))) {
      if (stryMutAct_9fa48("236")) {
        {}
      } else {
        stryCov_9fa48("236");
        return stryMutAct_9fa48("237") ? {} : (stryCov_9fa48("237"), {
          result: stryMutAct_9fa48("238") ? "" : (stryCov_9fa48("238"), 'warn'),
          message: stryMutAct_9fa48("239") ? `` : (stryCov_9fa48("239"), `${RULE} — .ai-factory/tool-decisions.md missing; run setup.sh or /tool-bootstrapping to seed`)
        });
      }
    }
    const pkgMtime = statSync(pkgPath).mtimeMs;
    const decMtime = statSync(decPath).mtimeMs;
    if (stryMutAct_9fa48("243") ? pkgMtime <= decMtime : stryMutAct_9fa48("242") ? pkgMtime >= decMtime : stryMutAct_9fa48("241") ? false : stryMutAct_9fa48("240") ? true : (stryCov_9fa48("240", "241", "242", "243"), pkgMtime > decMtime)) {
      if (stryMutAct_9fa48("244")) {
        {}
      } else {
        stryCov_9fa48("244");
        return stryMutAct_9fa48("245") ? {} : (stryCov_9fa48("245"), {
          result: stryMutAct_9fa48("246") ? "" : (stryCov_9fa48("246"), 'warn'),
          message: stryMutAct_9fa48("247") ? `` : (stryCov_9fa48("247"), `${RULE} — package.json is newer than tool-decisions.md; run /tool-bootstrapping to re-evaluate`)
        });
      }
    }
    return stryMutAct_9fa48("248") ? {} : (stryCov_9fa48("248"), {
      result: stryMutAct_9fa48("249") ? "" : (stryCov_9fa48("249"), 'pass'),
      message: RULE
    });
  }
}

// ─── D5: Inverse-completeness ────────────────────────────────────────────────
/**
 * D5 probe: every file in the repo with the canonical goal phrase must be
 * enrolled in DOWNSTREAM_DOCS or explicitly exempt. Catches Incident-4.
 *
 * D5 hardening (Wave 10.4):
 *   Added `.stryker-tmp` and `.stryker` to D5_GITIGNORED_PATTERNS to prevent
 *   false-positives from Stryker mutation temp directories that may contain
 *   instrumented copies of source files carrying the canonical phrase.
 */
export interface D5Finding {
  file: string;
  reason: string;
}

/** Patterns for paths that are exempt from D5 (not coverage gaps). */
const D5_FROZEN_RE = stryMutAct_9fa48("250") ? /(docs\/meta-factory\/research-patches\/|docs\/audits\/)/ : (stryCov_9fa48("250"), /^(docs\/meta-factory\/research-patches\/|docs\/audits\/)/);
const D5_TEST_INFRA_RE = stryMutAct_9fa48("252") ? /^packages\/core\/audit-self\/audit-ai-docs\.(ts|test\.ts|sh|test\.sh)|packages\/core\/audit-self\/template-render\.audit\.ts/ : stryMutAct_9fa48("251") ? /packages\/core\/audit-self\/audit-ai-docs\.(ts|test\.ts|sh|test\.sh)|^packages\/core\/audit-self\/template-render\.audit\.ts/ : (stryCov_9fa48("251", "252"), /^packages\/core\/audit-self\/audit-ai-docs\.(ts|test\.ts|sh|test\.sh)|^packages\/core\/audit-self\/template-render\.audit\.ts/);
const D5_ROOT_SOURCE_RE = stryMutAct_9fa48("254") ? /^README\.md/ : stryMutAct_9fa48("253") ? /README\.md$/ : (stryCov_9fa48("253", "254"), /^README\.md$/);
const D5_GITIGNORED_RE = stryMutAct_9fa48("255") ? /(\.claude\/orchestrator-prompts\/|\.stryker-tmp\/|\.stryker\/)/ : (stryCov_9fa48("255"), /^(\.claude\/orchestrator-prompts\/|\.stryker-tmp\/|\.stryker\/)/);
export function probeD5(cwd: string): D5Finding[] {
  if (stryMutAct_9fa48("256")) {
    {}
  } else {
    stryCov_9fa48("256");
    // Build the enrollment set from DOWNSTREAM_DOCS
    const enrolled = new Set(DOWNSTREAM_DOCS);

    // Find all files containing either canonical phrase (excluding node_modules / .git)
    const found = new Set<string>();
    for (const phrase of stryMutAct_9fa48("257") ? [] : (stryCov_9fa48("257"), [CANON_PHRASE, CANON_ALT])) {
      if (stryMutAct_9fa48("258")) {
        {}
      } else {
        stryCov_9fa48("258");
        const files = grepFilesContaining(cwd, phrase);
        files.forEach(stryMutAct_9fa48("259") ? () => undefined : (stryCov_9fa48("259"), f => found.add(f)));
      }
    }
    const findings: D5Finding[] = stryMutAct_9fa48("260") ? ["Stryker was here"] : (stryCov_9fa48("260"), []);
    for (const file of stryMutAct_9fa48("261") ? [...found] : (stryCov_9fa48("261"), (stryMutAct_9fa48("262") ? [] : (stryCov_9fa48("262"), [...found])).sort())) {
      if (stryMutAct_9fa48("263")) {
        {}
      } else {
        stryCov_9fa48("263");
        if (stryMutAct_9fa48("265") ? false : stryMutAct_9fa48("264") ? true : (stryCov_9fa48("264", "265"), enrolled.has(file))) continue;
        if (stryMutAct_9fa48("267") ? false : stryMutAct_9fa48("266") ? true : (stryCov_9fa48("266", "267"), D5_FROZEN_RE.test(file))) continue;
        if (stryMutAct_9fa48("269") ? false : stryMutAct_9fa48("268") ? true : (stryCov_9fa48("268", "269"), D5_TEST_INFRA_RE.test(file))) continue;
        if (stryMutAct_9fa48("271") ? false : stryMutAct_9fa48("270") ? true : (stryCov_9fa48("270", "271"), D5_ROOT_SOURCE_RE.test(file))) continue;
        if (stryMutAct_9fa48("273") ? false : stryMutAct_9fa48("272") ? true : (stryCov_9fa48("272", "273"), D5_GITIGNORED_RE.test(file))) continue;
        findings.push(stryMutAct_9fa48("274") ? {} : (stryCov_9fa48("274"), {
          file,
          reason: stryMutAct_9fa48("275") ? `` : (stryCov_9fa48("275"), `contains canonical phrase but not in DOWNSTREAM_DOCS or any exemption`)
        }));
      }
    }
    return findings;
  }
}

/**
 * Recursively find files under `cwd` containing `phrase`, excluding
 * node_modules, .git, .stryker-tmp, and .stryker directories.
 */
function grepFilesContaining(cwd: string, phrase: string): string[] {
  if (stryMutAct_9fa48("276")) {
    {}
  } else {
    stryCov_9fa48("276");
    const results: string[] = stryMutAct_9fa48("277") ? ["Stryker was here"] : (stryCov_9fa48("277"), []);
    const SKIP_DIRS = new Set(stryMutAct_9fa48("278") ? [] : (stryCov_9fa48("278"), [stryMutAct_9fa48("279") ? "" : (stryCov_9fa48("279"), 'node_modules'), stryMutAct_9fa48("280") ? "" : (stryCov_9fa48("280"), '.git'), stryMutAct_9fa48("281") ? "" : (stryCov_9fa48("281"), '.stryker-tmp'), stryMutAct_9fa48("282") ? "" : (stryCov_9fa48("282"), '.stryker')]));
    function walk(dir: string): void {
      if (stryMutAct_9fa48("283")) {
        {}
      } else {
        stryCov_9fa48("283");
        let entries: string[];
        try {
          if (stryMutAct_9fa48("284")) {
            {}
          } else {
            stryCov_9fa48("284");
            entries = readdirSync(dir);
          }
        } catch {
          if (stryMutAct_9fa48("285")) {
            {}
          } else {
            stryCov_9fa48("285");
            return;
          }
        }
        for (const entry of entries) {
          if (stryMutAct_9fa48("286")) {
            {}
          } else {
            stryCov_9fa48("286");
            if (stryMutAct_9fa48("288") ? false : stryMutAct_9fa48("287") ? true : (stryCov_9fa48("287", "288"), SKIP_DIRS.has(entry))) continue;
            const full = join(dir, entry);
            let st;
            try {
              if (stryMutAct_9fa48("289")) {
                {}
              } else {
                stryCov_9fa48("289");
                st = statSync(full);
              }
            } catch {
              if (stryMutAct_9fa48("290")) {
                {}
              } else {
                stryCov_9fa48("290");
                continue;
              }
            }
            if (stryMutAct_9fa48("292") ? false : stryMutAct_9fa48("291") ? true : (stryCov_9fa48("291", "292"), st.isDirectory())) {
              if (stryMutAct_9fa48("293")) {
                {}
              } else {
                stryCov_9fa48("293");
                walk(full);
                continue;
              }
            }
            try {
              if (stryMutAct_9fa48("294")) {
                {}
              } else {
                stryCov_9fa48("294");
                const content = readFileSync(full, stryMutAct_9fa48("295") ? "" : (stryCov_9fa48("295"), 'utf8'));
                if (stryMutAct_9fa48("297") ? false : stryMutAct_9fa48("296") ? true : (stryCov_9fa48("296", "297"), content.includes(phrase))) {
                  if (stryMutAct_9fa48("298")) {
                    {}
                  } else {
                    stryCov_9fa48("298");
                    // Return relative to cwd
                    const rel = (stryMutAct_9fa48("299") ? full.endsWith(cwd + '/') : (stryCov_9fa48("299"), full.startsWith(cwd + (stryMutAct_9fa48("300") ? "" : (stryCov_9fa48("300"), '/'))))) ? stryMutAct_9fa48("301") ? full : (stryCov_9fa48("301"), full.slice(stryMutAct_9fa48("302") ? cwd.length - 1 : (stryCov_9fa48("302"), cwd.length + 1))) : full;
                    results.push(rel);
                  }
                }
              }
            } catch {/* binary or unreadable — skip */}
          }
        }
      }
    }
    walk(cwd);
    return results;
  }
}

// ─── Audit result types ───────────────────────────────────────────────────────

export type ProbeLevel = 'pass' | 'fail' | 'warn';
export interface ProbeResult {
  probe: string;
  level: ProbeLevel;
  message: string;
  details: string[];
}
export interface AuditReport {
  results: ProbeResult[];
  passCount: number;
  failCount: number;
  warnCount: number;
}

// ─── runAudit() — pure orchestration, returns data (no side effects) ──────────
/**
 * Run all probes and return a structured report. No console I/O, no process.exit.
 * This is the testable core — the CLI shell wraps it with I/O.
 *
 * @param cwd - The working directory to audit (defaults to process.cwd()).
 * @param only - If non-empty, only run the probe matching this name (like --only=D1).
 */
export function runAudit(cwd: string = process.cwd(), only: string = stryMutAct_9fa48("303") ? "Stryker was here!" : (stryCov_9fa48("303"), '')): AuditReport {
  if (stryMutAct_9fa48("304")) {
    {}
  } else {
    stryCov_9fa48("304");
    const results: ProbeResult[] = stryMutAct_9fa48("305") ? ["Stryker was here"] : (stryCov_9fa48("305"), []);
    function shouldSkip(probe: string): boolean {
      if (stryMutAct_9fa48("306")) {
        {}
      } else {
        stryCov_9fa48("306");
        if (stryMutAct_9fa48("309") ? false : stryMutAct_9fa48("308") ? true : stryMutAct_9fa48("307") ? only : (stryCov_9fa48("307", "308", "309"), !only)) return stryMutAct_9fa48("310") ? true : (stryCov_9fa48("310"), false);
        return stryMutAct_9fa48("313") ? only === probe : stryMutAct_9fa48("312") ? false : stryMutAct_9fa48("311") ? true : (stryCov_9fa48("311", "312", "313"), only !== probe);
      }
    }

    // ── R4 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("316") ? false : stryMutAct_9fa48("315") ? true : stryMutAct_9fa48("314") ? shouldSkip('R4') : (stryCov_9fa48("314", "315", "316"), !shouldSkip(stryMutAct_9fa48("317") ? "" : (stryCov_9fa48("317"), 'R4')))) {
      if (stryMutAct_9fa48("318")) {
        {}
      } else {
        stryCov_9fa48("318");
        const r4 = probeR4(cwd);
        results.push(stryMutAct_9fa48("319") ? {} : (stryCov_9fa48("319"), {
          probe: stryMutAct_9fa48("320") ? "" : (stryCov_9fa48("320"), 'R4'),
          level: r4.result,
          message: r4.message,
          details: stryMutAct_9fa48("321") ? ["Stryker was here"] : (stryCov_9fa48("321"), [])
        }));
      }
    }

    // ── D1 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("324") ? false : stryMutAct_9fa48("323") ? true : stryMutAct_9fa48("322") ? shouldSkip('D1') : (stryCov_9fa48("322", "323", "324"), !shouldSkip(stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), 'D1')))) {
      if (stryMutAct_9fa48("326")) {
        {}
      } else {
        stryCov_9fa48("326");
        const RULE = stryMutAct_9fa48("327") ? "" : (stryCov_9fa48("327"), 'D1 (drift): skills declared in AGENTS.md exist on disk');
        if (stryMutAct_9fa48("330") ? false : stryMutAct_9fa48("329") ? true : stryMutAct_9fa48("328") ? existsSync(join(cwd, 'AGENTS.md')) : (stryCov_9fa48("328", "329", "330"), !existsSync(join(cwd, stryMutAct_9fa48("331") ? "" : (stryCov_9fa48("331"), 'AGENTS.md'))))) {
          if (stryMutAct_9fa48("332")) {
            {}
          } else {
            stryCov_9fa48("332");
            results.push(stryMutAct_9fa48("333") ? {} : (stryCov_9fa48("333"), {
              probe: stryMutAct_9fa48("334") ? "" : (stryCov_9fa48("334"), 'D1'),
              level: stryMutAct_9fa48("335") ? "" : (stryCov_9fa48("335"), 'warn'),
              message: stryMutAct_9fa48("336") ? `` : (stryCov_9fa48("336"), `${RULE}: AGENTS.md not found, skipping`),
              details: stryMutAct_9fa48("337") ? ["Stryker was here"] : (stryCov_9fa48("337"), [])
            }));
          }
        } else {
          if (stryMutAct_9fa48("338")) {
            {}
          } else {
            stryCov_9fa48("338");
            const viols = probeD1(cwd);
            if (stryMutAct_9fa48("341") ? viols.length !== 0 : stryMutAct_9fa48("340") ? false : stryMutAct_9fa48("339") ? true : (stryCov_9fa48("339", "340", "341"), viols.length === 0)) {
              if (stryMutAct_9fa48("342")) {
                {}
              } else {
                stryCov_9fa48("342");
                results.push(stryMutAct_9fa48("343") ? {} : (stryCov_9fa48("343"), {
                  probe: stryMutAct_9fa48("344") ? "" : (stryCov_9fa48("344"), 'D1'),
                  level: stryMutAct_9fa48("345") ? "" : (stryCov_9fa48("345"), 'pass'),
                  message: RULE,
                  details: stryMutAct_9fa48("346") ? ["Stryker was here"] : (stryCov_9fa48("346"), [])
                }));
              }
            } else {
              if (stryMutAct_9fa48("347")) {
                {}
              } else {
                stryCov_9fa48("347");
                results.push(stryMutAct_9fa48("348") ? {} : (stryCov_9fa48("348"), {
                  probe: stryMutAct_9fa48("349") ? "" : (stryCov_9fa48("349"), 'D1'),
                  level: stryMutAct_9fa48("350") ? "" : (stryCov_9fa48("350"), 'fail'),
                  message: RULE,
                  details: viols
                }));
              }
            }
          }
        }
      }
    }

    // ── D2 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("353") ? false : stryMutAct_9fa48("352") ? true : stryMutAct_9fa48("351") ? shouldSkip('D2') : (stryCov_9fa48("351", "352", "353"), !shouldSkip(stryMutAct_9fa48("354") ? "" : (stryCov_9fa48("354"), 'D2')))) {
      if (stryMutAct_9fa48("355")) {
        {}
      } else {
        stryCov_9fa48("355");
        const RULE = stryMutAct_9fa48("356") ? "" : (stryCov_9fa48("356"), 'D2 (drift): no TODO/_comment in JSON configs');
        const d2Findings = probeD2(cwd);
        if (stryMutAct_9fa48("359") ? d2Findings.length !== 0 : stryMutAct_9fa48("358") ? false : stryMutAct_9fa48("357") ? true : (stryCov_9fa48("357", "358", "359"), d2Findings.length === 0)) {
          if (stryMutAct_9fa48("360")) {
            {}
          } else {
            stryCov_9fa48("360");
            results.push(stryMutAct_9fa48("361") ? {} : (stryCov_9fa48("361"), {
              probe: stryMutAct_9fa48("362") ? "" : (stryCov_9fa48("362"), 'D2'),
              level: stryMutAct_9fa48("363") ? "" : (stryCov_9fa48("363"), 'pass'),
              message: RULE,
              details: stryMutAct_9fa48("364") ? ["Stryker was here"] : (stryCov_9fa48("364"), [])
            }));
          }
        } else {
          if (stryMutAct_9fa48("365")) {
            {}
          } else {
            stryCov_9fa48("365");
            results.push(stryMutAct_9fa48("366") ? {} : (stryCov_9fa48("366"), {
              probe: stryMutAct_9fa48("367") ? "" : (stryCov_9fa48("367"), 'D2'),
              level: stryMutAct_9fa48("368") ? "" : (stryCov_9fa48("368"), 'warn'),
              message: stryMutAct_9fa48("369") ? `` : (stryCov_9fa48("369"), `${RULE} — JSON configs accumulate stale comments`),
              details: d2Findings.map(stryMutAct_9fa48("370") ? () => undefined : (stryCov_9fa48("370"), f => stryMutAct_9fa48("371") ? `` : (stryCov_9fa48("371"), `${f.file}: ${f.reason}`)))
            }));
          }
        }
      }
    }

    // ── D3 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("374") ? false : stryMutAct_9fa48("373") ? true : stryMutAct_9fa48("372") ? shouldSkip('D3') : (stryCov_9fa48("372", "373", "374"), !shouldSkip(stryMutAct_9fa48("375") ? "" : (stryCov_9fa48("375"), 'D3')))) {
      if (stryMutAct_9fa48("376")) {
        {}
      } else {
        stryCov_9fa48("376");
        const RULE = stryMutAct_9fa48("377") ? "" : (stryCov_9fa48("377"), 'D3 (drift): canonical goal phrase present in downstream goal-bearing docs');
        const d3Viols = probeD3(cwd);
        if (stryMutAct_9fa48("380") ? d3Viols.length !== 0 : stryMutAct_9fa48("379") ? false : stryMutAct_9fa48("378") ? true : (stryCov_9fa48("378", "379", "380"), d3Viols.length === 0)) {
          if (stryMutAct_9fa48("381")) {
            {}
          } else {
            stryCov_9fa48("381");
            results.push(stryMutAct_9fa48("382") ? {} : (stryCov_9fa48("382"), {
              probe: stryMutAct_9fa48("383") ? "" : (stryCov_9fa48("383"), 'D3'),
              level: stryMutAct_9fa48("384") ? "" : (stryCov_9fa48("384"), 'pass'),
              message: RULE,
              details: stryMutAct_9fa48("385") ? ["Stryker was here"] : (stryCov_9fa48("385"), [])
            }));
          }
        } else {
          if (stryMutAct_9fa48("386")) {
            {}
          } else {
            stryCov_9fa48("386");
            results.push(stryMutAct_9fa48("387") ? {} : (stryCov_9fa48("387"), {
              probe: stryMutAct_9fa48("388") ? "" : (stryCov_9fa48("388"), 'D3'),
              level: stryMutAct_9fa48("389") ? "" : (stryCov_9fa48("389"), 'fail'),
              message: RULE,
              details: d3Viols
            }));
          }
        }
      }
    }

    // ── D4 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("392") ? false : stryMutAct_9fa48("391") ? true : stryMutAct_9fa48("390") ? shouldSkip('D4') : (stryCov_9fa48("390", "391", "392"), !shouldSkip(stryMutAct_9fa48("393") ? "" : (stryCov_9fa48("393"), 'D4')))) {
      if (stryMutAct_9fa48("394")) {
        {}
      } else {
        stryCov_9fa48("394");
        const d4 = probeD4(cwd);
        results.push(stryMutAct_9fa48("395") ? {} : (stryCov_9fa48("395"), {
          probe: stryMutAct_9fa48("396") ? "" : (stryCov_9fa48("396"), 'D4'),
          level: d4.result,
          message: d4.message,
          details: stryMutAct_9fa48("397") ? ["Stryker was here"] : (stryCov_9fa48("397"), [])
        }));
      }
    }

    // ── D5 ──────────────────────────────────────────────────────────────────────
    if (stryMutAct_9fa48("400") ? false : stryMutAct_9fa48("399") ? true : stryMutAct_9fa48("398") ? shouldSkip('D5') : (stryCov_9fa48("398", "399", "400"), !shouldSkip(stryMutAct_9fa48("401") ? "" : (stryCov_9fa48("401"), 'D5')))) {
      if (stryMutAct_9fa48("402")) {
        {}
      } else {
        stryCov_9fa48("402");
        const RULE = stryMutAct_9fa48("403") ? "" : (stryCov_9fa48("403"), 'D5 (drift, inverse): every file with canonical phrase is enrolled or exempt');
        const d5Findings = probeD5(cwd);
        if (stryMutAct_9fa48("406") ? d5Findings.length !== 0 : stryMutAct_9fa48("405") ? false : stryMutAct_9fa48("404") ? true : (stryCov_9fa48("404", "405", "406"), d5Findings.length === 0)) {
          if (stryMutAct_9fa48("407")) {
            {}
          } else {
            stryCov_9fa48("407");
            results.push(stryMutAct_9fa48("408") ? {} : (stryCov_9fa48("408"), {
              probe: stryMutAct_9fa48("409") ? "" : (stryCov_9fa48("409"), 'D5'),
              level: stryMutAct_9fa48("410") ? "" : (stryCov_9fa48("410"), 'pass'),
              message: RULE,
              details: stryMutAct_9fa48("411") ? ["Stryker was here"] : (stryCov_9fa48("411"), [])
            }));
          }
        } else {
          if (stryMutAct_9fa48("412")) {
            {}
          } else {
            stryCov_9fa48("412");
            results.push(stryMutAct_9fa48("413") ? {} : (stryCov_9fa48("413"), {
              probe: stryMutAct_9fa48("414") ? "" : (stryCov_9fa48("414"), 'D5'),
              level: stryMutAct_9fa48("415") ? "" : (stryCov_9fa48("415"), 'fail'),
              message: RULE,
              details: stryMutAct_9fa48("416") ? [] : (stryCov_9fa48("416"), [...d5Findings.map(stryMutAct_9fa48("417") ? () => undefined : (stryCov_9fa48("417"), f => stryMutAct_9fa48("418") ? `` : (stryCov_9fa48("418"), `${f.file}: ${f.reason}`))), stryMutAct_9fa48("419") ? "Stryker was here!" : (stryCov_9fa48("419"), ''), stryMutAct_9fa48("420") ? "" : (stryCov_9fa48("420"), 'Fix: add the file to DOWNSTREAM_DOCS in audit-ai-docs.ts,'), stryMutAct_9fa48("421") ? "" : (stryCov_9fa48("421"), '     OR add a justified pattern to D5_FROZEN/TEST_INFRA/ROOT_SOURCE/GITIGNORED.')])
            }));
          }
        }
      }
    }
    const passCount = stryMutAct_9fa48("422") ? results.length : (stryCov_9fa48("422"), results.filter(stryMutAct_9fa48("423") ? () => undefined : (stryCov_9fa48("423"), r => stryMutAct_9fa48("426") ? r.level !== 'pass' : stryMutAct_9fa48("425") ? false : stryMutAct_9fa48("424") ? true : (stryCov_9fa48("424", "425", "426"), r.level === (stryMutAct_9fa48("427") ? "" : (stryCov_9fa48("427"), 'pass'))))).length);
    const failCount = stryMutAct_9fa48("428") ? results.length : (stryCov_9fa48("428"), results.filter(stryMutAct_9fa48("429") ? () => undefined : (stryCov_9fa48("429"), r => stryMutAct_9fa48("432") ? r.level !== 'fail' : stryMutAct_9fa48("431") ? false : stryMutAct_9fa48("430") ? true : (stryCov_9fa48("430", "431", "432"), r.level === (stryMutAct_9fa48("433") ? "" : (stryCov_9fa48("433"), 'fail'))))).length);
    const warnCount = stryMutAct_9fa48("434") ? results.length : (stryCov_9fa48("434"), results.filter(stryMutAct_9fa48("435") ? () => undefined : (stryCov_9fa48("435"), r => stryMutAct_9fa48("438") ? r.level !== 'warn' : stryMutAct_9fa48("437") ? false : stryMutAct_9fa48("436") ? true : (stryCov_9fa48("436", "437", "438"), r.level === (stryMutAct_9fa48("439") ? "" : (stryCov_9fa48("439"), 'warn'))))).length);
    return stryMutAct_9fa48("440") ? {} : (stryCov_9fa48("440"), {
      results,
      passCount,
      failCount,
      warnCount
    });
  }
}

// ─── CLI entrypoint ────────────────────────────────────────────────────────────
/**
 * Print a report to stdout with ANSI colours (if TTY) and exit.
 * This is the I/O shell around `runAudit()`.
 */
export function main(cwd: string = process.cwd(), argv: string[] = process.argv): void {
  if (stryMutAct_9fa48("441")) {
    {}
  } else {
    stryCov_9fa48("441");
    const useColour = process.stdout.isTTY;
    const RED = useColour ? stryMutAct_9fa48("442") ? "" : (stryCov_9fa48("442"), '\x1b[0;31m') : stryMutAct_9fa48("443") ? "Stryker was here!" : (stryCov_9fa48("443"), '');
    const GREEN = useColour ? stryMutAct_9fa48("444") ? "" : (stryCov_9fa48("444"), '\x1b[0;32m') : stryMutAct_9fa48("445") ? "Stryker was here!" : (stryCov_9fa48("445"), '');
    const YELLOW = useColour ? stryMutAct_9fa48("446") ? "" : (stryCov_9fa48("446"), '\x1b[1;33m') : stryMutAct_9fa48("447") ? "Stryker was here!" : (stryCov_9fa48("447"), '');
    const NC = useColour ? stryMutAct_9fa48("448") ? "" : (stryCov_9fa48("448"), '\x1b[0m') : stryMutAct_9fa48("449") ? "Stryker was here!" : (stryCov_9fa48("449"), '');
    const onlyArg = stryMutAct_9fa48("450") ? argv.find(a => a.startsWith('--only=')) : (stryCov_9fa48("450"), argv.slice(2).find(stryMutAct_9fa48("451") ? () => undefined : (stryCov_9fa48("451"), a => stryMutAct_9fa48("452") ? a.endsWith('--only=') : (stryCov_9fa48("452"), a.startsWith(stryMutAct_9fa48("453") ? "" : (stryCov_9fa48("453"), '--only='))))));
    const only = onlyArg ? stryMutAct_9fa48("454") ? onlyArg : (stryCov_9fa48("454"), onlyArg.slice((stryMutAct_9fa48("455") ? "" : (stryCov_9fa48("455"), '--only=')).length)) : stryMutAct_9fa48("456") ? "Stryker was here!" : (stryCov_9fa48("456"), '');
    const report = runAudit(cwd, only);
    for (const r of report.results) {
      if (stryMutAct_9fa48("457")) {
        {}
      } else {
        stryCov_9fa48("457");
        const prefix = (stryMutAct_9fa48("460") ? r.level !== 'pass' : stryMutAct_9fa48("459") ? false : stryMutAct_9fa48("458") ? true : (stryCov_9fa48("458", "459", "460"), r.level === (stryMutAct_9fa48("461") ? "" : (stryCov_9fa48("461"), 'pass')))) ? stryMutAct_9fa48("462") ? `` : (stryCov_9fa48("462"), `${GREEN}PASS${NC}`) : (stryMutAct_9fa48("465") ? r.level !== 'fail' : stryMutAct_9fa48("464") ? false : stryMutAct_9fa48("463") ? true : (stryCov_9fa48("463", "464", "465"), r.level === (stryMutAct_9fa48("466") ? "" : (stryCov_9fa48("466"), 'fail')))) ? stryMutAct_9fa48("467") ? `` : (stryCov_9fa48("467"), `${RED}FAIL${NC}`) : stryMutAct_9fa48("468") ? `` : (stryCov_9fa48("468"), `${YELLOW}WARN${NC}`);
        console.log(stryMutAct_9fa48("469") ? `` : (stryCov_9fa48("469"), `${prefix}: ${r.message}`));
        for (const detail of r.details) {
          if (stryMutAct_9fa48("470")) {
            {}
          } else {
            stryCov_9fa48("470");
            console.log(stryMutAct_9fa48("471") ? `` : (stryCov_9fa48("471"), `    ${detail}`));
          }
        }
      }
    }
    console.log(stryMutAct_9fa48("472") ? "Stryker was here!" : (stryCov_9fa48("472"), ''));
    console.log(stryMutAct_9fa48("473") ? "" : (stryCov_9fa48("473"), '─────────────────────────────────────────'));
    console.log(stryMutAct_9fa48("474") ? `` : (stryCov_9fa48("474"), `Audit complete: ${report.passCount} PASS, ${report.failCount} FAIL, ${report.warnCount} WARN`));
    if (stryMutAct_9fa48("478") ? report.failCount <= 0 : stryMutAct_9fa48("477") ? report.failCount >= 0 : stryMutAct_9fa48("476") ? false : stryMutAct_9fa48("475") ? true : (stryCov_9fa48("475", "476", "477", "478"), report.failCount > 0)) process.exit(1);
    process.exit(0);
  }
}

// Run when invoked directly (not when imported by tests)
if (stryMutAct_9fa48("481") ? typeof process !== 'undefined' && process.argv[1] != null || process.argv[1].endsWith('audit-ai-docs.ts') || process.argv[1].endsWith('audit-ai-docs.js') : stryMutAct_9fa48("480") ? false : stryMutAct_9fa48("479") ? true : (stryCov_9fa48("479", "480", "481"), (stryMutAct_9fa48("483") ? typeof process !== 'undefined' || process.argv[1] != null : stryMutAct_9fa48("482") ? true : (stryCov_9fa48("482", "483"), (stryMutAct_9fa48("485") ? typeof process === 'undefined' : stryMutAct_9fa48("484") ? true : (stryCov_9fa48("484", "485"), typeof process !== (stryMutAct_9fa48("486") ? "" : (stryCov_9fa48("486"), 'undefined')))) && (stryMutAct_9fa48("488") ? process.argv[1] == null : stryMutAct_9fa48("487") ? true : (stryCov_9fa48("487", "488"), process.argv[1] != null)))) && (stryMutAct_9fa48("490") ? process.argv[1].endsWith('audit-ai-docs.ts') && process.argv[1].endsWith('audit-ai-docs.js') : stryMutAct_9fa48("489") ? true : (stryCov_9fa48("489", "490"), (stryMutAct_9fa48("491") ? process.argv[1].startsWith('audit-ai-docs.ts') : (stryCov_9fa48("491"), process.argv[1].endsWith(stryMutAct_9fa48("492") ? "" : (stryCov_9fa48("492"), 'audit-ai-docs.ts')))) || (stryMutAct_9fa48("493") ? process.argv[1].startsWith('audit-ai-docs.js') : (stryCov_9fa48("493"), process.argv[1].endsWith(stryMutAct_9fa48("494") ? "" : (stryCov_9fa48("494"), 'audit-ai-docs.js')))))))) {
  if (stryMutAct_9fa48("495")) {
    {}
  } else {
    stryCov_9fa48("495");
    main();
  }
}