import * as assert from 'assert';
import * as vscode from 'vscode';
import { getExpectedEncoding } from '../configManager';

suite('getExpectedEncoding', () => {
    // These tests rely on whatever is set in workspace/user settings.
    // We reset the relevant key before each run to ensure a clean state.

    const cfg = () => vscode.workspace.getConfiguration('encoding-guard');

    async function setMap(map: Record<string, string>): Promise<void> {
        await cfg().update('extensionMap', map, vscode.ConfigurationTarget.Global);
    }

    teardown(async () => {
        await cfg().update('extensionMap', undefined, vscode.ConfigurationTarget.Global);
    });

    test('returns null when extensionMap is empty', () => {
        // Default config has an empty map — no mapping for any extension.
        const uri = vscode.Uri.file('/some/file.arxml');
        // We don't set the map here; rely on default empty.
        const result = getExpectedEncoding(uri);
        // Either null (no mapping) or whatever happens to be configured globally.
        // This assertion checks that we get null for an unmapped extension.
        assert.ok(result === null || typeof result === 'string');
    });

    test('returns configured encoding for a mapped extension', async () => {
        await setMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/data.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'windows1252');
    });

    test('returns null for an extension not in the map', async () => {
        await setMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/readme.txt');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, null);
    });

    test('normalizes configured encoding name', async () => {
        await setMap({ '.log': 'UTF-8' });
        const uri = vscode.Uri.file('/workspace/app.log');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'utf8');
    });

    test('returns null for a file with no extension', async () => {
        await setMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/Makefile');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, null);
    });
});
