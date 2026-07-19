import { normalizeEncoding } from './normalizer';

export const XML_DECLARATION_SCAN_BYTES = 64 * 1024;

const ASCII_XML_PREAMBLE = [0x3C, 0x3F, 0x78, 0x6D, 0x6C];

function hasUtf8Bom(buf: Buffer): boolean {
    return buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

function hasUtf16LeBom(buf: Buffer): boolean {
    return buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE;
}

function hasUtf16BeBom(buf: Buffer): boolean {
    return buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF;
}

function isAsciiWhitespace(byte: number): boolean {
    return byte === 0x20 || byte === 0x09 || byte === 0x0D || byte === 0x0A;
}

function firstNonWhitespaceOffset(buf: Buffer, start: number): number {
    let offset = start;
    while (offset < buf.length && isAsciiWhitespace(buf[offset])) {
        offset += 1;
    }
    return offset;
}

function startsWithAsciiXml(buf: Buffer, offset: number): boolean {
    return ASCII_XML_PREAMBLE.every((byte, index) => (buf[offset + index] | 0x20) === byte);
}

function isUtf16BomEncoding(encoding: string | null): boolean {
    return encoding === 'utf16le' || encoding === 'utf16be';
}

function hasCompleteXmlPreamble(buf: Buffer, offset: number): boolean {
    return offset + ASCII_XML_PREAMBLE.length <= buf.length && startsWithAsciiXml(buf, offset);
}

/**
 * Fast byte-level check for an XML preamble near the start of a file.
 *
 * Skips BOM and leading ASCII whitespace, then checks for "<?xml".
 * This allows callers to decide whether a larger header read is worthwhile
 * without relying on file extension or VS Code language classification.
 */
export function startsWithXmlPreamble(buf: Buffer): boolean {
    const bom = detectBom(buf);
    if (isUtf16BomEncoding(bom)) {
        // UTF-16 BOM exists. We do not attempt a UTF-16 token scan here;
        // return true so callers can perform a larger read + full parse.
        return true;
    }

    const offset = firstNonWhitespaceOffset(buf, bom === 'utf8bom' ? 3 : 0);
    return hasCompleteXmlPreamble(buf, offset);
}

/**
 * Returns the encoding derived from the BOM at the start of `buf`,
 * or null if no BOM is present.
 */
export function detectBom(buf: Buffer): string | null {
    if (hasUtf8Bom(buf)) { return 'utf8bom'; }
    if (hasUtf16LeBom(buf)) { return 'utf16le'; }
    if (hasUtf16BeBom(buf)) { return 'utf16be'; }
    return null;
}

/**
 * Attempts to extract the encoding declared inside an XML/ARXML processing
 * instruction, e.g. <?xml version="1.0" encoding="ISO-8859-1"?>.
 *
 * Reads only the first `XML_DECLARATION_SCAN_BYTES` bytes of `buf` for performance.
 * Returns a normalized VS Code encoding identifier, or null if not found.
 */
export function detectXmlDeclaration(buf: Buffer): string | null {
    if (buf.length === 0) { return null; }

    const header = decodeXmlHeader(buf);
    const match = header.match(/<\?xml[^?]*encoding\s*=\s*["']([^"']+)["']/i);
    if (!match) { return null; }

    return normalizeEncoding(match[1]);
}

function decodeXmlHeader(buf: Buffer): string {
    const bom = detectBom(buf);
    const end = Math.min(buf.length, XML_DECLARATION_SCAN_BYTES);

    if (bom === 'utf16le') {
        return buf.subarray(2, end).toString('utf16le');
    }

    if (bom === 'utf16be') {
        return decodeUtf16Be(buf.subarray(2, end));
    }

    return buf.subarray(0, end).toString('latin1');
}

function decodeUtf16Be(buf: Buffer): string {
    const swapped = Buffer.alloc(buf.length & ~1);
    for (let i = 0; i + 1 < buf.length; i += 2) {
        swapped[i] = buf[i + 1];
        swapped[i + 1] = buf[i];
    }
    return swapped.toString('utf16le');
}
