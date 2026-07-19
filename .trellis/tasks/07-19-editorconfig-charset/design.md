# Design: .editorconfig charset

## New file: `src/editorconfigReader.ts`

- `getEditorConfigCharset(filePath: string): string | null` — calls `editorconfig.parse(filePath)`, extracts `charset`, normalizes to VS Code encoding ID
- `editorConfigToVscodeEncoding(charset: string): string | null` — mapping table

### charset mapping

| .editorconfig value | VS Code ID |
|---|---|
| `utf-8` | `utf8` |
| `utf-8-bom` | `utf8bom` |
| `utf-16le` | `utf16le` |
| `utf-16be` | `utf16be` |
| `latin1` | `iso88591` |
| `utf-16` | `utf16le` (assume LE) |

## Modified: `src/applier.ts`

Insert in `resolveTargetEncoding()`:

```typescript
export function resolveTargetEncoding(uri: vscode.Uri, buf: Buffer): string | null {
    const configured = getExpectedEncoding(uri);
    if (configured !== null) {
        return configured;
    }
    // NEW: check .editorconfig charset
    const editorConfigEnc = getEditorConfigCharset(uri.fsPath);
    if (editorConfigEnc !== null) {
        return editorConfigEnc;
    }
    // ... rest unchanged
}
```

## Test

- `src/test/editorconfigReader.test.ts` — charset mapping, file-based lookup, malformed file handling
