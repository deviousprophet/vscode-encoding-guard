import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import { detectEncoding } from '../encoding';

suite('Encoding detection', () => {

    test('ascii detected as utf8', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'ascii.txt');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf8 with emoji detected', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'utf8-emoji.txt');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('long utf8 file detected', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'long-utf8.txt');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf8');
    });

    test('utf8 BOM detected', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'utf8_bom.txt');
        const content = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from('Hello with BOM\n')]);
        fs.writeFileSync(p, content);
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf8-bom');
        fs.unlinkSync(p);
    });

    test('utf16le detected', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'utf16le.txt');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf16le');
    });

    test('utf16be detected', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'utf16be.txt');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'utf16be');
    });

    test('latin1 sample detection', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'latin1.bin');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'latin1');
    });

    test('csv-latin1 detection', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'csv-latin1.csv');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'latin1');
    });

    test('mixed detection falls back to latin1', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'mixed.bin');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'latin1');
    });

    test('binary detection for many NUL bytes', () => {
        const p = path.resolve(__dirname, '..', '..', 'sample', 'binary.bin');
        const buf = fs.readFileSync(p);
        assert.strictEqual(detectEncoding(buf), 'binary');
    });
});
