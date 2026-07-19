import * as editorconfig from 'editorconfig';

const CHARSET_TO_VSCODE: Record<string, string> = {
    'utf-8': 'utf8',
    'utf-8-bom': 'utf8bom',
    'utf-16': 'utf16le',
    'utf-16le': 'utf16le',
    'utf-16be': 'utf16be',
    'latin1': 'iso88591',
};

export function getEditorConfigCharset(filePath: string): string | null {
    const config = editorconfig.parseSync(filePath);
    const raw = config.charset;
    if (typeof raw !== 'string' || raw === 'unset') { return null; }
    return CHARSET_TO_VSCODE[raw] ?? null;
}
