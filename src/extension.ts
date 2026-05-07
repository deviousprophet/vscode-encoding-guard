import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectEncoding, detectXmlDeclaration } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';
import { handleDocumentOpen } from './applier';
import { pickEncoding } from './encodingList';

export function activate(context: vscode.ExtensionContext) {

    // encoding-guard.detectEncoding — reports detected and configured encoding for the active file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.detectEncoding', async () => {
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

            let detected = 'unknown';
            let xmlDecl: string | null = null;
            try {
                const buf = fs.readFileSync(doc.uri.fsPath);
                detected = detectEncoding(buf);
                xmlDecl = detectXmlDeclaration(buf);
            } catch {
                // unreadable — fall through with defaults
            }

            const configured = getExpectedEncoding(doc.uri);
            const current = normalizeEncoding(doc.encoding);

            const lines: string[] = [
                `File: ${path.basename(doc.uri.fsPath)}`,
                `Detected (bytes): ${detected}`,
                `VS Code current:  ${current}`,
            ];
            if (xmlDecl) {
                lines.push(`XML declaration:  ${xmlDecl}`);
            }
            if (configured) {
                lines.push(`Config expects:   ${configured}`);
            }

            vscode.window.showInformationMessage(lines.join('\n'), { modal: true });
        }),
    );

    // encoding-guard.reopenWithEncoding — delegates to VS Code's built-in picker.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.reopenWithEncoding', async () => {
            await vscode.commands.executeCommand('workbench.action.editor.reopenWithEncoding');
        }),
    );

    // encoding-guard.setExtensionEncoding
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.setExtensionEncoding', async (uri?: vscode.Uri) => {
            const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
            if (!targetUri || targetUri.scheme !== 'file') { return; }

            const ext = path.extname(targetUri.fsPath).toLowerCase();
            if (!ext) {
                vscode.window.showWarningMessage('Encoding Guard: This file has no extension.');
                return;
            }

            const cfg = vscode.workspace.getConfiguration('encoding-guard', targetUri);
            const current = cfg.get<Record<string, string>>('extensionMap', {})[ext];
            const chosen = await pickEncoding(current ? normalizeEncoding(current) : undefined);
            if (!chosen) { return; }

            const map = { ...cfg.get<Record<string, string>>('extensionMap', {}), [ext]: chosen };
            await cfg.update('extensionMap', map, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Encoding Guard: Set ${ext} → ${chosen}`);
        }),
    );

    // encoding-guard.setFileEncoding — pick an encoding and store it in fileMap for this specific file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.setFileEncoding', async (uri?: vscode.Uri) => {
            const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
            if (!targetUri || targetUri.scheme !== 'file') { return; }

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('Encoding Guard: File is not inside a workspace folder.');
                return;
            }

            const relPath = path.relative(workspaceFolder.uri.fsPath, targetUri.fsPath).replace(/\\/g, '/');
            const cfg = vscode.workspace.getConfiguration('encoding-guard', targetUri);
            const current = cfg.get<Record<string, string>>('fileMap', {})[relPath];
            const chosen = await pickEncoding(current ? normalizeEncoding(current) : undefined);
            if (!chosen) { return; }

            const map = { ...cfg.get<Record<string, string>>('fileMap', {}), [relPath]: chosen };
            await cfg.update('fileMap', map, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Encoding Guard: Set ${relPath} → ${chosen}`);
        }),
    );

    // encoding-guard.openSettings — open Settings UI filtered to encoding-guard.
    context.subscriptions.push(
        vscode.commands.registerCommand('encoding-guard.openSettings', async () => {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'encoding-guard');
        }),
    );

    // On file open: check encoding and reopen with the correct one if needed.
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (doc) => {
            await handleDocumentOpen(doc);
        }),
    );
}

export function deactivate() { }
