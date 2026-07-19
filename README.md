# Encoding Guard

[![Visual Studio Marketplace](https://img.shields.io/badge/Visual_Studio_Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=deviousprophet.vscode-encoding-guard)
[![Open VSX Registry](https://img.shields.io/badge/Open_VSX_Registry-c160ef)](https://open-vsx.org/extension/deviousprophet/vscode-encoding-guard)
[![GitHub Release](https://img.shields.io/github/v/release/deviousprophet/vscode-encoding-guard?label=Latest%20Release&color=brightgreen&logo=github)](https://github.com/deviousprophet/vscode-encoding-guard/releases)
[![License](https://img.shields.io/github/license/deviousprophet/vscode-encoding-guard?color=yellow)](https://github.com/deviousprophet/vscode-encoding-guard/blob/master/LICENSE)

Encoding Guard is a VS Code extension that automatically detects and applies the correct file encoding when you open files, so text is never garbled in mixed-encoding projects.

## How it works

1. **Pattern matching** — Map file patterns to encodings via `encoding-guard.patternMap`. Patterns are matched by specificity:
   - **Exact paths** (e.g., `data/report.csv`) — highest priority, specific file overrides
   - **Glob patterns** (e.g., `src/**/*.xml`, `**/*.csv`) — medium priority, more specific globs win over less specific
   - **Extension shorthand** (e.g. `.csv`) — lowest priority, acts as default for all matching extensions
2. **XML declaration** — For any file that starts with `<?xml ... encoding="..."?>`, Encoding Guard reads the declared encoding and silently reopens the file with the correct encoding if VS Code opened it with a different one. BOM-prefixed XML files (UTF-8 BOM, UTF-16 LE/BE) are handled transparently — the BOM is detected internally and skipped when parsing the declaration.

Priority order: `patternMap` (by specificity) → XML declaration → `enableHeuristicFallback` (opt-in) → `.editorconfig charset` → no action.

> **Note:** UTF-8 BOM, UTF-16 LE, and UTF-16 BE files are also detected and reopened with the correct encoding. VS Code handles BOM natively for non-XML files; Encoding Guard's BOM detection additionally powers XML declaration parsing for BOM-prefixed XML files.

### Implicit encoding sources

In addition to explicit `patternMap` config, Encoding Guard reads from these sources automatically (lower priority than `patternMap`):

- **XML declarations** — files with `<?xml encoding="..."?>` are decoded using the declared encoding
- **`.editorconfig`** — if your project has an `.editorconfig` with a `charset` rule matching the file, it is used as an implicit encoding source (mapped values: `utf-8`, `utf-8-bom`, `utf-16le`, `utf-16be`, `latin1`)
- **Heuristic fallback** — when `encoding-guard.enableHeuristicFallback` is enabled, `jschardet` guesses the encoding as a last resort before `.editorconfig`

### Transcoding files

Use **Encoding Guard: Convert File to Encoding...** (available in the right-click context menu or Command Palette) to transcode a file's bytes to a different encoding and save to disk. This is distinct from setting encoding metadata — it actually rewrites the file on disk.

## Configuration

The easiest way to configure encodings is via the **right-click context menu** in the Explorer or editor — select **Encoding Guard** → **Set Extension Encoding...** or **Set File Encoding...**.

Or edit settings manually:

```jsonc
// Unified pattern map: exact paths, globs, or extension shorthand
// Patterns are matched by specificity: exact paths > globs (more specific first) > extensions
"encoding-guard.patternMap": {
    ".csv":                    "windows1252",     // Default: all .csv files
    "**/*.arxml":              "utf8",            // All .arxml files across directories
    "data/legacy/**/*.txt":    "iso88591",        // Specific subdirectory
    "config/old-report.csv":   "cp1252"           // Override: this specific file
}

// Opt-in: guess encoding for unmapped files without XML declarations
"encoding-guard.enableHeuristicFallback": true   // default: false
```

- Settings are **resource-scoped**: you can set different values per workspace folder.

> Files with an `<?xml ... encoding="..."?>` declaration are handled automatically — no mapping required.

## Context menu

Right-click any file in the Explorer or editor to access the **Encoding Guard** submenu:

| Item | Action |
|---|---|
| **Set Extension Encoding...** | Pick an encoding and apply it to all files with this extension (adds `.ext` to `patternMap`) |
| **Set File Encoding...** | Pick an encoding and pin it to this specific file (adds exact path to `patternMap`) |
| **Convert File to Encoding...** | Read file from disk, transcode bytes to a chosen encoding, and save |
| **Open Encoding Guard Settings** | Open VS Code Settings filtered to Encoding Guard |

## Issues

Found a bug or want to request a feature? Please open an issue: [Issues](https://github.com/deviousprophet/vscode-encoding-guard/issues)

Include a short description, steps to reproduce, and sample files when possible.
