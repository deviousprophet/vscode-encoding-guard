import * as vscode from 'vscode';

interface EncodingItem extends vscode.QuickPickItem {
    id: string; // VS Code encoding identifier
}

/**
 * All encodings supported by Encoding Guard, suitable for display in a QuickPick.
 * Labels mirror the names shown in VS Code's own encoding picker.
 */
const ENCODING_LIST: EncodingItem[] = [
    // Unicode
    { id: 'utf8',       label: 'UTF-8',                     description: 'utf8' },
    { id: 'utf8bom',    label: 'UTF-8 with BOM',            description: 'utf8bom' },
    { id: 'utf16le',    label: 'UTF-16 LE',                 description: 'utf16le' },
    { id: 'utf16be',    label: 'UTF-16 BE',                 description: 'utf16be' },

    // Western European
    { id: 'iso88591',   label: 'Western (ISO 8859-1)',      description: 'iso88591' },
    { id: 'iso88593',   label: 'Western (ISO 8859-3)',      description: 'iso88593' },
    { id: 'iso885915',  label: 'Western (ISO 8859-15)',     description: 'iso885915' },
    { id: 'windows1252',label: 'Western (Windows 1252)',    description: 'windows1252' },
    { id: 'macroman',   label: 'Western (Mac Roman)',       description: 'macroman' },

    // Central European
    { id: 'iso88592',   label: 'Central European (ISO 8859-2)',   description: 'iso88592' },
    { id: 'iso88594',   label: 'Baltic (ISO 8859-4)',             description: 'iso88594' },
    { id: 'iso885910',  label: 'Northern European (ISO 8859-10)', description: 'iso885910' },
    { id: 'iso885914',  label: 'Celtic (ISO 8859-14)',            description: 'iso885914' },
    { id: 'windows1250',label: 'Central European (Windows 1250)', description: 'windows1250' },

    // Cyrillic
    { id: 'iso88595',   label: 'Cyrillic (ISO 8859-5)',     description: 'iso88595' },
    { id: 'windows1251',label: 'Cyrillic (Windows 1251)',   description: 'windows1251' },
    { id: 'koi8r',      label: 'Cyrillic (KOI8-R)',         description: 'koi8r' },
    { id: 'koi8u',      label: 'Cyrillic (KOI8-U)',         description: 'koi8u' },

    // Arabic
    { id: 'iso88596',   label: 'Arabic (ISO 8859-6)',       description: 'iso88596' },
    { id: 'windows1256',label: 'Arabic (Windows 1256)',     description: 'windows1256' },

    // Greek
    { id: 'iso88597',   label: 'Greek (ISO 8859-7)',        description: 'iso88597' },
    { id: 'windows1253',label: 'Greek (Windows 1253)',      description: 'windows1253' },

    // Hebrew
    { id: 'iso88598',   label: 'Hebrew (ISO 8859-8)',       description: 'iso88598' },
    { id: 'windows1255',label: 'Hebrew (Windows 1255)',     description: 'windows1255' },

    // Turkish
    { id: 'iso88599',   label: 'Turkish (ISO 8859-9)',      description: 'iso88599' },
    { id: 'windows1254',label: 'Turkish (Windows 1254)',    description: 'windows1254' },

    // Baltic
    { id: 'iso885913',  label: 'Baltic (ISO 8859-13)',      description: 'iso885913' },
    { id: 'iso885911',  label: 'Thai (ISO 8859-11)',        description: 'iso885911' },
    { id: 'windows1257',label: 'Baltic (Windows 1257)',     description: 'windows1257' },
    { id: 'windows1258',label: 'Vietnamese (Windows 1258)', description: 'windows1258' },

    // East Asian
    { id: 'shiftjis',   label: 'Japanese (Shift JIS)',      description: 'shiftjis' },
    { id: 'gb2312',     label: 'Chinese Simplified (GB 2312)', description: 'gb2312' },
    { id: 'gbk',        label: 'Chinese Simplified (GBK)',  description: 'gbk' },
    { id: 'gb18030',    label: 'Chinese Simplified (GB 18030)', description: 'gb18030' },
    { id: 'big5hkscs',  label: 'Chinese Traditional (Big5 HKSCS)', description: 'big5hkscs' },
];

/**
 * Shows an encoding QuickPick and returns the selected VS Code encoding ID,
 * or undefined if the user cancelled.
 */
export async function pickEncoding(currentId?: string): Promise<string | undefined> {
    const items: EncodingItem[] = ENCODING_LIST.map(item => ({
        ...item,
        picked: item.id === currentId,
    }));

    // Move the current encoding to the top if it exists
    if (currentId) {
        const idx = items.findIndex(i => i.id === currentId);
        if (idx > 0) {
            items.unshift(...items.splice(idx, 1));
        }
    }

    const picked = await vscode.window.showQuickPick(items, {
        title: 'Select Encoding',
        matchOnDescription: true,
        placeHolder: 'Search encoding…',
    });

    return picked?.id;
}
