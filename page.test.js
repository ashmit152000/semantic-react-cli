import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generatePage } from './page.js';

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

test('creates a Pages Router file by default', async () => {
  await inTempDir(async (dir) => {
    await generatePage('about', { tsx: true });
    const base = path.join(dir, 'pages');
    const tsx = await fs.readFile(path.join(base, 'about.tsx'), 'utf8');
    assert.match(tsx, /export default function about\(\)/);
  });
});

test('defaults to a .js extension when no option is passed', async () => {
  await inTempDir(async (dir) => {
    await generatePage('contact');
    const base = path.join(dir, 'pages');
    await fs.access(path.join(base, 'contact.js'));
  });
});

test('creates an App Router route segment when --app is passed', async () => {
  await inTempDir(async (dir) => {
    await generatePage('about', { app: true, tsx: true });
    const base = path.join(dir, 'app', 'about');
    const tsx = await fs.readFile(path.join(base, 'page.tsx'), 'utf8');
    assert.match(tsx, /export default function Page\(\)/);
  });
});

test('App Router mode defaults to the "app" folder while Pages Router uses "pages"', async () => {
  await inTempDir(async (dir) => {
    await generatePage('about', { app: true });
    await generatePage('contact');
    await fs.access(path.join(dir, 'app', 'about', 'page.js'));
    await fs.access(path.join(dir, 'pages', 'contact.js'));
  });
});

test('switching extension removes the stale file when confirmed (Pages Router)', async () => {
  await inTempDir(async (dir) => {
    await generatePage('pricing', { jsx: true });
    await generatePage('pricing', { tsx: true }, undefined, async () => true);
    const base = path.join(dir, 'pages');
    await fs.access(path.join(base, 'pricing.tsx'));
    await assert.rejects(fs.access(path.join(base, 'pricing.jsx')));
  });
});

test('switching extension keeps the stale file when not confirmed (App Router)', async () => {
  await inTempDir(async (dir) => {
    await generatePage('pricing', { app: true, jsx: true });
    await generatePage('pricing', { app: true, tsx: true }, undefined, async () => false);
    const base = path.join(dir, 'app', 'pricing');
    await fs.access(path.join(base, 'page.tsx'));
    await fs.access(path.join(base, 'page.jsx'));
  });
});

test('writes into a custom destination path when one is given', async () => {
  await inTempDir(async (dir) => {
    await generatePage('about', { app: true, tsx: true }, 'src/app');
    const base = path.join(dir, 'src', 'app', 'about');
    const tsx = await fs.readFile(path.join(base, 'page.tsx'), 'utf8');
    assert.match(tsx, /export default function Page\(\)/);
  });
});
