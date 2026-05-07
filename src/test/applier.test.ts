import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { resolveTargetEncoding } from '../applier';
import { normalizeEncoding } from '../normalizer';

// Sample directory is at <workspace-root>/sample/
// tsconfig rootDir=src, outDir=out  →  __dirname = <root>/out/test
const SAMPLE = path.resolve(__dirname, '..', '..', 'sample');
const ISO_XML = path.join(SAMPLE, 'iso88591-decl.xml');

// ---------------------------------------------------------------------------
// Test 1 — encoding detection from raw bytes
// ---------------------------------------------------------------------------
suite('Encoding detection from iso88591-decl.xml', () => {
    test('resolveTargetEncoding returns latin1 from XML declaration', () => {
        const buf = fs.readFileSync(ISO_XML);
        const uri = vscode.Uri.file(ISO_XML);
        const target = resolveTargetEncoding(uri, buf);
        assert.strictEqual(target, 'latin1',
            'Expected XML <?xml … encoding="ISO-8859-1"?> to resolve to latin1');
    });

    test('VS Code default encoding (utf8) mismatches detected target (latin1)', async () => {
        const uri = vscode.Uri.file(ISO_XML);
        const doc = await vscode.workspace.openTextDocument(uri);
        const buf = fs.readFileSync(ISO_XML);

        const current = normalizeEncoding(doc.encoding);
        const target = resolveTargetEncoding(uri, buf);

        assert.strictEqual(target, 'latin1',
            'XML declaration should resolve to latin1');
        assert.notStrictEqual(current, target,
            `Mismatch should be present: VS Code used '${current}', expected '${target}'`);
    });
});

// ---------------------------------------------------------------------------
// Test 2 — reopen the file with the correct encoding
// ---------------------------------------------------------------------------
suite('Reopen iso88591-decl.xml with correct encoding', () => {
    test('doc.encoding is latin1 after setting files.encoding and reverting', async () => {
        const uri = vscode.Uri.file(ISO_XML);

        // Open the file so an editor is visible (needed for revertFile).
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });

        // Verify the baseline mismatch before we fix it.
        const beforeEncoding = normalizeEncoding(doc.encoding);
        assert.notStrictEqual(beforeEncoding, 'latin1',
            `Baseline: file should NOT already be open as latin1 (got '${beforeEncoding}')`);

        // Apply the same mechanism used by applier.ts: set files.encoding then revert.
        // In the test runner there is no workspace folder, so fall back to Global scope.
        const configTarget = vscode.workspace.workspaceFolders?.length
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
        const filesConfig = vscode.workspace.getConfiguration('files');
        const prevEncoding = configTarget === vscode.ConfigurationTarget.Workspace
            ? filesConfig.inspect<string>('encoding')?.workspaceValue
            : filesConfig.inspect<string>('encoding')?.globalValue;
        await filesConfig.update('encoding', 'latin1', configTarget);
        try {
            await vscode.commands.executeCommand('workbench.action.files.revert');

            // After revert VS Code re-reads the file using the new encoding setting.
            // openTextDocument returns the (now re-decoded) cached document.
            const reopened = await vscode.workspace.openTextDocument(uri);
            const afterEncoding = normalizeEncoding(reopened.encoding);
            assert.strictEqual(afterEncoding, 'latin1',
                `Expected latin1 after reopen, got '${afterEncoding}'`);
        } finally {
            await filesConfig.update('encoding', prevEncoding, configTarget);
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });
});

// ---------------------------------------------------------------------------
// resolveTargetEncoding — edge cases across file types
// ---------------------------------------------------------------------------
suite('resolveTargetEncoding edge cases', () => {
    test('non-.xml .txt file with ISO-8859-1 declaration → latin1', () => {
        const file = path.join(SAMPLE, 'xml-decl.txt');
        const buf = fs.readFileSync(file);
        const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
        assert.strictEqual(target, 'latin1');
    });

    test('non-.xml .csv file with windows-1252 declaration → windows1252', () => {
        const file = path.join(SAMPLE, 'xml-decl.csv');
        const buf = fs.readFileSync(file);
        const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
        assert.strictEqual(target, 'windows1252');
    });

    test('XML with no encoding attribute and no config → null', () => {
        const file = path.join(SAMPLE, 'xml-decl-no-enc.xml');
        const buf = fs.readFileSync(file);
        const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
        assert.strictEqual(target, null);
    });

    test('plain Latin-1 file without XML declaration and no config → null', () => {
        const file = path.join(SAMPLE, 'latin1-no-decl.txt');
        const buf = fs.readFileSync(file);
        const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
        // No XML declaration, no extensionMap entry → no intervention
        assert.strictEqual(target, null);
    });

    test('extensionMap config wins over XML declaration', async () => {
        // Map .txt → utf8 in global settings; xml-decl.txt has ISO-8859-1 declaration.
        // Config must win.
        const cfg = vscode.workspace.getConfiguration('encodex');
        await cfg.update('extensionMap', { '.txt': 'utf8' }, vscode.ConfigurationTarget.Global);
        try {
            const file = path.join(SAMPLE, 'xml-decl.txt');
            const buf = fs.readFileSync(file);
            const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
            assert.strictEqual(target, 'utf8',
                'Config entry must take precedence over XML declaration');
        } finally {
            await cfg.update('extensionMap', undefined, vscode.ConfigurationTarget.Global);
        }
    });

    test('windows1252-decl.xml resolves to windows1252', () => {
        const file = path.join(SAMPLE, 'windows1252-decl.xml');
        const buf = fs.readFileSync(file);
        const target = resolveTargetEncoding(vscode.Uri.file(file), buf);
        assert.strictEqual(target, 'windows1252');
    });
});
