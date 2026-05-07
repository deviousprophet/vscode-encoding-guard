import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { detectEncoding, detectXmlDeclaration } from './detector';
import { getExpectedEncoding } from './configManager';
import { normalizeEncoding } from './normalizer';
import { handleDocumentOpen } from './applier';
import { EncodexStatusBar } from './statusBar';

export function activate(context: vscode.ExtensionContext) {
    const out = vscode.window.createOutputChannel('Encodex');
    context.subscriptions.push(out);

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

    // On file open: check encoding and notify if there is a mismatch.
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (doc) => {
            statusBar.update(doc);
            await handleDocumentOpen(doc, out);
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
