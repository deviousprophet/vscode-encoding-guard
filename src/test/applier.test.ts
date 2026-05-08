import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { resolveTargetEncoding } from '../applier';

// Sample directory is at <workspace-root>/sample/
// tsconfig rootDir=src, outDir=out  →  __dirname = <root>/out/test
const SAMPLE = path.resolve(__dirname, '..', '..', 'sample');
const ISO_XML = path.join(SAMPLE, 'iso88591-decl.xml');

// ---------------------------------------------------------------------------
// resolveTargetEncoding — core and edge cases
// ---------------------------------------------------------------------------
suite('resolveTargetEncoding', () => {
    test('returns iso88591 from ISO-8859-1 XML declaration', () => {
        const buf = fs.readFileSync(ISO_XML);
        const uri = vscode.Uri.file(ISO_XML);
        assert.strictEqual(resolveTargetEncoding(uri, buf), 'iso88591');
    });

    test('non-.xml .txt file with ISO-8859-1 declaration → iso88591', () => {
        const file = path.join(SAMPLE, 'xml-decl.txt');
        const buf = fs.readFileSync(file);
        assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), 'iso88591');
    });

    test('non-.xml .csv file with windows-1252 declaration → windows1252', () => {
        const file = path.join(SAMPLE, 'xml-decl.csv');
        const buf = fs.readFileSync(file);
        assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), 'windows1252');
    });

    test('windows1252-decl.xml → windows1252', () => {
        const file = path.join(SAMPLE, 'windows1252-decl.xml');
        const buf = fs.readFileSync(file);
        assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), 'windows1252');
    });

    test('XML with no encoding attribute and no config → null', () => {
        const file = path.join(SAMPLE, 'xml-decl-no-enc.xml');
        const buf = fs.readFileSync(file);
        assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), null);
    });

    test('plain Latin-1 file without XML declaration and no config → null', () => {
        const file = path.join(SAMPLE, 'latin1-no-decl.txt');
        const buf = fs.readFileSync(file);
        assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), null);
    });

    test('patternMap config wins over XML declaration', async () => {
        const cfg = vscode.workspace.getConfiguration('encoding-guard');
        await cfg.update('patternMap', { '.txt': 'utf8' }, vscode.ConfigurationTarget.Global);
        try {
            const file = path.join(SAMPLE, 'xml-decl.txt');
            const buf = fs.readFileSync(file);
            assert.strictEqual(resolveTargetEncoding(vscode.Uri.file(file), buf), 'utf8',
                'Config entry must take precedence over XML declaration');
        } finally {
            await cfg.update('patternMap', undefined, vscode.ConfigurationTarget.Global);
        }
    });
});
