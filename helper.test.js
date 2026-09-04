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

test('switching extension removes the stale file', async () => {
  await inTempDir(async (dir) => {
    await generateHelper('parseQuery', { jsx: true });
    await generateHelper('parseQuery', { tsx: true });
    const base = path.join(dir, 'helpers');
    await fs.access(path.join(base, 'parseQuery.tsx'));
    await assert.rejects(fs.access(path.join(base, 'parseQuery.jsx')));
  });
});
