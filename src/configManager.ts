import * as vscode from 'vscode';
import * as path from 'path';
import { normalizeEncoding } from './normalizer';

function toPosixPath(p: string): string {
    return p.replace(/\\/g, '/');
}

function hasGlobSyntax(pattern: string): boolean {
    return /[*?\[\]{}]/.test(pattern);
}

function globToRegExp(glob: string): RegExp {
    let out = '^';

    for (let i = 0; i < glob.length; i++) {
        const ch = glob[i];

        if (ch === '*') {
            const isDoubleStar = glob[i + 1] === '*';
            if (isDoubleStar) {
                out += '.*';
                i += 1;
            } else {
                out += '[^/]*';
            }
            continue;
        }

        if (ch === '?') {
            out += '[^/]';
            continue;
        }

        if ('\\^$+?.()|{}[]'.includes(ch)) {
            out += `\\${ch}`;
            continue;
        }

        out += ch;
    }

    out += '$';
    return new RegExp(out, 'i');
}

function matchPattern(pattern: string, relPath: string, ext: string): boolean {
    const normalizedPattern = toPosixPath(pattern.trim());
    if (!normalizedPattern) {
        return false;
    }

    // Convenience shorthand: ".csv" means "any file with .csv extension".
    if (normalizedPattern.startsWith('.') && !normalizedPattern.includes('/')) {
        return ext === normalizedPattern.toLowerCase();
    }

    if (!hasGlobSyntax(normalizedPattern)) {
        return relPath.toLowerCase() === normalizedPattern.toLowerCase();
    }

    return globToRegExp(normalizedPattern).test(relPath);
}

function getPatternMapEncoding(
    patternMap: Record<string, string>,
    relPath: string,
    ext: string,
): string | null {
    // Sort patterns by specificity: exact paths > globs (by depth) > extension shorthand.
    // This ensures specific file patterns override general extension patterns.
    const entries = Object.entries(patternMap).filter(([, enc]) => enc && enc.trim() !== '');
    
    const exact: typeof entries = [];
    const globs: typeof entries = [];
    const extensions: typeof entries = [];

    for (const entry of entries) {
        const pattern = entry[0];
        if (pattern.startsWith('.') && !pattern.includes('/')) {
            extensions.push(entry);
        } else if (hasGlobSyntax(pattern)) {
            globs.push(entry);
        } else {
            exact.push(entry);
        }
    }

    // Sort globs by number of slashes (descending) — more slashes = more specific
    globs.sort(([a], [b]) => b.split('/').length - a.split('/').length);

    // Check exact paths first, then globs (most specific first), then extensions
    for (const [pattern, encoding] of [...exact, ...globs, ...extensions]) {
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
