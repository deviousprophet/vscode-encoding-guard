# Copilot repository instructions — vscode-encodex

Short summary
-------------
- TypeScript VS Code extension that automatically detects and applies file encodings so files open and save correctly in mixed-encoding projects.

Key files
---------
- `src/encoding.ts` — encoding detection utilities (BOM checks, heuristics).
- `src/extension.ts` — extension activation and command wiring.
- `src/test/encoding.test.ts` — unit + integration tests that exercise `detectEncoding` using files under `sample/`.
- `sample/` — committed test samples used by the test suite.

Build & test (quick)
--------------------
- Install dependencies: `npm ci`
- Build extension: `npm run compile`
- Compile tests: `npm run compile-tests`
- Run tests: `npm test`

Guidance for Copilot / automated agents
--------------------------------------
- Keep edits small and module-scoped.
- Run the TypeScript checker and tests locally after changes: `npm run check-types && npm test`.
- Do not modify generated build output under `out/` or `dist/` — change source files in `src/` and update the build steps when needed.
- When changing detection heuristics in `src/encoding.ts`, add unit tests in `src/test/` and include representative sample files in `sample/`.

Quick pointers
--------------
- `detectEncoding(buffer)` in `src/encoding.ts` is intentionally conservative — add tests for new heuristics.
- `utf8_bom.txt` is created by the tests at runtime (the BOM byte sequence is written then removed by the test). Other sample files are committed in `sample/`.
- Use the existing `npm` scripts for consistent local runs.
