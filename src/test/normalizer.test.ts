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

    // --- UTF-8 BOM ---
    test('utf-8-bom → utf8bom', () => assert.strictEqual(normalizeEncoding('utf-8-bom'), 'utf8bom'));
    test('UTF-8-BOM → utf8bom', () => assert.strictEqual(normalizeEncoding('UTF-8-BOM'), 'utf8bom'));
    test('utf8WithBom → utf8bom', () => assert.strictEqual(normalizeEncoding('utf8WithBom'), 'utf8bom'));

    // --- UTF-16 bare variants ---
    test('UTF-16 → utf16le (bare, assume LE)', () => assert.strictEqual(normalizeEncoding('UTF-16'), 'utf16le'));
    test('utf-16 → utf16le', () => assert.strictEqual(normalizeEncoding('utf-16'), 'utf16le'));

    // --- ISO-8859 family ---
    test('ISO-8859-1 → latin1',   () => assert.strictEqual(normalizeEncoding('ISO-8859-1'),  'latin1'));
    test('ISO-8859-2 → iso88592', () => assert.strictEqual(normalizeEncoding('ISO-8859-2'),  'iso88592'));
    test('ISO-8859-3 → iso88593', () => assert.strictEqual(normalizeEncoding('ISO-8859-3'),  'iso88593'));
    test('ISO-8859-4 → iso88594', () => assert.strictEqual(normalizeEncoding('ISO-8859-4'),  'iso88594'));
    test('ISO-8859-5 → iso88595', () => assert.strictEqual(normalizeEncoding('ISO-8859-5'),  'iso88595'));
    test('ISO-8859-6 → iso88596', () => assert.strictEqual(normalizeEncoding('ISO-8859-6'),  'iso88596'));
    test('ISO-8859-7 → iso88597', () => assert.strictEqual(normalizeEncoding('ISO-8859-7'),  'iso88597'));
    test('ISO-8859-8 → iso88598', () => assert.strictEqual(normalizeEncoding('ISO-8859-8'),  'iso88598'));
    test('ISO-8859-9 → iso88599', () => assert.strictEqual(normalizeEncoding('ISO-8859-9'),  'iso88599'));
    test('ISO-8859-10 → iso885910', () => assert.strictEqual(normalizeEncoding('ISO-8859-10'), 'iso885910'));
    test('ISO-8859-11 → iso885911', () => assert.strictEqual(normalizeEncoding('ISO-8859-11'), 'iso885911'));
    test('ISO-8859-13 → iso885913', () => assert.strictEqual(normalizeEncoding('ISO-8859-13'), 'iso885913'));
    test('ISO-8859-14 → iso885914', () => assert.strictEqual(normalizeEncoding('ISO-8859-14'), 'iso885914'));
    test('ISO-8859-15 → iso885915', () => assert.strictEqual(normalizeEncoding('ISO-8859-15'), 'iso885915'));

    // --- Windows code pages ---
    test('windows-1250 → windows1250', () => assert.strictEqual(normalizeEncoding('windows-1250'), 'windows1250'));
    test('cp1250 → windows1250',        () => assert.strictEqual(normalizeEncoding('cp1250'),       'windows1250'));
    test('Windows-1250 → windows1250',  () => assert.strictEqual(normalizeEncoding('Windows-1250'), 'windows1250'));
    test('windows-1251 → windows1251',  () => assert.strictEqual(normalizeEncoding('windows-1251'), 'windows1251'));
    test('cp1251 → windows1251',        () => assert.strictEqual(normalizeEncoding('cp1251'),       'windows1251'));
    test('windows-1252 → windows1252',  () => assert.strictEqual(normalizeEncoding('windows-1252'), 'windows1252'));
    test('cp1252 → windows1252',        () => assert.strictEqual(normalizeEncoding('cp1252'),       'windows1252'));
    test('ANSI → windows1252',          () => assert.strictEqual(normalizeEncoding('ANSI'),         'windows1252'));
    test('windows-1253 → windows1253',  () => assert.strictEqual(normalizeEncoding('windows-1253'), 'windows1253'));
    test('cp1253 → windows1253',        () => assert.strictEqual(normalizeEncoding('cp1253'),       'windows1253'));
    test('windows-1254 → windows1254',  () => assert.strictEqual(normalizeEncoding('windows-1254'), 'windows1254'));
    test('cp1254 → windows1254',        () => assert.strictEqual(normalizeEncoding('cp1254'),       'windows1254'));
    test('windows-1255 → windows1255',  () => assert.strictEqual(normalizeEncoding('windows-1255'), 'windows1255'));
    test('cp1255 → windows1255',        () => assert.strictEqual(normalizeEncoding('cp1255'),       'windows1255'));
    test('windows-1256 → windows1256',  () => assert.strictEqual(normalizeEncoding('windows-1256'), 'windows1256'));
    test('cp1256 → windows1256',        () => assert.strictEqual(normalizeEncoding('cp1256'),       'windows1256'));
    test('windows-1257 → windows1257',  () => assert.strictEqual(normalizeEncoding('windows-1257'), 'windows1257'));
    test('cp1257 → windows1257',        () => assert.strictEqual(normalizeEncoding('cp1257'),       'windows1257'));
    test('windows-1258 → windows1258',  () => assert.strictEqual(normalizeEncoding('windows-1258'), 'windows1258'));
    test('cp1258 → windows1258',        () => assert.strictEqual(normalizeEncoding('cp1258'),       'windows1258'));
});
