import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getEditorConfigCharset } from '../editorconfigReader';

function withEditorconfig(content: string, fn: (dir: string, filePath: string) => void): void {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ec-test-'));
    fs.writeFileSync(path.join(dir, '.editorconfig'), content);
    const filePath = path.join(dir, 'test.csv');
    fs.writeFileSync(filePath, 'a,b,c\n');
    try {
        fn(dir, filePath);
    } finally {
        fs.rmSync(dir, { recursive: true });
    }
}

suite('getEditorConfigCharset', () => {
    test('returns iso88591 for charset=latin1', () => {
        withEditorconfig('[*.csv]\ncharset = latin1', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'iso88591');
        });
    });

    test('returns utf8 for charset=utf-8', () => {
        withEditorconfig('[*.csv]\ncharset = utf-8', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'utf8');
        });
    });

    test('returns utf8bom for charset=utf-8-bom', () => {
        withEditorconfig('[*.csv]\ncharset = utf-8-bom', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'utf8bom');
        });
    });

    test('returns utf16le for charset=utf-16le', () => {
        withEditorconfig('[*.csv]\ncharset = utf-16le', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'utf16le');
        });
    });

    test('returns utf16le for charset=utf-16 (bare)', () => {
        withEditorconfig('[*.csv]\ncharset = utf-16', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'utf16le');
        });
    });

    test('returns null when no charset set', () => {
        withEditorconfig('[*.csv]\nindent_style = space', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), null);
        });
    });

    test('returns null for charset=unset', () => {
        withEditorconfig('[*.csv]\ncharset = unset', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), null);
        });
    });

    test('returns null when file has no .editorconfig', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ec-test-'));
        const filePath = path.join(dir, 'test.csv');
        fs.writeFileSync(filePath, 'a,b,c\n');
        try {
            assert.strictEqual(getEditorConfigCharset(filePath), null);
        } finally {
            fs.rmSync(dir, { recursive: true });
        }
    });

    test('handles glob pattern matching', () => {
        withEditorconfig('[*.csv]\ncharset = latin1\n[*.json]\ncharset = utf-8', (dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), 'iso88591');
            const jsonPath = path.join(dir, 'test.json');
            fs.writeFileSync(jsonPath, '{}');
            assert.strictEqual(getEditorConfigCharset(jsonPath), 'utf8');
        });
    });

    test('root .editorconfig with no matching section returns null', () => {
        withEditorconfig('[*.json]\ncharset = utf-8', (_dir, filePath) => {
            assert.strictEqual(getEditorConfigCharset(filePath), null);
        });
    });
});
