import * as assert from 'assert';
import { convertBuffer, hasBom } from '../converter';

suite('hasBom', () => {
    test('returns utf8bom for UTF-8 BOM bytes', () => {
        assert.strictEqual(hasBom(Buffer.from([0xEF, 0xBB, 0xBF])), 'utf8bom');
    });

    test('returns utf16le for FF FE BOM', () => {
        assert.strictEqual(hasBom(Buffer.from([0xFF, 0xFE])), 'utf16le');
    });

    test('returns utf16be for FE FF BOM', () => {
        assert.strictEqual(hasBom(Buffer.from([0xFE, 0xFF])), 'utf16be');
    });

    test('returns null when no BOM', () => {
        assert.strictEqual(hasBom(Buffer.from([0x48, 0x65, 0x6C])), null);
    });

    test('returns null for empty buffer', () => {
        assert.strictEqual(hasBom(Buffer.alloc(0)), null);
    });
});

suite('convertBuffer', () => {
    test('UTF-8 to UTF-8 is identity', () => {
        const input = Buffer.from('hello world', 'utf8');
        const result = convertBuffer(input, 'utf8', 'utf8');
        assert.deepStrictEqual(result, input);
    });

    test('UTF-8 to UTF-16LE', () => {
        const input = Buffer.from('hello', 'utf8');
        const result = convertBuffer(input, 'utf8', 'utf16le');
        const expected = Buffer.from('hello', 'utf16le');
        assert.deepStrictEqual(result, expected);
    });

    test('UTF-16LE back to UTF-8', () => {
        const input = Buffer.from('hello', 'utf16le');
        const result = convertBuffer(input, 'utf16le', 'utf8');
        const expected = Buffer.from('hello', 'utf8');
        assert.deepStrictEqual(result, expected);
    });

    test('UTF-8 to UTF-8 with BOM prepends BOM bytes', () => {
        const input = Buffer.from('abc', 'utf8');
        const result = convertBuffer(input, 'utf8', 'utf8bom');
        const expected = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), input]);
        assert.deepStrictEqual(result, expected);
    });

    test('ISO-8859-1 round-trip', () => {
        const bytes = Buffer.from([0xE9, 0xE0, 0xE7]); // éàç in ISO-8859-1
        const utf8 = convertBuffer(bytes, 'iso88591', 'utf8');
        const back = convertBuffer(utf8, 'utf8', 'iso88591');
        assert.deepStrictEqual(back, bytes);
    });

    test('Windows-1252 round-trip', () => {
        const bytes = Buffer.from([0x80, 0x99]); // € ™ in Windows-1252
        const utf8 = convertBuffer(bytes, 'windows1252', 'utf8');
        const back = convertBuffer(utf8, 'utf8', 'windows1252');
        assert.deepStrictEqual(back, bytes);
    });

    test('empty buffer round-trips', () => {
        const input = Buffer.alloc(0);
        const result = convertBuffer(input, 'utf8', 'utf16le');
        assert.strictEqual(result.length, 0);
    });
});
