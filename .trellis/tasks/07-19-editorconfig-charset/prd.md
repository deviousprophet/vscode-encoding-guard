# Import/respect .editorconfig "charset" as an implicit encoding source

## Goal

Read `.editorconfig` charset rules as an additional encoding source, reducing config duplication for teams that already maintain `.editorconfig`.

## Requirements

1. Add `editorconfig` npm package as a dependency
2. When resolving encoding for a file, after checking patternMap but before XML declaration, check the resolved `.editorconfig` charset for that file
3. Priority: `patternMap` > `.editorconfig charset` > XML declaration > heuristic fallback
4. Map `.editorconfig` charset values to VS Code encoding identifiers (e.g., `latin1` → `iso88591`, `utf-8` → `utf8`, `utf-8-bom` → `utf8bom`, `utf-16le` → `utf16le`, `utf-16be` → `utf16be`)
5. If `.editorconfig` is absent or has no charset rule, fall through to next check (no behavior change)
6. No new user-facing settings — works automatically when `.editorconfig` exists
7. Must not throw or crash on malformed `.editorconfig` files

## Acceptance Criteria

- [ ] File with `.editorconfig` `charset=latin1` and no patternMap entry opens as `iso88591`
- [ ] File with `.editorconfig` `charset=utf-8` opens as `utf8`
- [ ] `.editorconfig` charset is overridden by `encoding-guard.patternMap`
- [ ] `.editorconfig` charset does not override XML declaration (lower priority)
- [ ] No `.editorconfig` file → no behavior change
- [ ] Malformed `.editorconfig` → silently ignored
- [ ] Existing behavior for patternMap, XML declaration, and heuristic unchanged
