import * as assert from 'assert';
import {
    detectBom,
    detectEncoding,
    detectXmlDeclaration,
    startsWithXmlPreamble,
    XML_DECLARATION_SCAN_BYTES,
} from '../detector';

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

suite('startsWithXmlPreamble', () => {
    test('returns true for plain xml preamble', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>', 'utf8');
        assert.strictEqual(startsWithXmlPreamble(buf), true);
    });

    test('returns true for xml preamble after UTF-8 BOM and whitespace', () => {
        const buf = Buffer.concat([
            Buffer.from([0xEF, 0xBB, 0xBF]),
            Buffer.from('  \r\n\t<?xml version="1.0"?>', 'utf8'),
        ]);
        assert.strictEqual(startsWithXmlPreamble(buf), true);
    });

    test('returns true for UTF-16 BOM prefix (defer to full parser)', () => {
        const buf = Buffer.from([0xFF, 0xFE, 0x3C, 0x00, 0x3F, 0x00]);
        assert.strictEqual(startsWithXmlPreamble(buf), true);
    });

    test('returns false when prefix is not xml', () => {
        const buf = Buffer.from('not xml at all', 'utf8');
        assert.strictEqual(startsWithXmlPreamble(buf), false);
    });
});

suite('detectXmlDeclaration', () => {
    test('parses UTF-8 declaration', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<root/>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'utf8');
    });

    test('parses ISO-8859-1 declaration', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="ISO-8859-1"?>\n<root/>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'iso88591');
    });

    test('parses UTF-8 declaration from ARXML-style content', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<arxml><element/></arxml>', 'utf8');
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
        assert.strictEqual(detectXmlDeclaration(buf), 'iso88591');
    });

    test('parses UTF-16 LE file (BOM + declaration)', () => {
        const decl = '<?xml version="1.0" encoding="UTF-16"?><r/>';
        const textBuf = Buffer.from(decl, 'utf16le');
        const bom = Buffer.from([0xFF, 0xFE]);
        const buf = Buffer.concat([bom, textBuf]);
        assert.strictEqual(detectXmlDeclaration(buf), 'utf16le');
    });

    test('non-.xml content (.txt) with ISO-8859-1 declaration returns iso88591', () => {
        const buf = Buffer.from('<?xml encoding="ISO-8859-1"?>\nCaf\u00E9 R\u00E9sum\u00E9', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'iso88591');
    });

    test('non-.xml content (.csv) with windows-1252 declaration returns windows1252', () => {
        const buf = Buffer.from('<?xml encoding="windows-1252"?>\nPrice,?100', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'windows1252');
    });

    test('windows1252 declaration returns windows1252', () => {
        const buf = Buffer.from('<?xml version="1.0" encoding="windows-1252"?>\n<root/>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), 'windows1252');
    });

    test('XML with <?xml version="1.0"?> but no encoding attribute returns null', () => {
        const buf = Buffer.from('<?xml version="1.0"?>\n<root><element/></root>', 'utf8');
        assert.strictEqual(detectXmlDeclaration(buf), null);
    });

    test('declaration placed beyond scan window is not detected (returns null)', () => {
        const padding = Buffer.alloc(XML_DECLARATION_SCAN_BYTES + 1, 0x20);
        const decl = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>', 'utf8');
        const buf = Buffer.concat([padding, decl]);
        assert.strictEqual(detectXmlDeclaration(buf), null);
    });

    test('truncated buffer (cuts off inside encoding attribute) does not throw', () => {
        const partial = Buffer.from('<?xml version="1.0" encoding="ISO', 'utf8');
        assert.doesNotThrow(() => detectXmlDeclaration(partial));
        assert.strictEqual(detectXmlDeclaration(partial), null);
    });
});

suite('detectEncoding (heuristic)', () => {
    test('ascii detected as utf8', () => {
        const buf = Buffer.from('Hello world\n', 'utf8');
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf8 emoji detected as utf8', () => {
        const buf = Buffer.from('\u{1F600}\n', 'utf8');
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('long utf8 detected as utf8', () => {
        const buf = Buffer.from('\u00E9\u00E8\u00EA\u00EB\u00EF\u00EE\u00EC\u00ED'.repeat(200), 'utf8');
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf16le BOM detected as utf16le', () => {
        const buf = Buffer.concat([
            Buffer.from([0xFF, 0xFE]),
            Buffer.from('Hello', 'utf16le'),
        ]);
        assert.strictEqual(detectEncoding(buf), 'utf16le');
    });

    test('utf16be BOM detected as utf16be', () => {
        // Node has no utf16be encoding; swap bytes manually from utf16le.
        const le = Buffer.from('Hello', 'utf16le');
        const be = Buffer.alloc(le.length);
        for (let i = 0; i + 1 < le.length; i += 2) {
            be[i] = le[i + 1];
            be[i + 1] = le[i];
        }
        const buf = Buffer.concat([Buffer.from([0xFE, 0xFF]), be]);
        assert.strictEqual(detectEncoding(buf), 'utf16be');
    });

    test('latin1 content detected as latin1', () => {
        const buf = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x20, 0xA3, 0x31, 0x30, 0x30]);
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
