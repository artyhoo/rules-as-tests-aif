# fixtures/

> **Authoritative for:** skeleton fixture configs for functional template render audit (`template-render.audit.ts`). Individual dirs are scope-bound by stack name (`ts-server`, `react-next`).
> **NOT authoritative for:** project goal — see [README.md#why-this-exists](../../../../README.md#why-this-exists).

Minimal consumer project skeletons used by `template-render.audit.ts` to exercise `install.sh`. Each fixture contains only a `package.json` (declaration-only; no `npm install` is performed) and an empty `src/` placeholder. The test creates a `tmpdir()` copy and invokes `install.sh <stack>` from it.
