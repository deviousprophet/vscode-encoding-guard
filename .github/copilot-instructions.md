# Copilot repository instructions — vscode-encodex

Short summary
-------------
- TypeScript VS Code extension that automatically detects and applies file encodings so files open and save correctly in mixed-encoding projects.
- Users configure `encodex.extensionMap` (resource-scoped) to map file extensions to a VS Code encoding ID (e.g. `"utf8"`, `"windows1252"`). For any file that contains an `<?xml ... encoding="..."?>` declaration in its header, the extension automatically detects and applies that encoding — no mapping required.
- On every file open, the extension compares the expected encoding against what VS Code actually used (`doc.encoding`) and shows a "Reopen / Ignore" warning on mismatch.
- A status bar item always shows the byte-detected encoding of the active file; clicking it opens the VS Code encoding picker.

Key files
---------
- `src/detector.ts` — encoding detection: BOM checks, XML declaration parsing, heuristic UTF-8 round-trip fallback.
- `src/normalizer.ts` — maps encoding name variants (`UTF-8`, `ISO-8859-1`, `windows-1252`, `cp1252`, …) to canonical VS Code identifiers.
- `src/configManager.ts` — reads `encodex.extensionMap` from configuration and resolves the explicit encoding for a given URI; returns `null` when not mapped, which causes `applier.ts` to fall through to XML declaration detection.
- `src/applier.ts` — orchestrates detection + config lookup + user notification on file open.
- `src/statusBar.ts` — status bar item (`EncodexStatusBar` class).
- `src/extension.ts` — extension activation, command registration, event wiring.
- `src/test/detector.test.ts` — unit + integration tests for `detector.ts` using files under `sample/`.
- `src/test/normalizer.test.ts` — unit tests for `normalizer.ts`.
- `src/test/configManager.test.ts` — integration tests for `configManager.ts` (requires VS Code API).
- `sample/` — committed test samples used by the test suite (includes `utf8-decl.xml`, `iso88591-decl.xml`, `utf8.arxml`).

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
- When changing detection heuristics in `src/detector.ts`, add unit tests in `src/test/detector.test.ts` and include representative sample files in `sample/`.
- When adding new encoding name mappings, update `src/normalizer.ts` and add cases to `src/test/normalizer.test.ts`.

Quick pointers
--------------
- `detectEncoding(buffer)` in `src/detector.ts` is intentionally conservative — add tests for new heuristics.
- `detectXmlDeclaration(buffer)` reads only the first 1 KB and handles UTF-16 (BOM-prefixed) files automatically.
- `normalizeEncoding(raw)` strips hyphens/underscores/spaces and lowercases before lookup — the map key format is always stripped-lowercase (e.g. `utf8`, `iso88591`, `windows1252`).
- All sample files are committed in `sample/`. No sample files are created or deleted at test runtime.
- Use the existing `npm` scripts for consistent local runs.
