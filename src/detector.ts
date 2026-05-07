import { normalizeEncoding } from './normalizer';

/**
 * Returns the encoding derived from the BOM at the start of `buf`,
 * or null if no BOM is present.
 */
export function detectBom(buf: Buffer): string | null {
    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
        return 'utf8bom';
    }
    if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
        return 'utf16le';
    }
    if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
        return 'utf16be';
    }
    return null;
}

/**
 * Attempts to extract the encoding declared inside an XML/ARXML processing
 * instruction, e.g. <?xml version="1.0" encoding="ISO-8859-1"?>.
 *
 * Reads only the first 1 KB of `buf` for performance.
 * Returns a normalized VS Code encoding identifier, or null if not found.
 */
export function detectXmlDeclaration(buf: Buffer): string | null {
    if (buf.length === 0) { return null; }

    // Decode the header into a string we can regex against.
    // For UTF-16 files we must handle the byte order before decoding.
    let header: string;
    const bom = detectBom(buf);

    if (bom === 'utf16le') {
        // Skip the 2-byte BOM, then decode as UTF-16 LE.
        const slice = buf.subarray(2, Math.min(buf.length, 1024));
        header = slice.toString('utf16le');
    } else if (bom === 'utf16be') {
        // Skip the 2-byte BOM, swap byte pairs, then decode as UTF-16 LE.
        const slice = buf.subarray(2, Math.min(buf.length, 1024));
        const swapped = Buffer.alloc(slice.length & ~1); // round down to even
        for (let i = 0; i + 1 < slice.length; i += 2) {
            swapped[i]     = slice[i + 1];
            swapped[i + 1] = slice[i];
        }
        header = swapped.toString('utf16le');
    } else {
        // ASCII / UTF-8 / single-byte — the declaration is always in the ASCII
        // range so latin1 decoding is safe and avoids losing bytes.
        header = buf.subarray(0, Math.min(buf.length, 1024)).toString('latin1');
    }

    // Match:  <?xml  ...  encoding="UTF-8"  ?>  (single or double quotes)
    const match = header.match(/<\?xml[^?]*encoding\s*=\s*["']([^"']+)["']/i);
    if (!match) { return null; }

    return normalizeEncoding(match[1]);
}

/**
 * Heuristic encoding detection from raw bytes.
 *
 * Priority:
 *  1. BOM (utf8bom / utf16le / utf16be)
 *  2. UTF-8 round-trip check
 *  3. Fallback: latin1
 *
 * Returns a VS Code encoding identifier.
 */
export function detectEncoding(buf: Buffer): string {
    const bom = detectBom(buf);
    if (bom) { return bom; }

    if (buf.length === 0) { return 'utf8'; }

    // Binary detection: more than 30 % NUL bytes.
    let nulCount = 0;
    for (let i = 0; i < buf.length; i++) {
        if (buf[i] === 0) { nulCount++; }
    }
    if (nulCount / buf.length > 0.3) { return 'binary'; }

    // UTF-8 round-trip: decode as UTF-8, re-encode, compare raw bytes.
    try {
        const text = buf.toString('utf8');
        if (!text.includes('\uFFFD')) {
            const reencoded = Buffer.from(text, 'utf8');
            if (reencoded.equals(buf)) { return 'utf8'; }
        }
    } catch {
        // fall through
    }

    return 'latin1';
}
