import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const COMMON = join(__dirname, "../../../.claude/skills/pipeline/helpers/lib/common.sh");

// Source common.sh with REPO_ROOT seamed to `repo`, then echo the resolver output.
function resolve(fn: string, repo: string, env: Record<string, string> = {}): string {
  return execFileSync(
    "bash",
    ["-c", `source "${COMMON}"; ${fn}`],
    { env: { ...process.env, REPO_ROOT: repo, ...env }, encoding: "utf8" },
  ).trim();
}

describe("resolve_orch_home", () => {
  it("returns .claude path when .claude/orchestrator-prompts exists (framework dogfood)", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-fw-"));
    mkdirSync(join(repo, ".claude/orchestrator-prompts"), { recursive: true });
    expect(resolve("resolve_orch_home", repo)).toBe(join(repo, ".claude/orchestrator-prompts"));
  });

  it("returns .ai-factory path when .claude/orchestrator-prompts is absent (consumer)", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-cons-"));
    expect(resolve("resolve_orch_home", repo)).toBe(join(repo, ".ai-factory/orchestrator-prompts"));
  });

  it("honours MO_ORCH_HOME override over detection", () => {
    const repo = mkdtempSync(join(tmpdir(), "orchhome-ovr-"));
    mkdirSync(join(repo, ".claude/orchestrator-prompts"), { recursive: true });
    expect(resolve("resolve_orch_home", repo, { MO_ORCH_HOME: "/custom/home" })).toBe("/custom/home");
  });
});

describe("resolve_plan_path", () => {
  it("returns the framework wave-plan when it exists", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-fw-"));
    mkdirSync(join(repo, "docs/meta-factory"), { recursive: true });
    writeFileSync(join(repo, "docs/meta-factory/wave-sequencing-plan.md"), "# plan");
    expect(resolve("resolve_plan_path", repo)).toBe(join(repo, "docs/meta-factory/wave-sequencing-plan.md"));
  });

  it("returns <orch-home>/plan.md for a consumer (no framework plan)", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-cons-"));
    expect(resolve("resolve_plan_path", repo)).toBe(join(repo, ".ai-factory/orchestrator-prompts/plan.md"));
  });

  it("honours MO_WAVE_PLAN override", () => {
    const repo = mkdtempSync(join(tmpdir(), "plan-ovr-"));
    expect(resolve("resolve_plan_path", repo, { MO_WAVE_PLAN: "/x/p.md" })).toBe("/x/p.md");
  });
});
