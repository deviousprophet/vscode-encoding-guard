import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension activation', () => {
    test('extension is present and activates cleanly', async () => {
        const ext = vscode.extensions.getExtension('deviousprophet.vscode-encoding-guard');
        assert.ok(ext, 'Extension not found');
        await ext!.activate();
        assert.ok(ext!.isActive, 'Extension did not activate');
    });

    test('encoding-guard.detectEncoding command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encoding-guard.detectEncoding'), 'encoding-guard.detectEncoding not registered');
    });

    test('encoding-guard.setExtensionEncoding command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encoding-guard.setExtensionEncoding'), 'encoding-guard.setExtensionEncoding not registered');
    });

    test('encoding-guard.setFileEncoding command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encoding-guard.setFileEncoding'), 'encoding-guard.setFileEncoding not registered');
    });

    test('encoding-guard.openSettings command is registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('encoding-guard.openSettings'), 'encoding-guard.openSettings not registered');
    });
});

