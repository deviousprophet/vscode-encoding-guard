import * as iconv from 'iconv-lite';

const VSCODE_TO_ICONV: Record<string, string> = {
    utf8: 'utf-8',
    utf8bom: 'utf-8',
    utf16le: 'utf-16le',
    utf16be: 'utf-16be',
    iso88591: 'iso-8859-1',
    iso88592: 'iso-8859-2',
    iso88593: 'iso-8859-3',
    iso88594: 'iso-8859-4',
    iso88595: 'iso-8859-5',
    iso88596: 'iso-8859-6',
    iso88597: 'iso-8859-7',
    iso88598: 'iso-8859-8',
    iso88599: 'iso-8859-9',
    iso885910: 'iso-8859-10',
    iso885911: 'iso-8859-11',
    iso885913: 'iso-8859-13',
    iso885914: 'iso-8859-14',
    iso885915: 'iso-8859-15',
    windows1250: 'windows-1250',
    windows1251: 'windows-1251',
    windows1252: 'windows-1252',
    windows1253: 'windows-1253',
    windows1254: 'windows-1254',
    windows1255: 'windows-1255',
    windows1256: 'windows-1256',
    windows1257: 'windows-1257',
    windows1258: 'windows-1258',
    shiftjis: 'shift_jis',
    gb2312: 'gb2312',
    gbk: 'gbk',
    gb18030: 'gb18030',
    big5hkscs: 'big5',
    koi8r: 'koi8-r',
    koi8u: 'koi8-u',
    macroman: 'macintosh',
};

const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

const BOM_TABLE: [number[], string][] = [
    [[0xEF, 0xBB, 0xBF], 'utf8bom'],
    [[0xFF, 0xFE], 'utf16le'],
    [[0xFE, 0xFF], 'utf16be'],
];

function toIconvEncoding(vscodeEnc: string): string | undefined {
    return VSCODE_TO_ICONV[vscodeEnc];
}

function needsBom(vscodeEnc: string): Buffer | null {
    if (vscodeEnc === 'utf8bom') { return UTF8_BOM; }
    return null;
}

export function hasBom(buf: Buffer): string | null {
    for (const [bytes, enc] of BOM_TABLE) {
        if (buf.length >= bytes.length && bytes.every((b, i) => buf[i] === b)) {
            return enc;
        }
    }
    return null;
}

export function convertBuffer(buf: Buffer, fromEnc: string, toEnc: string): Buffer {
    const iconvFrom = toIconvEncoding(fromEnc) ?? fromEnc;
    const iconvTo = toIconvEncoding(toEnc) ?? toEnc;

    const str = iconv.decode(buf, iconvFrom);
    const result = iconv.encode(str, iconvTo);

    const bom = needsBom(toEnc);
    if (bom) {
        return Buffer.concat([bom, result]);
    }

    return result;
}
