import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import readJsonFile from './json-reader.js';
import defaultOptions from './default.js';

async function inTempDir(fn) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'semantic-react-'));
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    await fn(dir);
  } finally {
    process.chdir(cwd);
    await fs.rm(dir, { recursive: true, force: true });
  }
}

test('returns the defaults when the settings file is missing', async () => {
  await inTempDir(async () => {
    const paths = await readJsonFile('./semantic-react.settings.json');
    assert.deepEqual(paths, defaultOptions);
  });
});

test('overrides only the keys present in the settings file', async () => {
  await inTempDir(async () => {
    await fs.writeFile(
      './semantic-react.settings.json',
      JSON.stringify({ components: 'src/components' })
    );
    const paths = await readJsonFile('./semantic-react.settings.json');
    assert.equal(paths.components, 'src/components');
    assert.equal(paths.helpers, defaultOptions.helpers);
    assert.equal(paths.hooks, defaultOptions.hooks);
  });
});

test('ignores unknown keys in the settings file', async () => {
  await inTempDir(async () => {
    await fs.writeFile(
      './semantic-react.settings.json',
      JSON.stringify({ hooks: 'src/hooks', somethingElse: 'nope' })
    );
    const paths = await readJsonFile('./semantic-react.settings.json');
    assert.equal(paths.hooks, 'src/hooks');
    assert.equal(paths.somethingElse, undefined);
  });
});

test('throws on malformed JSON', async () => {
  await inTempDir(async () => {
    await fs.writeFile('./semantic-react.settings.json', '{ not valid json');
    await assert.rejects(readJsonFile('./semantic-react.settings.json'));
  });
});
