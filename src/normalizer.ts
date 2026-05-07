/**
 * Normalizes encoding name strings (from XML declarations, config values, etc.)
 * to VS Code encoding identifiers.
 *
 * VS Code accepts identifiers like: utf8, utf8bom, utf16le, utf16be,
 * latin1, windows1252, iso88591, shiftjis, etc.
 */

// Lookup keyed by the stripped/lowercased encoding name (no hyphens, underscores, spaces).
const ENCODING_MAP: Record<string, string> = {
    // UTF-8
    'utf8':       'utf8',
    'utf08':      'utf8',

    // UTF-8 with BOM
    'utf8bom':    'utf8bom',
    'utf8withbom':'utf8bom',

    // UTF-16
    'utf16le':    'utf16le',
    'utf1716le':  'utf16le', // typo guard
    'utf16be':    'utf16be',
    'utf16':      'utf16le', // assume LE for bare UTF-16

    // Latin-1 / ISO-8859-1
    'latin1':     'latin1',
    'latin01':    'latin1',
    'iso88591':   'latin1',
    'iso8859':    'latin1',
    'iso88590':   'latin1',  // some tools omit the trailing digit

    // ISO-8859-2 through ISO-8859-15
    'iso88592':   'iso88592',
    'iso88593':   'iso88593',
    'iso88594':   'iso88594',
    'iso88595':   'iso88595',
    'iso88596':   'iso88596',
    'iso88597':   'iso88597',
    'iso88598':   'iso88598',
    'iso88599':   'iso88599',
    'iso885910':  'iso885910',
    'iso885911':  'iso885911',
    'iso885913':  'iso885913',
    'iso885914':  'iso885914',
    'iso885915':  'iso885915',

    // Windows code pages
    'windows1250': 'windows1250',
    'cp1250':      'windows1250',
    'windows1251': 'windows1251',
    'cp1251':      'windows1251',
    'windows1252': 'windows1252',
    'cp1252':      'windows1252',
    'ansi':        'windows1252',
    'windows1253': 'windows1253',
    'cp1253':      'windows1253',
    'windows1254': 'windows1254',
    'cp1254':      'windows1254',
    'windows1255': 'windows1255',
    'cp1255':      'windows1255',
    'windows1256': 'windows1256',
    'cp1256':      'windows1256',
    'windows1257': 'windows1257',
    'cp1257':      'windows1257',
    'windows1258': 'windows1258',
    'cp1258':      'windows1258',

    // East Asian
    'shiftjis':    'shiftjis',
    'sjis':        'shiftjis',
    'shiftjis2004':'shiftjis',
    'gb2312':      'gb2312',
    'gbk':         'gbk',
    'gb18030':     'gb18030',
    'big5':        'big5hkscs',
    'big5hkscs':   'big5hkscs',

    // KOI-8
    'koi8r':       'koi8r',
    'koi8u':       'koi8u',

    // Mac / other
    'macroman':    'macroman',
};

/**
 * Returns the stripped/lowercased key used for map lookup.
 * Removes hyphens, underscores, and spaces.
 */
function toKey(raw: string): string {
    return raw.toLowerCase().replace(/[-_\s]/g, '');
}

/**
 * Normalizes an encoding name to a VS Code encoding identifier.
 * If the name is unknown, returns it lowercased with hyphens/underscores removed
 * so it can still be compared consistently.
 */
export function normalizeEncoding(raw: string): string {
    const key = toKey(raw);
    return ENCODING_MAP[key] ?? key;
}
