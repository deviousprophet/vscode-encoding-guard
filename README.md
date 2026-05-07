# vscode-encodex

Encodex is a VS Code extension that automatically detects and applies the correct file encoding when you open files, so text is never garbled in mixed-encoding projects.

## How it works

1. **XML declaration** — For any file that starts with `<?xml ... encoding="..."?>`, Encodex reads the declared encoding and silently reopens the file with the correct encoding if VS Code opened it with a different one.
2. **File map** — You can pin a specific file to an encoding. Takes priority over everything else.
3. **Extension map** — You can bind a file extension to an encoding. Wins over XML declarations.

Priority order: `fileMap` → `extensionMap` → XML declaration → no action.

## Configuration

The easiest way to configure encodings is via the **right-click context menu** in the Explorer or editor — select **Encodex** → **Set Extension Encoding...** or **Set File Encoding...**.

Or edit settings manually:

```jsonc
// Map a file extension to an encoding (applies to all files with that extension)
"encodex.extensionMap": {
    ".csv":  "windows1252",
    ".log":  "iso88591"
},

// Override encoding for a specific file (workspace-relative path, wins over extensionMap)
"encodex.fileMap": {
    "data/legacy-report.csv": "iso88591"
}
```

- Values are VS Code encoding identifiers: `utf8`, `utf8bom`, `utf16le`, `utf16be`, `iso88591`, `windows1252`, `iso88592`, `shiftjis`, etc.
- Both settings are **resource-scoped**: you can set different values per workspace folder.

> Files with an `<?xml ... encoding="..."?>` declaration are handled automatically — no mapping required.

## Context menu

Right-click any file in the Explorer or editor to access the **Encodex** submenu:

| Item | Action |
|---|---|
| **Set Extension Encoding...** | Pick an encoding and apply it to all files with this extension (`extensionMap`) |
| **Set File Encoding...** | Pick an encoding and pin it to this specific file (`fileMap`) |
| **Open Encodex Settings** | Open VS Code Settings filtered to Encodex |

## Commands

| Command | Description |
|---|---|
| `Encodex: Detect Encoding` | Shows the byte-detected encoding, VS Code's current encoding, XML declaration (if any), and the configured expected encoding for the active file. |
| `Encodex: Reopen with Encoding...` | Opens VS Code's built-in encoding picker to reopen the current file with a chosen encoding. |

## Status bar

A status bar item at the bottom right always shows the byte-level detected encoding of the active file. Click it to reopen the file with a different encoding.


