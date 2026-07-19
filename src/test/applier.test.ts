import * as assert from 'assert';
import * as vscode from 'vscode';
import { resolveTargetEncoding, detectHeuristicEncoding } from '../applier';

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

// ---------------------------------------------------------------------------
// resolveTargetEncoding — heuristic fallback
// ---------------------------------------------------------------------------
suite('resolveTargetEncoding — heuristic fallback', () => {
    const cfg = vscode.workspace.getConfiguration('encoding-guard');

    setup(async () => {
        await cfg.update('enableHeuristicFallback', true, vscode.ConfigurationTarget.Global);
    });

    teardown(async () => {
        await cfg.update('enableHeuristicFallback', undefined, vscode.ConfigurationTarget.Global);
    });

    test('heuristic fallback is off by default', async () => {
        await cfg.update('enableHeuristicFallback', undefined, vscode.ConfigurationTarget.Global);
        // Raw latin1 bytes that jschardet would detect as windows-1252
        const buf = Buffer.from([0x43, 0x61, 0x66, 0xE9, 0x20, 0x52, 0xE9, 0x73, 0x75, 0x6D, 0xE9]);
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), null);
    });

    test('heuristic detects windows-1252 for latin1-heavy content', async () => {
        // Raw latin1 bytes: "Caf\u00E9 R\u00E9sum\u00E9"
        const buf = Buffer.from([0x43, 0x61, 0x66, 0xE9, 0x20, 0x52, 0xE9, 0x73, 0x75, 0x6D, 0xE9]);
        const result = resolveTargetEncoding(DUMMY_URI, buf);
        // jschardet should detect windows-1252 or iso88591
        assert.ok(result !== null, 'heuristic should detect a non-UTF-8 encoding');
        assert.ok(result !== 'utf8', 'heuristic should not return utf8 for latin1 content');
    });

    test('heuristic returns null for ASCII content (already UTF-8 compatible)', async () => {
        const buf = Buffer.from('Hello world\n', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), null);
    });

    test('heuristic returns null for empty buffer', async () => {
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, Buffer.alloc(0)), null);
    });

    test('XML declaration still takes precedence over heuristic', async () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="ISO-8859-1"?>\n<root/>', 'utf8');
        assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'iso88591');
    });

    test('patternMap still takes precedence over heuristic', async () => {
        await cfg.update('patternMap', { '.xml': 'utf8' }, vscode.ConfigurationTarget.Global);
        try {
            const buf = Buffer.from([0x43, 0x61, 0x66, 0xE9]);
            assert.strictEqual(resolveTargetEncoding(DUMMY_URI, buf), 'utf8');
        } finally {
            await cfg.update('patternMap', undefined, vscode.ConfigurationTarget.Global);
        }
    });
});

// ---------------------------------------------------------------------------
// detectHeuristicEncoding — direct unit tests
// ---------------------------------------------------------------------------
suite('detectHeuristicEncoding', () => {
    test('returns null for empty buffer', () => {
        assert.strictEqual(detectHeuristicEncoding(Buffer.alloc(0)), null);
    });

    test('returns null for ASCII content', () => {
        assert.strictEqual(detectHeuristicEncoding(Buffer.from('Hello world')), null);
    });

    test('returns null for UTF-8 content', () => {
        assert.strictEqual(detectHeuristicEncoding(Buffer.from('Caf\u00E9 \u00FC\u00F1\u00EE\u00E7\u00F6\u00E4\u00E3\u00E5')), null);
    });

    test('detects non-UTF-8 encoding for latin1-heavy content', () => {
        // Raw bytes that jschardet should detect as windows-1252 or similar
        const buf = Buffer.from([0x43, 0x61, 0x66, 0xE9, 0x20, 0x52, 0xE9, 0x73, 0x75, 0x6D, 0xE9]);
        const result = detectHeuristicEncoding(buf);
        assert.ok(result !== null, 'should detect a non-UTF-8 encoding');
        assert.ok(result !== 'utf8', 'should not return utf8');
    });
});
