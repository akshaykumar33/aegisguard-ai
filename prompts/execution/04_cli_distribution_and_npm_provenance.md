# PHASE 4 PROMPT: CLI Distribution & Automated npm Release with Provenance

## ROLE
Act as a **Developer Experience (DX) Engineer & Release Automation Architect**.

## CONTEXT
You are productionizing `@codeguard/cli` for global public distribution via `npm`, `npx`, and `pnpm`, complete with automated CI/CD release pipelines and cryptographic package provenance signing.

## TARGET SPECIFICATIONS
1. **CLI Packaging & Binary Entrypoint**:
   - Verify `packages/cli/package.json` has `bin: { "codeguard": "./dist/index.js" }` with `#!/usr/bin/env node` shebang.
   - Bundle using `tsup` or `esbuild` with minification and source maps for instant startup (< 50ms).
2. **Commands Supported**:
   - `codeguard init`: Scaffolds `codeguard.config.json` and git pre-commit hook.
   - `codeguard login`: Authenticates developer via browser OAuth / CLI device flow.
   - `codeguard scan [--staged] [--deep-ast]`: Runs local Shannon entropy and AST vulnerability scan.
   - `codeguard review pr --number=<id>`: Triggers automated AI PR review simulation or cloud check.
   - `codeguard policy check`: Evaluates branch protection rules.
   - `codeguard doctor`: Diagnoses node version, git config, and API connectivity.
3. **Automated GitHub Actions Release Workflow**:
   - Create `.github/workflows/release-cli.yml` triggered on git tags (`v*.*.*`).
   - Run linter, typecheck, and vitest test suite.
   - Publish to npm registry using `--provenance` to guarantee verifiable build origin from GitHub Actions.
   - Create GitHub Release with auto-generated changelog notes.

## ACCEPTANCE CRITERIA
- `npx @codeguard/cli --help` runs standalone cleanly.
- `codeguard scan` returns exit code 0 on clean code and code 1 on critical security leaks.
- GitHub Actions release workflow successfully builds and signs the package artifact.
