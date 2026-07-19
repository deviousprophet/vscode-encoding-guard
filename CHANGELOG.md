# Changelog

## [1.3.0] - 2026-07-19

### Added

- Added `Encoding Guard: Convert File to Encoding...` command that transcodes file bytes to a chosen encoding and saves to disk, distinct from the existing _Set File/Extension Encoding_ commands which only affect future interpretation via `patternMap`
- Added `.editorconfig` charset support — `charset` values from `.editorconfig` are now read as an implicit encoding source for matching files, reducing config duplication

## [1.2.0] - 2026-07-19

### Added

- Added opt-in heuristic encoding detection fallback for unmapped files via `jschardet` (enable with `encoding-guard.enableHeuristicFallback`)

## [1.1.0] - 2026-05-08

### Added

- Added byte-level XML preamble probing to decide when to widen scanning for declaration parsing while keeping the common path lightweight

### Changed

- Replaced separate `extensionMap` and `fileMap` behavior with a single `encoding-guard.patternMap` setting
- Pattern resolution now applies specificity ordering: exact path matches first, then more specific glob patterns, then extension shorthand (for example `.csv`) as the default fallback
- *Set Extension Encoding...* and *Set File Encoding...* context menu commands now both write to `patternMap`

## [1.0.1] - 2026-05-07

### Fixed

- Encoding Guard context menu now only appears when right-clicking on files; it no longer appears on folders

## [1.0.0] - 2026-05-07

### Added

- Added auto-reopen on encoding mismatch: on every file open, EncodingGuard silently compares the detected encoding against the one VS Code actually used and, when they differ, immediately reopens the file with the correct encoding (no prompts or popups)
- Added `encodingguard.extensionMap` configuration to map file extensions (e.g. `.csv`, `.arxml`) to a VS Code encoding ID so those files always open correctly
- Added `encodingguard.fileMap` configuration to pin a specific workspace-relative file path to an encoding; takes priority over `extensionMap`
- Added XML declaration auto-detection: any file whose first 1 KB contains an `<?xml ... encoding="..."?>` declaration is reopened with the declared encoding automatically (no configuration required)
- Added BOM detection for UTF-8 BOM, UTF-16 LE, and UTF-16 BE
- Added context-menu commands for Explorer & Editor:
  - *Set Encoding for Extension* — maps the file's extension to any encoding via a searchable QuickPick (all VS Code–supported encodings listed)
  - *Set Encoding for This File* — pins the exact file path to a chosen encoding
  - *Open Encoding Guard Settings* — navigates directly to the extension settings
- Added *Detect File Encoding* Command Palette command — shows the resolved encoding for the active file
- Added an encoding normalizer that accepts common encoding name variants (`UTF-8`, `ISO-8859-1`, `windows-1252`, `cp1252`, `latin-1`, …) and maps them to canonical VS Code encoding identifiers
