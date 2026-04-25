// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { detectEncoding } from './encoding';
import { matchRuleForPath } from './rules';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-encodex" is now active!');

	// Encodex activation complete

	const detectAndSuggest = vscode.commands.registerCommand('encodex.detectAndSuggest', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) { return vscode.window.showInformationMessage('No active editor'); }
		await handleDocument(editor.document, { interactive: true });
	});

	const openEncodingMenu = vscode.commands.registerCommand('encodex.openEncodingMenu', async () => {
		// show the built-in change encoding UI
		await vscode.commands.executeCommand('workbench.action.editor.changeEncoding');
	});

	context.subscriptions.push(detectAndSuggest, openEncodingMenu);

	// Listen for documents being opened so we can apply rules
	const openListener = vscode.workspace.onDidOpenTextDocument(async (doc) => {
		// only handle file scheme documents
		if (doc.uri.scheme !== 'file' || doc.isUntitled) { return; }
		const cfg = vscode.workspace.getConfiguration('encodex');
		const mode = cfg.get<string>('mode', 'manual');
		const autoApply = cfg.get<boolean>('autoApply', false);
		await handleDocument(doc, { interactive: mode !== 'auto', autoApply: autoApply, mode });
	});

	context.subscriptions.push(openListener);
}

async function handleDocument(doc: vscode.TextDocument, opts: { interactive?: boolean; autoApply?: boolean; mode?: string } = {}) {
	try {
		const rule = matchRuleForPath(doc.uri.fsPath);
		if (!rule) { return; } // no rule configured

		const buf = fs.readFileSync(doc.uri.fsPath);
		const detected = detectEncoding(buf);
		const expected = rule.encoding;
		if (!expected) { return; }
		if (detected === expected) { return; }

		const message = `Encodex: detected '${detected}' but rule expects '${expected}' for this file.`;
		const cfgMode = opts.mode || vscode.workspace.getConfiguration('encodex').get<string>('mode', 'manual');

		if (cfgMode === 'auto' && opts.autoApply) {
			// auto mode requested: open the change encoding UI so user can pick the expected encoding
			await vscode.commands.executeCommand('workbench.action.editor.changeEncoding');
			return;
		}

		if (opts.interactive) {
			const choice = await vscode.window.showWarningMessage(message, 'Change Encoding', 'Ignore');
			if (choice === 'Change Encoding') {
				await vscode.commands.executeCommand('workbench.action.editor.changeEncoding');
			}
		} else {
			// non-interactive: log a message to the user (no popup)
			console.log(message);
		}
	} catch (e) {
		console.error('encodex: error handling document', e);
	}
}

export function deactivate() { }
