#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_OUTPUT = 'local-data/dubai-road-rules.json';
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const USAGE = [
  'Usage: npm run data:import -- <licensed-source.csv>',
  '  --source-url <https://source.example/data>',
  '  --license <SPDX-id-or-permission-reference>',
  '  [--output local-data/review.json]',
].join(' \\\n');

const args = process.argv.slice(2);
let inputArg = null;
let outputArg = DEFAULT_OUTPUT;
let sourceUrlArg = null;
let licenseArg = null;

const takeValue = (flag, index) => {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.\n\n${USAGE}`);
  }
  return value;
};

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === '--source-url') {
    sourceUrlArg = takeValue(argument, index);
    index += 1;
  } else if (argument === '--license') {
    licenseArg = takeValue(argument, index);
    index += 1;
  } else if (argument === '--output') {
    outputArg = takeValue(argument, index);
    index += 1;
  } else if (argument?.startsWith('--')) {
    throw new Error(`Unknown option: ${argument}\n\n${USAGE}`);
  } else if (!inputArg) {
    inputArg = argument ?? null;
  } else {
    throw new Error(`Unexpected positional argument: ${argument}\n\n${USAGE}`);
  }
}

if (!inputArg || !sourceUrlArg || !licenseArg) {
  console.error(`Input, --source-url, and --license are required.\n\n${USAGE}`);
  process.exitCode = 1;
} else {
  let sourceUrl;
  try {
    sourceUrl = new URL(sourceUrlArg);
  } catch {
    throw new Error('--source-url must be a valid HTTPS URL.');
  }
  if (sourceUrl.protocol !== 'https:') {
    throw new Error('--source-url must use HTTPS.');
  }

  const licenseIdentifier = licenseArg.trim();
  if (
    !licenseIdentifier ||
    /^(unknown|unspecified|none|n\/a)$/i.test(licenseIdentifier)
  ) {
    throw new Error(
      '--license must identify an applicable licence or written-permission reference; placeholders are rejected.',
    );
  }

  const localDataRoot = resolve(REPOSITORY_ROOT, 'local-data');
  const output = isAbsolute(outputArg)
    ? resolve(outputArg)
    : resolve(REPOSITORY_ROOT, outputArg);
  const relativeOutput = relative(localDataRoot, output);
  const outputEscapesLocalData =
    relativeOutput === '' ||
    relativeOutput === '..' ||
    relativeOutput.startsWith(`..${sep}`) ||
    isAbsolute(relativeOutput);
  if (outputEscapesLocalData) {
    throw new Error(`Output must be a JSON file inside ${localDataRoot}.`);
  }
  if (!output.toLowerCase().endsWith('.json')) {
    throw new Error('Output must use the .json extension.');
  }

  const requireRealDirectory = async (directory) => {
    let status;
    try {
      status = await lstat(directory);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
      try {
        await mkdir(directory);
      } catch (mkdirError) {
        if (mkdirError?.code !== 'EEXIST') {
          throw mkdirError;
        }
      }
      status = await lstat(directory);
    }
    if (status.isSymbolicLink() || !status.isDirectory()) {
      throw new Error('Output path must not contain symlinks or non-directory components.');
    }
  };

  await mkdir(localDataRoot, { recursive: true });
  await requireRealDirectory(localDataRoot);
  const outputDirectory = dirname(output);
  const relativeOutputDirectory = relative(localDataRoot, outputDirectory);
  let checkedDirectory = localDataRoot;
  for (const component of relativeOutputDirectory.split(sep).filter(Boolean)) {
    checkedDirectory = resolve(checkedDirectory, component);
    await requireRealDirectory(checkedDirectory);
  }

  try {
    const outputStatus = await lstat(output);
    if (outputStatus.isSymbolicLink() || !outputStatus.isFile()) {
      throw new Error('Output must be a regular JSON file, not a symlink or special file.');
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  const parseCsvLine = (line) => {
    const cells = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      if (character === '"' && line[index + 1] === '"' && quoted) {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        cells.push(value.trim());
        value = '';
      } else {
        value += character;
      }
    }
    cells.push(value.trim());
    return cells;
  };

  const inputPath = resolve(inputArg);
  const inputBytes = await readFile(inputPath);
  const inputSha256 = createHash('sha256').update(inputBytes).digest('hex');
  const text = inputBytes.toString('utf8');
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() ?? '').map((value) => value.toLowerCase());
  const indexOf = (...names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
  const streetIndex = indexOf('street', 'road');
  const speedIndex = indexOf('speed_limit', 'road_speed', 'speed');
  const radarIndex = indexOf('radar_limit', 'radar_control');
  const updateIndex = indexOf('update_date', 'updated_at');

  if (streetIndex < 0 || speedIndex < 0) {
    throw new Error('CSV must contain street and speed_limit (or compatible) columns.');
  }

  const records = lines.map(parseCsvLine).map((row, index) => ({
    sourceRow: index + 2,
    street: row[streetIndex],
    speedLimitKmh: Number(row[speedIndex]),
    radarControlKmh: radarIndex >= 0 && row[radarIndex] ? Number(row[radarIndex]) : null,
    sourceUpdatedAt: updateIndex >= 0 ? row[updateIndex] || null : null,
    reviewStatus: 'unverified',
    geometry: null,
  }));

  const invalid = records.filter((record) => {
    const invalidPostedLimit =
      !record.street || !Number.isFinite(record.speedLimitKmh) || record.speedLimitKmh <= 0;
    const invalidRadarControl =
      record.radarControlKmh !== null &&
      (!Number.isFinite(record.radarControlKmh) || record.radarControlKmh <= 0);
    return invalidPostedLimit || invalidRadarControl;
  });
  if (invalid.length) {
    throw new Error(`Rejected ${invalid.length} invalid row(s).`);
  }

  const serializedOutput = `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: {
        url: sourceUrl.toString(),
        licenseIdentifier,
        inputFileName: basename(inputPath),
        checksum: {
          algorithm: 'SHA-256',
          value: inputSha256,
        },
      },
      redistributionApproved: false,
      warning:
        'Local review artifact only. A recorded licence and checksum do not approve redistribution; verify permission, provenance, freshness, and segment geometry before use.',
      records,
    },
    null,
    2,
  )}\n`;
  const writeFlags =
    constants.O_WRONLY |
    constants.O_CREAT |
    constants.O_TRUNC |
    (constants.O_NOFOLLOW ?? 0);
  const outputHandle = await open(output, writeFlags, 0o600);
  try {
    await outputHandle.writeFile(serializedOutput, 'utf8');
  } finally {
    await outputHandle.close();
  }
  console.log(`Wrote ${records.length} unverified records to ${output}`);
}
