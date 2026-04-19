Encodex is a VS Code extension that automatically manages file encodings so files open and save correctly without manual intervention, especially in mixed-encoding projects.

It works by combining rule-based mapping, content detection, and safe workflow hooks integrated into the editor lifecycle.

Core functionality:

Maps file extensions or workspace patterns to specific encodings (e.g. .log → windows-1252, .csv → latin1).
Detects encoding on file open using BOM detection and heuristic analysis of raw file bytes.
Compares detected encoding with expected encoding from rules and decides whether action is needed.
Automatically applies the correct encoding by reopening the file in VS Code with the appropriate encoding.
Provides a “fix encoding” action that performs detect → compare → apply in one step.
Exposes deterministic commands that can be called manually or by AI agents (detect, apply, fix, prepare file).

Workflow integration:

On file open: detects encoding and prepares the file before editing begins.
During editing: passively monitors without interrupting the user or AI tools.
Before save: optionally validates encoding consistency and fixes mismatches depending on mode.
Supports configurable modes:
manual (only detect, no auto changes)
safe (fix only high-confidence mismatches)
auto (fully automatic correction)

AI-friendly design:

Designed to work seamlessly with AI coding agents like Copilot by ensuring files are already correctly decoded before editing starts.
Avoids disruptive actions during active edits (no forced reopening while a file is being modified).
Provides simple, deterministic commands (detect, fix, apply, prepare) that external tools or agents can safely call.

Goal:

Provide a reliable encoding layer on top of VS Code so developers never need to think about character encoding issues again, while remaining predictable and safe for both human editing and AI-assisted workflows.