# Changelog

## [1.0.0] — 2026-05-07

### Added

- **Auto-reopen on encoding mismatch** — on every file open, EncodingGuard silently
  compares the detected encoding against the one VS Code actually used and, when they
  differ, immediately reopens the file with the correct encoding (no prompts or popups).
- **`encodingguard.extensionMap`** configuration — map file extensions (e.g. `".csv"`,
  `".arxml"`) to a VS Code encoding ID so those files always open correctly.
- **`encodingguard.fileMap`** configuration — pin a specific workspace-relative file
  path to an encoding; takes priority over `extensionMap`.
- **XML declaration auto-detection** — any file whose first 1 KB contains an
  `<?xml ... encoding="..."?>` declaration is reopened with the declared encoding
  automatically (no configuration required).
- **BOM detection** — UTF-8 BOM, UTF-16 LE, and UTF-16 BE are recognised and applied.
- **Context-menu commands** (Explorer & Editor):
  - *Detect File Encoding* — shows the resolved encoding for the focused file.
  - *Set Encoding for Extension* — maps the file's extension to any encoding via a
    searchable QuickPick (all VS Code–supported encodings listed).
  - *Set Encoding for This File* — pins the exact file path to a chosen encoding.
  - *Open EncodingGuard Settings* — navigates directly to the extension settings.
- **Encoding normalizer** — accepts common encoding name variants
  (`UTF-8`, `ISO-8859-1`, `windows-1252`, `cp1252`, `latin-1`, …) and maps them to
  canonical VS Code encoding identifiers.
