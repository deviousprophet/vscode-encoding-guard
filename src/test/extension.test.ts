import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension activation', () => {
    test('extension is present and activates cleanly', async () => {
        const ext = vscode.extensions.getExtension('deviousprophet.vscode-encodex');
        assert.ok(ext, 'Extension not found');
        await ext!.activate();
        assert.ok(ext!.isActive, 'Extension did not activate');
    });

    test('encodex.detectEncoding command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encodex.detectEncoding'), 'encodex.detectEncoding not registered');
    });

    test('encodex.reopenWithEncoding command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encodex.reopenWithEncoding'), 'encodex.reopenWithEncoding not registered');
    });
});

