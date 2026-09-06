import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateHelper } from './helper.js';

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

test('creates a helper file', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('formatDate', { jsx: true });
    const base = path.join(dir, 'helpers');
    const jsx = await fs.readFile(path.join(base, 'formatDate.jsx'), 'utf8');
    assert.match(jsx, /export default function formatDate\(\)/);
  });
});

test('defaults to a .js extension when no option is passed', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('sum');
    const base = path.join(dir, 'helpers');
    await fs.access(path.join(base, 'sum.js'));
  });
});

test('switching extension removes the stale file when confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('parseQuery', { jsx: true });
    await generateHelper('parseQuery', { tsx: true }, undefined, async () => true);
    const base = path.join(dir, 'helpers');
    await fs.access(path.join(base, 'parseQuery.tsx'));
    await assert.rejects(fs.access(path.join(base, 'parseQuery.jsx')));
  });
});

test('switching extension keeps the stale file when not confirmed', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('slugify', { jsx: true });
    await generateHelper('slugify', { tsx: true }, undefined, async () => false);
    const base = path.join(dir, 'helpers');
    await fs.access(path.join(base, 'slugify.tsx'));
    await fs.access(path.join(base, 'slugify.jsx'));
  });
});

test('writes into a custom destination path when one is given', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('formatDate', { ts: true }, 'src/lib/utils');
    const base = path.join(dir, 'src', 'lib', 'utils');
    const ts = await fs.readFile(path.join(base, 'formatDate.ts'), 'utf8');
    assert.match(ts, /export default function formatDate\(\)/);
  });
});
