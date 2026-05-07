import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeEncoding } from './normalizer';

/**
 * Reads the `encodex.extensionMap` setting (resource-scoped) and returns the
 * configured expected encoding for the given URI.
 *
 * Returns:
 *  - `"auto"` if the extension is mapped to "auto" (detect from XML declaration)
 *  - A normalized VS Code encoding identifier if a specific encoding is configured
 *  - `null` if the extension is not present in the map (no intervention)
 */
export function getExpectedEncoding(uri: vscode.Uri): string | null {
    const cfg = vscode.workspace.getConfiguration('encodex', uri);
    const extensionMap = cfg.get<Record<string, string>>('extensionMap', {});

    const ext = path.extname(uri.fsPath).toLowerCase();
    if (!ext) { return null; }

    const value = extensionMap[ext];
    if (value === undefined || value === null || value === '') { return null; }

    if (value.trim().toLowerCase() === 'auto') { return 'auto'; }

    return normalizeEncoding(value);
}
