import * as assert from 'assert';
import { normalizeEncoding } from '../normalizer';

suite('normalizeEncoding', () => {
    // UTF-8 variants
    test('utf8 → utf8', () => assert.strictEqual(normalizeEncoding('utf8'), 'utf8'));
    test('UTF-8 → utf8', () => assert.strictEqual(normalizeEncoding('UTF-8'), 'utf8'));
    test('utf-8 → utf8', () => assert.strictEqual(normalizeEncoding('utf-8'), 'utf8'));
    test('utf_8 → utf8', () => assert.strictEqual(normalizeEncoding('utf_8'), 'utf8'));

    // UTF-8 BOM
    test('utf8bom → utf8bom', () => assert.strictEqual(normalizeEncoding('utf8bom'), 'utf8bom'));
    test('utf-8-bom → utf8bom', () => assert.strictEqual(normalizeEncoding('utf-8-bom'), 'utf8bom'));

    // UTF-16 LE
    test('utf16le → utf16le', () => assert.strictEqual(normalizeEncoding('utf16le'), 'utf16le'));
    test('UTF-16LE → utf16le', () => assert.strictEqual(normalizeEncoding('UTF-16LE'), 'utf16le'));
    test('utf-16le → utf16le', () => assert.strictEqual(normalizeEncoding('utf-16le'), 'utf16le'));

    // UTF-16 BE
    test('utf16be → utf16be', () => assert.strictEqual(normalizeEncoding('utf16be'), 'utf16be'));
    test('UTF-16BE → utf16be', () => assert.strictEqual(normalizeEncoding('UTF-16BE'), 'utf16be'));

    // UTF-16 bare (no endian suffix) → assume LE
    test('utf16 → utf16le', () => assert.strictEqual(normalizeEncoding('utf16'), 'utf16le'));
    test('UTF-16 → utf16le', () => assert.strictEqual(normalizeEncoding('UTF-16'), 'utf16le'));

    // Latin-1 / ISO-8859-1
    test('latin1 → latin1', () => assert.strictEqual(normalizeEncoding('latin1'), 'latin1'));
    test('latin-1 → latin1', () => assert.strictEqual(normalizeEncoding('latin-1'), 'latin1'));
    test('ISO-8859-1 → latin1', () => assert.strictEqual(normalizeEncoding('ISO-8859-1'), 'latin1'));
    test('iso88591 → latin1', () => assert.strictEqual(normalizeEncoding('iso88591'), 'latin1'));
    test('iso-8859-1 → latin1', () => assert.strictEqual(normalizeEncoding('iso-8859-1'), 'latin1'));

    // ISO-8859-2
    test('ISO-8859-2 → iso88592', () => assert.strictEqual(normalizeEncoding('ISO-8859-2'), 'iso88592'));

    // Windows code pages
    test('windows-1252 → windows1252', () => assert.strictEqual(normalizeEncoding('windows-1252'), 'windows1252'));
    test('Windows-1252 → windows1252', () => assert.strictEqual(normalizeEncoding('Windows-1252'), 'windows1252'));
    test('cp1252 → windows1252', () => assert.strictEqual(normalizeEncoding('cp1252'), 'windows1252'));
    test('windows1252 → windows1252', () => assert.strictEqual(normalizeEncoding('windows1252'), 'windows1252'));
    test('windows-1251 → windows1251', () => assert.strictEqual(normalizeEncoding('windows-1251'), 'windows1251'));

    // Unknown encoding — returned lowercased and stripped
    test('unknown encoding lowercased', () => {
        assert.strictEqual(normalizeEncoding('SOME-UNKNOWN'), 'someunknown');
    });
});
