# vscode-encodex

Encodex is a VS Code extension that automatically manages file encodings so files open and save correctly without manual intervention, especially in mixed-encoding projects.

## Features

- Rule-based mapping for file extensions / workspace patterns to encodings (e.g. `.log` → `windows-1252`).
- BOM detection and heuristic analysis of raw bytes on file open.
- Deterministic commands: `Detect Encoding`, `Apply Encoding`, `Fix Encoding`, `Prepare File`.
- Safe modes: `manual`, `safe`, and `auto` to control how aggressive automatic fixes are.
