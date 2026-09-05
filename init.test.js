import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateSettings, SETTINGS_FILE } from './init.js';
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

test('creates a settings file with the default paths', async () => {
  await inTempDir(async (dir) => {
    const created = await generateSettings();
    assert.equal(created, true);
    const raw = await fs.readFile(path.join(dir, SETTINGS_FILE), 'utf8');
    assert.deepEqual(JSON.parse(raw), defaultOptions);
    assert.match(raw, /\n$/);
  });
});

test('does not overwrite an existing settings file', async () => {
  await inTempDir(async (dir) => {
    const custom = JSON.stringify({ components: 'src/components' });
    await fs.writeFile(path.join(dir, SETTINGS_FILE), custom);

    const created = await generateSettings();
    assert.equal(created, false);
    const raw = await fs.readFile(path.join(dir, SETTINGS_FILE), 'utf8');
    assert.equal(raw, custom);
  });
});

test('overwrites an existing settings file when --force is passed', async () => {
  await inTempDir(async (dir) => {
    await fs.writeFile(
      path.join(dir, SETTINGS_FILE),
      JSON.stringify({ components: 'src/components' })
    );

    const created = await generateSettings({ force: true });
    assert.equal(created, true);
    const raw = await fs.readFile(path.join(dir, SETTINGS_FILE), 'utf8');
    assert.deepEqual(JSON.parse(raw), defaultOptions);
  });
});
