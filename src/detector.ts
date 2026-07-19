import { detectBom } from './xml';

// Re-export public XML/BOM API so existing imports keep working.
export { XML_DECLARATION_SCAN_BYTES, detectBom, detectXmlDeclaration, startsWithXmlPreamble } from './xml';

function countBytes(buf: Buffer, value: number): number {
    let count = 0;
    for (const byte of buf) {
        if (byte === value) {
            count += 1;
        }
    }
    return count;
}

function isBinary(buf: Buffer): boolean {
    return countBytes(buf, 0) / buf.length > 0.3;
}

function isUtf8RoundTrip(buf: Buffer): boolean {
    const text = buf.toString('utf8');
    return !text.includes('\uFFFD') && Buffer.from(text, 'utf8').equals(buf);
}

function detectEmpty(buf: Buffer): string | null {
    return buf.length === 0 ? 'utf8' : null;
}

function detectBinary(buf: Buffer): string | null {
    return isBinary(buf) ? 'binary' : null;
}

function detectUtf8(buf: Buffer): string | null {
    try {
        return isUtf8RoundTrip(buf) ? 'utf8' : null;
    } catch {
        return null;
    }
}

const ENCODING_DETECTORS = [detectBom, detectEmpty, detectBinary, detectUtf8];

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
    return ENCODING_DETECTORS
        .map(detector => detector(buf))
        .find((encoding): encoding is string => encoding !== null) ?? 'latin1';
}
