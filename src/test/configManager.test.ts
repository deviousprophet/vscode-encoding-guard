import * as assert from 'assert';
import * as vscode from 'vscode';
import { getExpectedEncoding } from '../configManager';

suite('getExpectedEncoding', () => {
    const cfg = () => vscode.workspace.getConfiguration('encoding-guard');

    async function setPatternMap(map: Record<string, string>): Promise<void> {
        await cfg().update('patternMap', map, vscode.ConfigurationTarget.Global);
    }

    teardown(async () => {
        await cfg().update('patternMap', undefined, vscode.ConfigurationTarget.Global);
    });

    test('returns null when patternMap is empty', () => {
        const uri = vscode.Uri.file('/some/file.csv');
        const result = getExpectedEncoding(uri);
        assert.ok(result === null || typeof result === 'string');
    });

    test('matches extension shorthand pattern (.csv)', async () => {
        await setPatternMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/data.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'windows1252');
    });

    test('returns null for extension not in map', async () => {
        await setPatternMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/readme.txt');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, null);
    });

    test('normalizes configured encoding name', async () => {
        await setPatternMap({ '.log': 'UTF-8' });
        const uri = vscode.Uri.file('/workspace/app.log');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'utf8');
    });

    test('matches exact file path pattern', async () => {
        // Use a recursive glob to match anywhere in this synthetic-path test setup.
        await setPatternMap({ '**/legacy.csv': 'iso88591' });
        const uri = vscode.Uri.file('/workspace/data/legacy.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'iso88591');
    });

    test('matches glob pattern with single asterisk', async () => {
        // Use a recursive glob that matches the synthetic workspace path.
        await setPatternMap({ '**/*.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/data/report.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'windows1252');
    });

    test('glob single asterisk does not cross directories', async () => {
        await setPatternMap({ 'data/*.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/data/subdir/report.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, null);
    });

    test('matches glob pattern with double asterisk', async () => {
        await setPatternMap({ '**/*.xml': 'utf8' });
        const uri = vscode.Uri.file('/workspace/deep/nested/file.xml');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'utf8');
    });

    test('specific file pattern overrides extension pattern', async () => {
        // Extension shorthand should be matched last (lowest priority).
        await setPatternMap({
            '.csv': 'windows1252',
            '**/*.csv': 'iso88591',  // This glob should take precedence
        });
        const uri = vscode.Uri.file('/workspace/data/special.csv');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'iso88591', 'More specific glob should override extension');
    });

    test('specific glob overrides extension pattern', async () => {
        await setPatternMap({
            '.xpt': 'windows1252',
            '**/special.xpt': 'iso88591',  // Specific glob overrides extension
        });
        const uri = vscode.Uri.file('/workspace/special.xpt');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'iso88591', 'Glob pattern should override extension');
    });

    test('returns null for a file with no extension and no matching pattern', async () => {
        await setPatternMap({ '.csv': 'windows1252' });
        const uri = vscode.Uri.file('/workspace/Makefile');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, null);
    });

    test('case-insensitive path matching', async () => {
        await setPatternMap({ '**/legacy.csv': 'iso88591' });
        const uri = vscode.Uri.file('/workspace/DATA/LEGACY.CSV');
        const result = getExpectedEncoding(uri);
        assert.strictEqual(result, 'iso88591');
    });
});

