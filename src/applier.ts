import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectXmlDeclaration, startsWithXmlPreamble, XML_DECLARATION_SCAN_BYTES } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';

const INITIAL_SCAN_BYTES = 4 * 1024;
const DEFAULT_ENCODINGS = new Set(['utf8', 'ascii']);

function isLowConfidence(encoding: string | undefined, confidence: number): boolean {
    return !encoding || confidence < 0.5;
}

function isDefaultEncoding(normalized: string): boolean {
    return DEFAULT_ENCODINGS.has(normalized);
}

/**
 * Heuristic encoding detection via jschardet.
 * Returns a normalized VS Code encoding identifier, or null when detection
 * confidence is too low or the result is already UTF-8/ASCII (no intervention needed).
 */
export function detectHeuristicEncoding(buf: Buffer): string | null {
    if (buf.length === 0) { return null; }
    // Lazy require: jschardet is opt-in, only loaded when heuristic fallback runs.
    const jschardet = require('jschardet') as typeof import('jschardet');
    const { encoding, confidence } = jschardet.detect(buf);
    if (isLowConfidence(encoding, confidence)) { return null; }
    const normalized = normalizeEncoding(encoding);
    return isDefaultEncoding(normalized) ? null : normalized;
}

/**
 * Determines what encoding a file *should* be opened with, based on:
 *  1. Explicit config via `encoding-guard.patternMap` (glob/exact/extension patterns)
 *  2. Fallback for any file: check for an XML/ARXML encoding declaration
 *     (<?xml version="1.0" encoding="..."?>) in the file header window.
 *  3. Optional heuristic fallback via jschardet (opt-in via enableHeuristicFallback).
 *
 * Returns a normalized VS Code encoding identifier, or null when no
 * intervention is needed (no config match and no XML declaration found).
 */
export function resolveTargetEncoding(uri: vscode.Uri, buf: Buffer): string | null {
    const configured = getExpectedEncoding(uri);
    if (configured !== null) {
        return configured; // explicit config always wins
    }
    // Universal fallback: detect encoding from XML declaration if present.
    const xmlDecl = detectXmlDeclaration(buf);
    if (xmlDecl !== null) { return xmlDecl; }

    // Opt-in heuristic fallback via jschardet.
    const cfg = vscode.workspace.getConfiguration('encoding-guard', uri);
    if (cfg.get<boolean>('enableHeuristicFallback', false)) {
        return detectHeuristicEncoding(buf);
    }

    return null;
}

/**
 * Temporarily sets `files.encoding` to `target`, reverts the document so
 * VS Code re-reads it with that encoding, then restores the previous value.
 */
async function reopenWithEncoding(uri: vscode.Uri, target: string): Promise<void> {
    const filesConfig = vscode.workspace.getConfiguration('files');
    const prev = filesConfig.inspect<string>('encoding')?.globalValue;

    await filesConfig.update('encoding', target, vscode.ConfigurationTarget.Global);
    try {
        await vscode.window.showTextDocument(uri, { preview: false });
        await vscode.commands.executeCommand('workbench.action.files.revert');
        console.log(`[Encoding Guard] ✓ reopened as '${target}'`);
    } finally {
        await filesConfig.update('encoding', prev, vscode.ConfigurationTarget.Global);
    }
}

function readFilePrefix(fd: number, bytes: number): Buffer {
    const buf = Buffer.alloc(bytes);
    const bytesRead = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
}

function needsWidenedScan(buf: Buffer): boolean {
    return (
        buf.length === INITIAL_SCAN_BYTES &&
        detectXmlDeclaration(buf) === null &&
        startsWithXmlPreamble(buf)
    );
}

function readDetectionBuffer(filePath: string): Buffer {
    const fd = fs.openSync(filePath, 'r');
    try {
        const initial = readFilePrefix(fd, INITIAL_SCAN_BYTES);
        return needsWidenedScan(initial)
            ? readFilePrefix(fd, XML_DECLARATION_SCAN_BYTES)
            : initial;
    } finally {
        fs.closeSync(fd);
    }
}

function getRawDocumentEncoding(doc: vscode.TextDocument): string | undefined {
    return (doc as any).encoding;
}

function getResolvedTarget(doc: vscode.TextDocument, buf: Buffer): string | null {
    const target = resolveTargetEncoding(doc.uri, buf);
    console.log(`[Encoding Guard] target encoding : ${target ?? '(none — no declaration or config)'}`);
    return target;
}

function getCurrentEncoding(doc: vscode.TextDocument): string | null {
    const rawEncoding = getRawDocumentEncoding(doc);
    if (rawEncoding === undefined) {
        console.warn('[Encoding Guard] doc.encoding unavailable — skipping');
        return null;
    }

    const current = normalizeEncoding(rawEncoding);
    console.log(`[Encoding Guard] current encoding: ${current} (raw: ${rawEncoding})`);
    return current;
}

function getReopenTarget(doc: vscode.TextDocument, buf: Buffer): string | null {
    const target = getResolvedTarget(doc, buf);
    if (target === null) { return null; }
    const current = getCurrentEncoding(doc);
    return current !== null && current !== target ? target : null;
}

async function applyResolvedEncoding(doc: vscode.TextDocument, buf: Buffer): Promise<void> {
    const target = getReopenTarget(doc, buf);
    if (target === null) { return; }

    console.log(`[Encoding Guard] ⚠ mismatch — reopening as '${target}'`);
    await reopenWithEncoding(doc.uri, target);
}

function readDocumentBuffer(doc: vscode.TextDocument): Buffer | null {
    try {
        return readDetectionBuffer(doc.uri.fsPath);
    } catch (err) {
        console.error(`[Encoding Guard] could not read file: ${err}`);
        return null;
    }
}

async function safelyApplyResolvedEncoding(doc: vscode.TextDocument, buf: Buffer): Promise<void> {
    try {
        await applyResolvedEncoding(doc, buf);
    } catch (err) {
        console.error(`[Encoding Guard] unexpected error: ${err}`);
    }
}

/**
 * Called when a document is opened. Reads the raw bytes, resolves the target
 * encoding from config/declaration, and silently reopens the file with the
 * correct encoding when there is a mismatch.
 */
export async function handleDocumentOpen(doc: vscode.TextDocument): Promise<void> {
    if (doc.uri.scheme !== 'file' || doc.isUntitled) { return; }

    console.log(`[Encoding Guard] open: ${path.basename(doc.uri.fsPath)}`);

    const buf = readDocumentBuffer(doc);
    if (buf !== null) {
        await safelyApplyResolvedEncoding(doc, buf);
    }
}
