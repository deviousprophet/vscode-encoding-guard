# Copilot repository instructions — vscode-encoding-guard

Short summary
-------------
- TypeScript VS Code extension that automatically detects and applies file encodings so files open and save correctly in mixed-encoding projects.
- Users configure `encoding-guard.extensionMap` (resource-scoped) to map file extensions to a VS Code encoding ID (e.g. `"utf8"`, `"windows1252"`), or `encoding-guard.fileMap` to pin a specific file path to an encoding. For any file that contains an `<?xml ... encoding="..."?>` declaration in its header, the extension automatically detects and applies that encoding — no mapping required.
- Priority order for encoding resolution: `fileMap` (per-file) → `extensionMap` (per-extension) → XML declaration → no action.
- On every file open, the extension compares the expected encoding against what VS Code actually used (`doc.encoding`) and **silently reopens** the file with the correct encoding on mismatch — no user interaction required.

Key files
---------
- `src/detector.ts` — encoding detection: BOM checks, XML declaration parsing, heuristic UTF-8 round-trip fallback.
- `src/normalizer.ts` — maps encoding name variants (`UTF-8`, `ISO-8859-1`, `windows-1252`, `cp1252`, …) to canonical VS Code identifiers.
- `src/encodingList.ts` — the canonical list of supported encodings as `QuickPickItem` entries; exports `pickEncoding(currentId?)` used by context-menu commands.
- `src/configManager.ts` — resolves the expected encoding for a URI by checking `fileMap` first, then `extensionMap`; returns `null` when not mapped, which causes `applier.ts` to fall through to XML declaration detection.
- `src/applier.ts` — orchestrates detection + config lookup + silent auto-reopen on mismatch. Exports `resolveTargetEncoding(uri, buf)` (used by tests) and `handleDocumentOpen(doc)` (wired to `onDidOpenTextDocument`).
- `src/extension.ts` — extension activation, command registration, event wiring.
- `src/test/applier.test.ts` — integration tests for `resolveTargetEncoding` across all file types and the extensionMap config-wins-over-declaration rule.
- `src/test/detector.test.ts` — unit + integration tests for `detector.ts` using files under `sample/`.
- `src/test/normalizer.test.ts` — unit tests for `normalizer.ts`.
- `src/test/configManager.test.ts` — integration tests for `configManager.ts` (requires VS Code API).
- `sample/` — committed binary test samples (guarded by `.gitattributes sample/* binary` to prevent CRLF corruption).

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
- `resolveTargetEncoding(uri, buf)` in `src/applier.ts` is the single coordination point: checks `fileMap` then `extensionMap` (via `configManager`), then falls back to `detectXmlDeclaration`.
- The reopen mechanism in `handleDocumentOpen`: temporarily sets `files.encoding` to the target, calls `workbench.action.files.revert`, then restores the previous value in a `finally` block.
- `detectEncoding(buffer)` in `src/detector.ts` is intentionally conservative — add tests for new heuristics.
- `detectXmlDeclaration(buffer)` reads only the first 1 KB and handles UTF-16 (BOM-prefixed) files automatically.
- `normalizeEncoding(raw)` strips hyphens/underscores/spaces and lowercases before lookup — the map key format is always stripped-lowercase (e.g. `utf8`, `iso88591`, `windows1252`). The canonical VS Code identifier for ISO-8859-1 / Latin-1 is `iso88591`, **not** `latin1`.
- All sample files are committed in `sample/`. No sample files are created or deleted at test runtime.
- Use the existing `npm` scripts for consistent local runs.
