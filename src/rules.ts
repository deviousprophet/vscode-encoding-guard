import * as vscode from 'vscode';

export interface EncodingRule {
  glob: string;
  encoding: string;
}

function escapeRegex(s: string) {
  return s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
}

function globToRegExp(glob: string): RegExp {
  // Basic glob -> regex: ** -> .*, * -> [^/\\]*, ? -> .
  let regex = '';
  let i = 0;
  while (i < glob.length) {
    if (glob[i] === '*') {
      if (glob[i + 1] === '*') {
        regex += '.*';
        i += 2;
        continue;
      }
      regex += '[^/\\]*';
      i++;
      continue;
    }
    if (glob[i] === '?') {
      regex += '.';
      i++;
      continue;
    }
    regex += escapeRegex(glob[i]);
    i++;
  }
  return new RegExp('^' + regex + '$');
}

export function getConfiguredRules(): EncodingRule[] {
  const cfg = vscode.workspace.getConfiguration('encodex');
  const raw = cfg.get<any[]>('rules') || [];
  const rules: EncodingRule[] = [];
  for (const r of raw) {
    if (r && typeof r.glob === 'string' && typeof r.encoding === 'string') {
      rules.push({ glob: r.glob, encoding: r.encoding });
    }
  }
  return rules;
}

export function matchRuleForPath(fsPath: string): EncodingRule | undefined {
  // Try workspace relative paths first
  const ws = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0];
  let rel = fsPath;
  if (ws) {
    try {
      rel = vscode.workspace.asRelativePath(fsPath, false);
    } catch (e) {
      rel = fsPath;
    }
  }

  const rules = getConfiguredRules();
  for (const r of rules) {
    const re = globToRegExp(r.glob);
    if (re.test(rel) || re.test(fsPath)) {
      return r;
    }
  }
  return undefined;
}
