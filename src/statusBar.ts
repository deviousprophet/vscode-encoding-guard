import * as vscode from 'vscode';
import * as fs from 'fs';
import { detectEncoding } from './detector';

/**
 * Manages the Encodex status bar item.
 *
 * Shows the byte-level detected encoding of the active file so users can
 * see what the file physically IS (independent of what VS Code decided to
 * use when opening it). Clicking opens the VS Code encoding picker.
 */
export class EncodexStatusBar {
    private readonly item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100,
        );
        this.item.command = 'encodex.reopenWithEncoding';
        this.item.tooltip = 'Encodex: click to reopen with a different encoding';
    }

    /** Update the status bar to reflect the given document (or hide it). */
    update(doc: vscode.TextDocument | undefined): void {
        if (!doc || doc.uri.scheme !== 'file' || doc.isUntitled) {
            this.item.hide();
            return;
        }

        let encoding: string;
        try {
            const buf = fs.readFileSync(doc.uri.fsPath);
            encoding = detectEncoding(buf);
        } catch {
            this.item.hide();
            return;
        }

        this.item.text = `$(file-code) ${encoding}`;
        this.item.show();
    }

    dispose(): void {
        this.item.dispose();
    }
}
