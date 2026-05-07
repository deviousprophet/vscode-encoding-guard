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

    let buf: Buffer;
    try {
        buf = fs.readFileSync(doc.uri.fsPath);
    } catch {
        return; // file unreadable at the OS level — nothing we can do
    }

    const target = resolveTargetEncoding(doc.uri, buf);
    if (target === null) { return; }

    // doc.encoding is the VS Code encoding identifier used to decode this file.
    const current = normalizeEncoding(doc.encoding);
    if (current === target) { return; }

    const fileName = path.basename(doc.uri.fsPath);
    const msg = `Encodex: '${fileName}' should be opened as '${target}'. Currently using '${current}'.`;

    const choice = await vscode.window.showWarningMessage(msg, 'Reopen', 'Ignore');
    if (choice === 'Reopen') {
        await vscode.commands.executeCommand('workbench.action.editor.reopenWithEncoding');
    }
}
