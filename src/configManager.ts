import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeEncoding } from './normalizer';

function toPosixPath(p: string): string {
    return p.replace(/\\/g, '/');
}

function hasGlobSyntax(pattern: string): boolean {
    return /[*?\[\]{}]/.test(pattern);
}

const GLOB_TRANSLATIONS: Record<string, string> = {
    '?': '[^/]',
};

function escapeRegExpChar(ch: string): string {
    return '\\^$+?.()|{}[]'.includes(ch) ? `\\${ch}` : ch;
}

function translateGlobChar(glob: string, index: number): { source: string; nextIndex: number } {
    const ch = glob[index];
    const translation = GLOB_TRANSLATIONS[ch];

    return ch === '*'
        ? { source: glob[index + 1] === '*' ? '.*' : '[^/]*', nextIndex: index + Number(glob[index + 1] === '*') }
        : { source: translation ?? escapeRegExpChar(ch), nextIndex: index };
}

function globToRegExp(glob: string): RegExp {
    let out = '^';

    for (let i = 0; i < glob.length; i++) {
        const translated = translateGlobChar(glob, i);
        out += translated.source;
        i = translated.nextIndex;
    }

    out += '$';
    return new RegExp(out, 'i');
}

function isExtensionPattern(pattern: string): boolean {
    return pattern.startsWith('.') && !pattern.includes('/');
}

function matchPattern(pattern: string, relPath: string, ext: string): boolean {
    const normalizedPattern = toPosixPath(pattern.trim());
    if (!normalizedPattern) {
        return false;
    }

    // Convenience shorthand: ".csv" means "any file with .csv extension".
    if (isExtensionPattern(normalizedPattern)) {
        return ext === normalizedPattern.toLowerCase();
    }

    if (!hasGlobSyntax(normalizedPattern)) {
        return relPath.toLowerCase() === normalizedPattern.toLowerCase();
    }

    return globToRegExp(normalizedPattern).test(relPath);
}

type PatternEntry = [string, string];

function getPatternEntries(patternMap: Record<string, string>): PatternEntry[] {
    return Object.entries(patternMap).filter(([, enc]) => enc && enc.trim() !== '');
}

function groupPatternEntries(entries: PatternEntry[]): {
    exact: PatternEntry[];
    globs: PatternEntry[];
    extensions: PatternEntry[];
} {
    const exact: PatternEntry[] = [];
    const globs: PatternEntry[] = [];
    const extensions: PatternEntry[] = [];

    for (const entry of entries) {
        const pattern = entry[0];
        if (isExtensionPattern(pattern)) {
            extensions.push(entry);
        } else if (hasGlobSyntax(pattern)) {
            globs.push(entry);
        } else {
            exact.push(entry);
        }
    }

    return { exact, globs, extensions };
}

function byPathDepthDesc([a]: PatternEntry, [b]: PatternEntry): number {
    return b.split('/').length - a.split('/').length;
}

function getPatternMapEncoding(
    patternMap: Record<string, string>,
    relPath: string,
    ext: string,
): string | null {
    // Sort patterns by specificity: exact paths > globs (by depth) > extension shorthand.
    // This ensures specific file patterns override general extension patterns.
    const { exact, globs, extensions } = groupPatternEntries(getPatternEntries(patternMap));
    globs.sort(byPathDepthDesc);

    for (const [pattern, encoding] of exact.concat(globs, extensions)) {
        if (matchPattern(pattern, relPath, ext)) {
            return normalizeEncoding(encoding);
        }
    }

    return null;
}

/**
 * Reads Encoding Guard configuration for the given URI and returns the explicitly
 * configured encoding from the `encoding-guard.patternMap`.
 *
 * Pattern types supported:
 * - Exact paths: "data/report.csv" (case-insensitive)
 * - Glob patterns: single-star forms for one segment and double-star recursive forms
 * - Extension shorthand: ".csv" matches any file with that extension
 *
 * Matching priority (smart ordering):
 * 1. Exact paths match first (most specific)
 * 2. Glob patterns match next (ordered by number of path segments; more specific first)
 * 3. Extension patterns match last (least specific; catches all remaining)
 *
 * This ensures specific file overrides always win over extension defaults.
 * Returns a normalized VS Code encoding identifier, or `null` if no pattern matches.
 * When `null` is returned, `applier.ts` falls through to XML declaration detection.
 */
export function getExpectedEncoding(uri: vscode.Uri): string | null {
    const cfg = vscode.workspace.getConfiguration('encoding-guard', uri);
    const ext = path.extname(uri.fsPath).toLowerCase();

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    const relPath = workspaceFolder
        ? toPosixPath(path.relative(workspaceFolder.uri.fsPath, uri.fsPath))
        : toPosixPath(uri.path.startsWith('/') ? uri.path.slice(1) : uri.path);

    const patternMap = cfg.get<Record<string, string>>('patternMap', {});
    return getPatternMapEncoding(patternMap, relPath, ext);
}
