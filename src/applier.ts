import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectXmlDeclaration } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';

/**
 * Determines what encoding a file *should* be opened with, based on:
 *  1. Explicit `encodex.extensionMap` entry for the file's extension (wins).
 *  2. Fallback for any file: check for an XML/ARXML encoding declaration
 *     (<?xml version="1.0" encoding="..."?>) in the first 1 KB of the file.
 *
 * Returns a normalized VS Code encoding identifier, or null when no
 * intervention is needed (no config entry and no XML declaration found).
 */
export function resolveTargetEncoding(uri: vscode.Uri, buf: Buffer): string | null {
    const configured = getExpectedEncoding(uri);
    if (configured !== null) {
        return configured; // explicit config always wins
    }
    // Universal fallback: detect encoding from XML declaration if present.
    return detectXmlDeclaration(buf);
}

/**
 * Called when a document is opened. Reads the raw bytes, resolves the target
 * encoding from config/declaration, and warns the user when VS Code opened the
 * file with a different encoding than expected.
 */
export async function handleDocumentOpen(doc: vscode.TextDocument): Promise<void> {
    if (doc.uri.scheme !== 'file' || doc.isUntitled) { return; }

    const fileName = path.basename(doc.uri.fsPath);
    console.log(`[Encodex] open: ${fileName}`);

    try {
        let buf: Buffer;
        try {
            buf = fs.readFileSync(doc.uri.fsPath);
        } catch (err) {
            console.error(`[Encodex] could not read file: ${err}`);
            return;
        }

        const target = resolveTargetEncoding(doc.uri, buf);
        console.log(`[Encodex] target encoding : ${target ?? '(none — no declaration or config)'}`);
        if (target === null) { return; }

        // doc.encoding is the VS Code encoding identifier used to decode this file.
        const rawEncoding: string | undefined = (doc as any).encoding;
        if (rawEncoding === undefined) {
            console.warn('[Encodex] doc.encoding is undefined — VS Code API not available, skipping');
            return;
        }
        const current = normalizeEncoding(rawEncoding);
        console.log(`[Encodex] current encoding: ${current} (raw: ${rawEncoding})`);

        if (current === target) {
            console.log('[Encodex] ✓ already correct, no action needed');
            return;
        }

        console.log(`[Encodex] ⚠ mismatch — prompting user to reopen as '${target}'`);

        const msg = `Encodex: '${fileName}' should be opened as '${target}'. Currently using '${current}'.`;
        const choice = await vscode.window.showWarningMessage(msg, `Reopen as ${target}`, 'Ignore');
        console.log(`[Encodex] user chose: ${choice ?? '(dismissed)'}`);

        if (choice === `Reopen as ${target}`) {
            const configTarget = vscode.workspace.workspaceFolders?.length
                ? vscode.ConfigurationTarget.Workspace
                : vscode.ConfigurationTarget.Global;
            const filesConfig = vscode.workspace.getConfiguration('files');
            const prev = configTarget === vscode.ConfigurationTarget.Workspace
                ? filesConfig.inspect<string>('encoding')?.workspaceValue
                : filesConfig.inspect<string>('encoding')?.globalValue;
            await filesConfig.update('encoding', target, configTarget);
            try {
                await vscode.window.showTextDocument(doc.uri, { preview: false });
                await vscode.commands.executeCommand('workbench.action.files.revert');
                console.log(`[Encodex] ✓ reopened as '${target}'`);
            } finally {
                await filesConfig.update('encoding', prev, configTarget);
            }
        }
    } catch (err) {
        console.error(`[Encodex] unexpected error: ${err}`);
    }
}
