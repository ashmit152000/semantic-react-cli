import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { moveFile } from './move.js';

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

const yes = async () => true;
const no = async () => false;
const askJsx = async () => 'jsx';

test('moves a file, creating the destination folder', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button.jsx'), 'button\n');

    await moveFile('components/Button.jsx', 'ui/Button.jsx', no, askJsx);

    const moved = await fs.readFile(path.join(dir, 'ui', 'Button.jsx'), 'utf8');
    assert.equal(moved, 'button\n');
    await assert.rejects(fs.access(path.join(dir, 'components', 'Button.jsx')));
  });
});

test('reports when the source file is missing', async () => {
  await inTempDir(async (dir) => {
    await moveFile('components/Nope.jsx', 'ui/Nope.jsx', no, askJsx);
    await assert.rejects(fs.access(path.join(dir, 'ui', 'Nope.jsx')));
  });
});

test('overwrites the target only when confirmed', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'a'), { recursive: true });
    await fs.mkdir(path.join(dir, 'b'), { recursive: true });
    await fs.writeFile(path.join(dir, 'a', 'X.jsx'), 'new\n');
    await fs.writeFile(path.join(dir, 'b', 'X.jsx'), 'old\n');

    await moveFile('a/X.jsx', 'b/X.jsx', no, askJsx);
    assert.equal(await fs.readFile(path.join(dir, 'b', 'X.jsx'), 'utf8'), 'old\n');
    await fs.access(path.join(dir, 'a', 'X.jsx'));

    await moveFile('a/X.jsx', 'b/X.jsx', yes, askJsx);
    assert.equal(await fs.readFile(path.join(dir, 'b', 'X.jsx'), 'utf8'), 'new\n');
    await assert.rejects(fs.access(path.join(dir, 'a', 'X.jsx')));
  });
});

test('prompts for the extension when the source path omits it', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button.jsx'), 'button\n');

    // destination also omits the extension -> reuses the source's
    await moveFile('components/Button', 'ui/Button', no, askJsx);

    await fs.access(path.join(dir, 'ui', 'Button.jsx'));
    await assert.rejects(fs.access(path.join(dir, 'components', 'Button.jsx')));
  });
});

test('moves into an existing directory keeping the file name', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components'), { recursive: true });
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button.tsx'), 'x\n');

    await moveFile('components/Button.tsx', 'ui', no, askJsx);

    await fs.access(path.join(dir, 'ui', 'Button.tsx'));
  });
});

test('refuses to move a file out of the project', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button.jsx'), 'x\n');

    await moveFile('components/Button.jsx', '../Button.jsx', no, askJsx);

    await fs.access(path.join(dir, 'components', 'Button.jsx'));
    await assert.rejects(fs.access(path.join(dir, '..', 'Button.jsx')));
  });
});

test('refuses to move a file in from outside the project', async () => {
  await inTempDir(async (dir) => {
    const outside = path.join(dir, '..', `outside-${path.basename(dir)}.jsx`);
    await fs.writeFile(outside, 'x\n');
    try {
      await moveFile(outside, 'components/Button.jsx', no, askJsx);
      await assert.rejects(fs.access(path.join(dir, 'components', 'Button.jsx')));
      await fs.access(outside);
    } finally {
      await fs.rm(outside, { force: true });
    }
  });
});

test('fills in the destination extension from the source', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button.tsx'), 'x\n');

    await moveFile('components/Button.tsx', 'ui/Renamed', no, askJsx);

    await fs.access(path.join(dir, 'ui', 'Renamed.tsx'));
  });
});

test('moves the colocated css file along with the component, matching the new name', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'PrimaryBtn'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'PrimaryBtn', 'PrimaryBtn.jsx'), 'btn\n');
    await fs.writeFile(path.join(dir, 'components', 'PrimaryBtn', 'PrimaryBtn.css'), '.btn{}\n');

    await moveFile('components/PrimaryBtn/PrimaryBtn.jsx', 'ui/Button', no, askJsx);

    await fs.access(path.join(dir, 'ui', 'Button.jsx'));
    await fs.access(path.join(dir, 'ui', 'Button.css'));
    // source folder was emptied and removed
    await assert.rejects(fs.access(path.join(dir, 'components', 'PrimaryBtn')));
  });
});

test('keeps the css when a file already exists at its target', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Card'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Card', 'Card.jsx'), 'card\n');
    await fs.writeFile(path.join(dir, 'components', 'Card', 'Card.css'), 'new\n');
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'ui', 'Card.css'), 'old\n');

    await moveFile('components/Card/Card.jsx', 'ui/Card.jsx', no, askJsx);

    await fs.access(path.join(dir, 'ui', 'Card.jsx'));
    assert.equal(await fs.readFile(path.join(dir, 'ui', 'Card.css'), 'utf8'), 'old\n');
    await fs.access(path.join(dir, 'components', 'Card', 'Card.css'));
  });
});

test('does not move the css when the main-file overwrite is declined', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Card'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Card', 'Card.jsx'), 'new\n');
    await fs.writeFile(path.join(dir, 'components', 'Card', 'Card.css'), '.card{}\n');
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'ui', 'Card.jsx'), 'old\n');

    await moveFile('components/Card/Card.jsx', 'ui/Card.jsx', no, askJsx);

    assert.equal(await fs.readFile(path.join(dir, 'ui', 'Card.jsx'), 'utf8'), 'old\n');
    await fs.access(path.join(dir, 'components', 'Card', 'Card.jsx'));
    await fs.access(path.join(dir, 'components', 'Card', 'Card.css'));
    await assert.rejects(fs.access(path.join(dir, 'ui', 'Card.css')));
  });
});
