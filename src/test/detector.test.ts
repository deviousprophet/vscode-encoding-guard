import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { detectBom, detectEncoding, detectXmlDeclaration } from '../detector';

// Sample directory is at <workspace-root>/sample/
// tsconfig rootDir=src, outDir=out  →  __dirname = <root>/out/test
const SAMPLE = path.resolve(__dirname, '..', '..', 'sample');

suite('detectBom', () => {
    test('returns utf8bom for UTF-8 BOM bytes', () => {
        const buf = Buffer.from([0xEF, 0xBB, 0xBF, 0x41]);
        assert.strictEqual(detectBom(buf), 'utf8bom');
    });

    test('returns utf16le for FF FE BOM', () => {
        const buf = Buffer.from([0xFF, 0xFE, 0x41, 0x00]);
        assert.strictEqual(detectBom(buf), 'utf16le');
    });

    test('returns utf16be for FE FF BOM', () => {
        const buf = Buffer.from([0xFE, 0xFF, 0x00, 0x41]);
        assert.strictEqual(detectBom(buf), 'utf16be');
    });

    test('returns null when no BOM', () => {
        const buf = Buffer.from('Hello world', 'utf8');
        assert.strictEqual(detectBom(buf), null);
    });

    test('returns null for empty buffer', () => {
        assert.strictEqual(detectBom(Buffer.alloc(0)), null);
    });
});

suite('detectXmlDeclaration', () => {
    test('parses UTF-8 declaration from sample file', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'utf8-decl.xml'));
        assert.strictEqual(detectXmlDeclaration(buf), 'utf8');
    });

    test('parses ISO-8859-1 declaration from sample file', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'iso88591-decl.xml'));
        assert.strictEqual(detectXmlDeclaration(buf), 'latin1');
    });

    test('parses UTF-8 declaration from ARXML sample', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'utf8.arxml'));
        assert.strictEqual(detectXmlDeclaration(buf), 'utf8');
    });

    test('returns null when no XML declaration', () => {
        const buf = Buffer.from('<root><element/></root>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), null);
    });

    test('returns null for empty buffer', () => {
        assert.strictEqual(detectXmlDeclaration(Buffer.alloc(0)), null);
    });

    test('is case-insensitive for encoding attribute', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><r/>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'utf8');
        const buf2 = Buffer.from("<?xml version='1.0' encoding='utf-8'?><r/>", 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf2), 'utf8');
    });

    test('handles single-quoted encoding attribute', () => {
        const buf = Buffer.from("<?xml version='1.0' encoding='ISO-8859-1'?><r/>", 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'latin1');
    });

    test('parses UTF-16 LE file (BOM + declaration)', () => {
        // Build a UTF-16 LE buffer: BOM + declaration in UTF-16 LE
        const decl = '<?xml version="1.0" encoding="UTF-16"?><r/>';
        const textBuf = Buffer.from(decl, 'utf16le');
        const bom = Buffer.from([0xFF, 0xFE]);
        const buf = Buffer.concat([bom, textBuf]);
        // "utf-16" normalizes to 'utf16le'
        assert.strictEqual(detectXmlDeclaration(buf), 'utf16le');
    });
});

suite('detectEncoding (heuristic)', () => {
    test('ascii.txt detected as utf8', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'ascii.txt'));
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf8-emoji.txt detected as utf8', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'utf8-emoji.txt'));
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('long-utf8.txt detected as utf8', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'long-utf8.txt'));
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf16le.txt detected as utf16le (BOM)', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'utf16le.txt'));
        assert.strictEqual(detectEncoding(buf), 'utf16le');
    });

    test('utf16be.txt detected as utf16be (BOM)', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'utf16be.txt'));
        assert.strictEqual(detectEncoding(buf), 'utf16be');
    });

    test('csv-latin1.csv detected as latin1', () => {
        const buf = fs.readFileSync(path.join(SAMPLE, 'csv-latin1.csv'));
        assert.strictEqual(detectEncoding(buf), 'latin1');
    });

    test('UTF-8 BOM bytes detected as utf8bom', () => {
        const content = Buffer.concat([
            Buffer.from([0xEF, 0xBB, 0xBF]),
            Buffer.from('Hello BOM\n', 'utf8'),
        ]);
        assert.strictEqual(detectEncoding(content), 'utf8bom');
    });

    test('empty buffer detected as utf8', () => {
        assert.strictEqual(detectEncoding(Buffer.alloc(0)), 'utf8');
    });

    test('buffer full of NUL bytes detected as binary', () => {
        const buf = Buffer.alloc(100, 0);
        assert.strictEqual(detectEncoding(buf), 'binary');
    });
});

