import * as assert from 'assert';
import * as vscode from 'vscode';
import { resolveTargetEncoding } from '../applier';

// Dummy URI that won't match any patternMap entry — used for pure XML-declaration tests.
const DUMMY_URI = vscode.Uri.file('/dev/null/test.xml');

// ---------------------------------------------------------------------------
// resolveTargetEncoding — core and edge cases
// ---------------------------------------------------------------------------
suite('resolveTargetEncoding', () => {
    test('returns iso88591 from ISO-8859-1 XML declaration', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="ISO-8859-1"?>\n<root/>', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'iso88591');
    });

    test('non-.xml .txt content with ISO-8859-1 declaration returns iso88591', () => {
        const buf = Buffer.from('<?xml encoding="ISO-8859-1"?>\nCaf\u00E9 R\u00E9sum\u00E9', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'iso88591');
    });

    test('non-.xml .csv content with windows-1252 declaration returns windows1252', () => {
        const buf = Buffer.from('<?xml encoding="windows-1252"?>\nPrice,?100', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'windows1252');
    });

    test('windows1252 declaration returns windows1252', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="windows-1252"?>\n<root/>', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'windows1252');
    });

    test('XML with no encoding attribute and no config returns null', () => {
        const buf = Buffer.from('<?xml version="1.0"?>\n<root><element/></root>', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), null);
    });

    test('plain Latin-1 file without XML declaration and no config returns null', () => {
        const buf = Buffer.from('Caf\u00E9 R\u00E9sum\u00E9 na\u00EFve fa\u00E7ade', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), null);
    });

    test('patternMap config wins over XML declaration', async () => {
        const cfg = vscode.workspace.getConfiguration('encoding-guard');
        await cfg.update('patternMap', { '.txt': 'utf8' }, vscode.ConfigurationTarget.Global);
        try {
            const uri = vscode.Uri.file('/dev/null/test.txt');
            const buf = Buffer.from('<?xml encoding="ISO-8859-1"?>\ndata', 'utf8');
            assert.strictEqual(resolveTargetEncoding(uri, buf), 'utf8',
                'Config entry must take precedence over XML declaration');
        } finally {
            await cfg.update('patternMap', undefined, vscode.ConfigurationTarget.Global);
        }
    });
});
