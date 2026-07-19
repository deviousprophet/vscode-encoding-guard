import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectEncoding, detectXmlDeclaration, detectBom } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';
import { handleDocumentOpen, reopenWithEncoding, getEncodingSource, resolveTargetEncoding } from './applier';
import { pickEncoding } from './encodingList';
import { convertBuffer } from './converter';

type EncodingDetection = {
    detected: string;
    xmlDecl: string | null;
    source: string | null;
};

function detectFileEncoding(uri: vscode.Uri): EncodingDetection {
    try {
        const buf = fs.readFileSync(uri.fsPath);
        return {
            detected: detectEncoding(buf),
            xmlDecl: detectXmlDeclaration(buf),
            source: getEncodingSource(uri, buf) ?? resolveTargetEncoding(uri, buf) ?? 'UTF-8 default',
        };
    } catch {
        return { detected: 'unknown', xmlDecl: null, source: null };
    }
}

function buildEncodingMessage(doc: vscode.TextDocument, result: EncodingDetection): string {
    const configured = getExpectedEncoding(doc.uri);
    const current = normalizeEncoding(doc.encoding);
    const lines: string[] = [
        `File: ${path.basename(doc.uri.fsPath)}`,
        `Detected (bytes): ${result.detected}`,
        `VS Code current:  ${current}`,
    ];

    if (result.xmlDecl) {
        lines.push(`XML declaration:  ${result.xmlDecl}`);
    }
    if (configured) {
        lines.push(`Config expects:   ${configured}`);
    }
    if (result.source) {
        lines.push(`Encoding source:  ${result.source}`);
    }

    return lines.join('\n');
}

async function showDetectedEncoding(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage('Encoding Guard: No active text editor.');
        return;
    }

    const doc = editor.document;
    if (doc.uri.scheme !== 'file') {
        vscode.window.showInformationMessage('Encoding Guard: Not a file on disk.');
        return;
    }

    const message = buildEncodingMessage(doc, detectFileEncoding(doc.uri));
    vscode.window.showInformationMessage(message, { modal: true });
}

async function reopenWithVsCodePicker(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.editor.reopenWithEncoding');
}

function getCommandTargetUri(uri?: vscode.Uri): vscode.Uri | undefined {
    const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
    return targetUri?.scheme === 'file' ? targetUri : undefined;
}

async function chooseEncodingForPattern(
    targetUri: vscode.Uri,
    key: string,
): Promise<string | undefined> {
    const cfg = vscode.workspace.getConfiguration('encoding-guard', targetUri);
    const patternMap = cfg.get<Record<string, string>>('patternMap', {});
    const current = patternMap[key];
    return pickEncoding(current ? normalizeEncoding(current) : undefined);
}

async function updatePatternMap(targetUri: vscode.Uri, key: string, encoding: string): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('encoding-guard', targetUri);
    const patternMap = cfg.get<Record<string, string>>('patternMap', {});
    await cfg.update('patternMap', { ...patternMap, [key]: encoding }, vscode.ConfigurationTarget.Workspace);
}

async function setExtensionEncoding(uri?: vscode.Uri): Promise<void> {
    const targetUri = getCommandTargetUri(uri);
    if (!targetUri) { return; }

    const ext = path.extname(targetUri.fsPath).toLowerCase();
    if (!ext) {
        vscode.window.showWarningMessage('Encoding Guard: This file has no extension.');
        return;
    }

    const chosen = await chooseEncodingForPattern(targetUri, ext);
    if (!chosen) { return; }

    await updatePatternMap(targetUri, ext, chosen);
    vscode.window.showInformationMessage(`Encoding Guard: Set ${ext} → ${chosen}`);
}

function getWorkspaceRelativePath(targetUri: vscode.Uri): string | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
    return workspaceFolder
        ? path.relative(workspaceFolder.uri.fsPath, targetUri.fsPath).replace(/\\/g, '/')
        : undefined;
}

async function setFileEncoding(uri?: vscode.Uri): Promise<void> {
    const targetUri = getCommandTargetUri(uri);
    if (!targetUri) { return; }

    const relPath = getWorkspaceRelativePath(targetUri);
    if (!relPath) {
        vscode.window.showWarningMessage('Encoding Guard: File is not inside a workspace folder.');
        return;
    }

    const chosen = await chooseEncodingForPattern(targetUri, relPath);
    if (!chosen) { return; }

    await updatePatternMap(targetUri, relPath, chosen);
    vscode.window.showInformationMessage(`Encoding Guard: Set ${relPath} → ${chosen}`);
}

function resolveCurrentEncoding(uri: vscode.Uri, rawBytes: Buffer): string {
    const configured = getExpectedEncoding(uri);
    if (configured !== null) { return configured; }
    const xmlDecl = detectXmlDeclaration(rawBytes);
    if (xmlDecl !== null) { return xmlDecl; }
    return normalizeEncoding(detectBom(rawBytes) ?? 'utf8');
}

function readFileBytes(filePath: string): Buffer | undefined {
    try { return fs.readFileSync(filePath); }
    catch { vscode.window.showErrorMessage('Encoding Guard: Could not read file.'); }
}

async function writeWithEncoding(uri: vscode.Uri, buf: Buffer, fromEnc: string, toEnc: string): Promise<void> {
    const converted = convertBuffer(buf, fromEnc, toEnc);
    fs.writeFileSync(uri.fsPath, converted);
    await reopenWithEncoding(uri, toEnc);
}

async function convertFileEncoding(uri?: vscode.Uri): Promise<void> {
    const targetUri = getCommandTargetUri(uri);
    if (!targetUri) {
        vscode.window.showWarningMessage('Encoding Guard: No active text editor.');
        return;
    }

    const rawBytes = readFileBytes(targetUri.fsPath);
    if (!rawBytes) { return; }

    const currentEnc = resolveCurrentEncoding(targetUri, rawBytes);
    const chosen = await pickEncoding(currentEnc);
    if (!chosen) { return; }

    const targetEnc = normalizeEncoding(chosen);
    await writeWithEncoding(targetUri, rawBytes, currentEnc, targetEnc);
    vscode.window.showInformationMessage(`Encoding Guard: Converted to ${targetEnc}`);
}

async function openEncodingGuardSettings(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.openSettings', 'encoding-guard');
}

export function activate(context: vscode.ExtensionContext) {

    // encoding-guard.detectEncoding — reports detected and configured encoding for the active file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.detectEncoding', showDetectedEncoding),
    );

    // encoding-guard.reopenWithEncoding — delegates to VS Code's built-in picker.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.reopenWithEncoding', reopenWithVsCodePicker),
    );

    // encoding-guard.setExtensionEncoding
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.setExtensionEncoding', setExtensionEncoding),
    );

    // encoding-guard.setFileEncoding — pick an encoding and store it in patternMap for this specific file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.setFileEncoding', setFileEncoding),
    );

    // encoding-guard.convertFileEncoding
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.convertFileEncoding', convertFileEncoding),
    );

    // encoding-guard.openSettings — open Settings UI filtered to encoding-guard.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.openSettings', openEncodingGuardSettings),
    );

    // On file open: check encoding and reopen with the correct one if needed.
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(handleDocumentOpen),
    );
}

export function deactivate() { }
