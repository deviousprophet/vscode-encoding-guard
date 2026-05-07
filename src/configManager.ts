import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeEncoding } from './normalizer';

/**
 * Reads Encodex configuration for the given URI and returns the explicitly
 * configured encoding, applying this priority order:
 *
 *  1. `encodex.fileMap`      — per-file path override (wins over everything)
 *  2. `encodex.extensionMap` — per-extension override
 *
 * Returns a normalized VS Code encoding identifier, or `null` if neither map
 * has an entry. When `null` is returned, `applier.ts` falls through to XML
 * declaration detection.
 */
export function getExpectedEncoding(uri: vscode.Uri): string | null {
    const cfg = vscode.workspace.getConfiguration('encodex', uri);

    // 1. Per-file override
    const fileMap = cfg.get<Record<string, string>>('fileMap', {});
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (workspaceFolder) {
        const relPath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath).replace(/\\/g, '/');
        const fileValue = fileMap[relPath];
        if (fileValue && fileValue.trim() !== '') {
            return normalizeEncoding(fileValue);
        }
    }

    // 2. Per-extension override
    const extensionMap = cfg.get<Record<string, string>>('extensionMap', {});
    const ext = path.extname(uri.fsPath).toLowerCase();
    if (!ext) { return null; }

    const extValue = extensionMap[ext];
    if (!extValue || extValue.trim() === '') { return null; }

    return normalizeEncoding(extValue);
}
