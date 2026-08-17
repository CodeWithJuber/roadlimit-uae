#!/usr/bin/env node

import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(
    entries
      .filter((entry) => !['.git', 'node_modules', 'android', 'ios'].includes(entry.name))
      .map(async (entry) => {
        const path = resolve(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
      }),
  );
  return paths.flat();
};

const files = await walk(root);
const markdownFiles = files.filter((path) => extname(path) === '.md');
const yamlFiles = files.filter(
  (path) => ['.yml', '.yaml', '.cff'].includes(extname(path)),
);

for (const path of yamlFiles) {
  try {
    parse(await readFile(path, 'utf8'));
  } catch (error) {
    errors.push(`${relative(root, path)}: invalid YAML (${error.message})`);
  }
}

for (const path of markdownFiles) {
  const markdown = await readFile(path, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1]?.trim() ?? '';
    if (!href || /^(?:https?:|mailto:|#)/i.test(href)) continue;
    const localPath = resolve(dirname(path), href.split('#')[0]);
    try {
      await access(localPath);
    } catch {
      errors.push(`${relative(root, path)}: missing local link ${href}`);
    }
  }
}

const requiredFiles = [
  'README.md',
  'LICENSE',
  'NOTICE',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'PRIVACY.md',
  'DATA_LICENSE.md',
  'CODE_OF_CONDUCT.md',
  'SUPPORT.md',
  'CHANGELOG.md',
  'CITATION.cff',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/ISSUE_TEMPLATE/question.yml',
  '.github/ISSUE_TEMPLATE/road_limit_correction.yml',
];

for (const path of requiredFiles) {
  try {
    await access(resolve(root, path));
  } catch {
    errors.push(`missing required repository file: ${path}`);
  }
}

try {
  const citation = parse(await readFile(resolve(root, 'CITATION.cff'), 'utf8'));
  for (const field of ['cff-version', 'message', 'title', 'type', 'license', 'repository-code']) {
    if (!citation?.[field]) errors.push(`CITATION.cff: missing ${field}`);
  }
} catch {
  // The YAML parse error above already reports malformed citation metadata.
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Repository metadata OK: ${markdownFiles.length} Markdown files, ${yamlFiles.length} YAML/CFF files.`,
  );
}
