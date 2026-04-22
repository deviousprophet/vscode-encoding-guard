import * as fs from 'fs';

export function detectEncoding(buffer: Buffer): string {
    if (!buffer) { buffer = Buffer.alloc(0); }

    // BOM checks
    if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        return 'utf8-bom';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        return 'utf16le';
    }
    if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        return 'utf16be';
    }

    if (buffer.length === 0) { return 'utf8'; }

    // Heuristic: many NUL bytes => binary (check early so large NUL blobs don't "round-trip" as UTF-8)
    let zeroCount = 0;
    for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0) { zeroCount++; }
    }
    if (buffer.length > 0 && zeroCount / buffer.length > 0.3) { return 'binary'; }

    // Heuristic: try round-trip UTF-8 decode/encode and look for replacement chars
    try {
        const text = buffer.toString('utf8');
        if (!text.includes('\uFFFD')) {
            const recon = Buffer.from(text, 'utf8');
            if (recon.equals(buffer)) { return 'utf8'; }
        }
    } catch (e) {
        // fall through
    }

    // Default to single-byte encodings (latin1/windows-1252)
    return 'latin1';
}

export function detectEncodingFromFile(filePath: string): string {
    const buf = fs.readFileSync(filePath);
    return detectEncoding(buf);
}

export default detectEncoding;
