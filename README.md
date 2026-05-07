# Encoding Guard

Encoding Guard is a VS Code extension that automatically detects and applies the correct file encoding when you open files, so text is never garbled in mixed-encoding projects.

## How it works

1. **XML declaration** — For any file that starts with `<?xml ... encoding="..."?>`, Encoding Guard reads the declared encoding and silently reopens the file with the correct encoding if VS Code opened it with a different one.
2. **File map** — You can pin a specific file to an encoding. Takes priority over everything else.
3. **Extension map** — You can bind a file extension to an encoding. Wins over XML declarations.

Priority order: `fileMap` → `extensionMap` → XML declaration → no action.

## Configuration

The easiest way to configure encodings is via the **right-click context menu** in the Explorer or editor — select **Encoding Guard** → **Set Extension Encoding...** or **Set File Encoding...**.

Or edit settings manually:

```jsonc
// Map a file extension to an encoding (applies to all files with that extension)
"encoding-guard.extensionMap": {
    ".csv":  "windows1252",
    ".log":  "iso88591"
},

// Override encoding for a specific file (workspace-relative path, wins over extensionMap)
"encoding-guard.fileMap": {
    "data/legacy-report.csv": "iso88591"
}
```

- Both settings are **resource-scoped**: you can set different values per workspace folder.

> Files with an `<?xml ... encoding="..."?>` declaration are handled automatically — no mapping required.

## Context menu

Right-click any file in the Explorer or editor to access the **Encoding Guard** submenu:

| Item | Action |
|---|---|
| **Set Extension Encoding...** | Pick an encoding and apply it to all files with this extension (`extensionMap`) |
| **Set File Encoding...** | Pick an encoding and pin it to this specific file (`fileMap`) |
| **Open Encoding Guard Settings** | Open VS Code Settings filtered to Encoding Guard |

## Issues

Found a bug or want to request a feature? Please open an issue: [Issues](https://github.com/deviousprophet/vscode-encoding-guard/issues)

Include a short description, steps to reproduce, and sample files when possible.
