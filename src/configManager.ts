import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeEncoding } from './normalizer';

/**
 * Reads the `encodex.extensionMap` setting (resource-scoped) and returns the
 * explicitly configured encoding for the given URI.
 *
 * Returns a normalized VS Code encoding identifier, or `null` if the extension
 * is not mapped. When `null` is returned, `applier.ts` falls through to XML
 * declaration detection as the universal default.
 */
export function getExpectedEncoding(uri: vscode.Uri): string | null {
    const cfg = vscode.workspace.getConfiguration('encodex', uri);
    const extensionMap = cfg.get<Record<string, string>>('extensionMap', {});

    const ext = path.extname(uri.fsPath).toLowerCase();
    if (!ext) { return null; }

    const value = extensionMap[ext];
    if (!value || value.trim() === '') { return null; }

    return normalizeEncoding(value);
}
