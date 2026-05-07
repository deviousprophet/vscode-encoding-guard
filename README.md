# vscode-encodex

Encodex is a VS Code extension that automatically detects and applies the correct file encoding when you open files, so text is never garbled in mixed-encoding projects.

## How it works

1. **XML declaration** — For any file that starts with `<?xml ... encoding="..."?>`, Encodex reads the declared encoding and silently reopens the file with the correct encoding if VS Code opened it with a different one.
2. **Extension map** — You can explicitly bind a file extension to an encoding in settings. The explicit mapping always wins over the XML declaration.

If neither applies, the extension stays silent.

## Configuration

Add entries to `encodex.extensionMap` in your user or workspace settings:

```jsonc
"encodex.extensionMap": {
    ".csv":  "windows1252",
    ".log":  "iso88591"
}
```

- Keys are file extensions including the leading dot (case-insensitive).
- Values are VS Code encoding identifiers: `utf8`, `utf8bom`, `utf16le`, `utf16be`, `iso88591`, `windows1252`, `iso88592`, `shiftjis`, etc.
- The setting is **resource-scoped**: you can set different values per workspace folder.

> Files with an `<?xml ... encoding="..."?>` declaration are handled automatically for all extensions — no mapping required.

## Commands

| Command | Description |
|---|---|
| `Encodex: Detect Encoding` | Shows the byte-detected encoding, VS Code's current encoding, XML declaration (if any), and the configured expected encoding for the active file. |
| `Encodex: Reopen with Encoding...` | Opens VS Code's built-in encoding picker to reopen the current file with a chosen encoding. |

## Status bar

A status bar item at the bottom right always shows the byte-level detected encoding of the active file. Click it to reopen the file with a different encoding.


