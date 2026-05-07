import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectEncoding, detectXmlDeclaration } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';
import { handleDocumentOpen } from './applier';
import { EncodexStatusBar } from './statusBar';
import { pickEncoding } from './encodingList';

export function activate(context: vscode.ExtensionContext) {
    const statusBar = new EncodexStatusBar();
    context.subscriptions.push(statusBar);

    // Show encoding for the file that is already active on startup.
    statusBar.update(vscode.window.activeTextEditor?.document);

    // encodex.detectEncoding — reports detected and configured encoding for the active file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encodex.detectEncoding', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showInformationMessage('Encodex: No active text editor.');
                return;
            }
            const doc = editor.document;
            if (doc.uri.scheme !== 'file') {
                vscode.window.showInformationMessage('Encodex: Not a file on disk.');
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

    // encodex.reopenWithEncoding — delegates to VS Code's built-in picker.
    context.subscriptions.push(
        vscode.commands.registerCommand('encodex.reopenWithEncoding', async () => {
            await vscode.commands.executeCommand('workbench.action.editor.reopenWithEncoding');
        }),
    );

    // encodex.setExtensionEncoding — pick an encoding and store it in extensionMap for the file's extension.
    context.subscriptions.push(
        vscode.commands.registerCommand('encodex.setExtensionEncoding', async (uri?: vscode.Uri) => {
            const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
            if (!targetUri || targetUri.scheme !== 'file') { return; }

            const ext = path.extname(targetUri.fsPath).toLowerCase();
            if (!ext) {
                vscode.window.showWarningMessage('Encodex: This file has no extension.');
                return;
            }

            const cfg = vscode.workspace.getConfiguration('encodex', targetUri);
            const current = cfg.get<Record<string, string>>('extensionMap', {})[ext];
            const chosen = await pickEncoding(current ? normalizeEncoding(current) : undefined);
            if (!chosen) { return; }

            const map = { ...cfg.get<Record<string, string>>('extensionMap', {}), [ext]: chosen };
            await cfg.update('extensionMap', map, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Encodex: Set ${ext} → ${chosen}`);
        }),
    );

    // encodex.setFileEncoding — pick an encoding and store it in fileMap for this specific file.
    context.subscriptions.push(
        vscode.commands.registerCommand('encodex.setFileEncoding', async (uri?: vscode.Uri) => {
            const targetUri = uri ?? vscode.window.activeTextEditor?.document.uri;
            if (!targetUri || targetUri.scheme !== 'file') { return; }

            const workspaceFolder = vscode.workspace.getWorkspaceFolder(targetUri);
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('Encodex: File is not inside a workspace folder.');
                return;
            }

            const relPath = path.relative(workspaceFolder.uri.fsPath, targetUri.fsPath).replace(/\\/g, '/');
            const cfg = vscode.workspace.getConfiguration('encodex', targetUri);
            const current = cfg.get<Record<string, string>>('fileMap', {})[relPath];
            const chosen = await pickEncoding(current ? normalizeEncoding(current) : undefined);
            if (!chosen) { return; }

            const map = { ...cfg.get<Record<string, string>>('fileMap', {}), [relPath]: chosen };
            await cfg.update('fileMap', map, vscode.ConfigurationTarget.Workspace);
            vscode.window.showInformationMessage(`Encodex: Set ${relPath} → ${chosen}`);
        }),
    );

    // encodex.openSettings — open Settings UI filtered to encodex.
    context.subscriptions.push(
        vscode.commands.registerCommand('encodex.openSettings', async () => {
            await vscode.commands.executeCommand('workbench.action.openSettings', 'encodex');
        }),
    );

    // On file open: check encoding and notify if there is a mismatch.
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (doc) => {
            statusBar.update(doc);
            await handleDocumentOpen(doc);
        }),
    );

    // On active editor change: update status bar.
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            statusBar.update(editor?.document);
        }),
    );
}

export function deactivate() { }
