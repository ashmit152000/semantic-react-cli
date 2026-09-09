import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { renameComponent, renameHelper, renameHook, renameAtPath } from './rename.js';

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

test('renames a component file, its css, and the function when confirmed', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'components', 'Button', 'Button.jsx'),
      'export default function Button() {\n  // ...\n}\n'
    );
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.css'), '');

    await renameComponent('Button', 'PrimaryButton', {}, 'components', yes);

    const base = path.join(dir, 'components', 'PrimaryButton');
    const src = await fs.readFile(path.join(base, 'PrimaryButton.jsx'), 'utf8');
    assert.match(src, /export default function PrimaryButton\(\)/);
    await fs.access(path.join(base, 'PrimaryButton.css'));
    await assert.rejects(fs.access(path.join(dir, 'components', 'Button')));
  });
});

test('keeps the current extension when no flag is passed', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.tsx'), 'x\n');

    await renameComponent('Button', 'PrimaryButton', {}, 'components', no);

    await fs.access(path.join(dir, 'components', 'PrimaryButton', 'PrimaryButton.tsx'));
  });
});

test('changes the extension when a flag is passed', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.jsx'), 'x\n');

    await renameComponent('Button', 'PrimaryButton', { tsx: true }, 'components', no);

    await fs.access(path.join(dir, 'components', 'PrimaryButton', 'PrimaryButton.tsx'));
    await assert.rejects(
      fs.access(path.join(dir, 'components', 'PrimaryButton', 'PrimaryButton.jsx'))
    );
  });
});

test('keeps the function name when not confirmed', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'components', 'Button', 'Button.jsx'),
      'export default function Button() {}\n'
    );

    await renameComponent('Button', 'PrimaryButton', {}, 'components', no);

    const src = await fs.readFile(
      path.join(dir, 'components', 'PrimaryButton', 'PrimaryButton.jsx'),
      'utf8'
    );
    assert.match(src, /export default function Button\(\)/);
  });
});

test('does nothing when the source component does not exist', async () => {
  await inTempDir(async (dir) => {
    await renameComponent('Missing', 'Whatever', {}, 'components', yes);
    await assert.rejects(fs.access(path.join(dir, 'components', 'Whatever')));
  });
});

test('does not overwrite an existing target', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'A'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'A', 'A.jsx'), 'A original\n');
    await fs.mkdir(path.join(dir, 'components', 'B'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'B', 'B.jsx'), 'B original\n');

    await renameComponent('A', 'B', {}, 'components', no);

    const b = await fs.readFile(path.join(dir, 'components', 'B', 'B.jsx'), 'utf8');
    assert.equal(b, 'B original\n');
    await fs.access(path.join(dir, 'components', 'A', 'A.jsx'));
  });
});

test('renames a hook file and its function, keeping the extension', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'hooks'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'hooks', 'useToggle.ts'),
      'export default function useToggle() {}\n'
    );

    await renameHook('useToggle', 'useSwitch', {}, 'hooks', yes);

    const src = await fs.readFile(path.join(dir, 'hooks', 'useSwitch.ts'), 'utf8');
    assert.match(src, /export default function useSwitch\(\)/);
    await assert.rejects(fs.access(path.join(dir, 'hooks', 'useToggle.ts')));
  });
});

test('renames a helper file without touching the function when declined', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'helpers'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'helpers', 'format.js'),
      'export default function format() {}\n'
    );

    await renameHelper('format', 'formatDate', {}, 'helpers', no);

    const src = await fs.readFile(path.join(dir, 'helpers', 'formatDate.js'), 'utf8');
    assert.match(src, /export default function format\(\)/);
  });
});

test('renameAtPath renames a file in place, keeping its folder and extension', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'ui', 'Button.tsx'),
      'export default function Button() {}\n'
    );

    await renameAtPath('ui/Button.tsx', 'PrimaryButton', {}, yes);

    const src = await fs.readFile(path.join(dir, 'ui', 'PrimaryButton.tsx'), 'utf8');
    assert.match(src, /export default function PrimaryButton\(\)/);
    await assert.rejects(fs.access(path.join(dir, 'ui', 'Button.tsx')));
  });
});

test('renameAtPath moves the colocated css and ignores a typed extension/dir', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'ui', 'Button.jsx'), 'export default function Button() {}\n');
    await fs.writeFile(path.join(dir, 'ui', 'Button.css'), '.btn{}\n');

    // user typed a path + extension for the new name -> only the base is used
    await renameAtPath('ui/Button.jsx', 'ui/PrimaryButton.jsx', {}, no);

    await fs.access(path.join(dir, 'ui', 'PrimaryButton.jsx'));
    await fs.access(path.join(dir, 'ui', 'PrimaryButton.css'));
    const src = await fs.readFile(path.join(dir, 'ui', 'PrimaryButton.jsx'), 'utf8');
    assert.match(src, /export default function Button\(\)/);
  });
});

test('renameAtPath reports when the file does not exist', async () => {
  await inTempDir(async (dir) => {
    await renameAtPath('ui/Nope.jsx', 'Whatever', {}, yes);
    await assert.rejects(fs.access(path.join(dir, 'ui', 'Whatever.jsx')));
  });
});

test('renameAtPath will not overwrite an existing target', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'ui', 'A.jsx'), 'a\n');
    await fs.writeFile(path.join(dir, 'ui', 'B.jsx'), 'b\n');

    await renameAtPath('ui/A.jsx', 'B', {}, no);

    assert.equal(await fs.readFile(path.join(dir, 'ui', 'B.jsx'), 'utf8'), 'b\n');
    await fs.access(path.join(dir, 'ui', 'A.jsx'));
  });
});

test('renameAtPath can switch the extension with a flag', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'ui'), { recursive: true });
    await fs.writeFile(path.join(dir, 'ui', 'Button.jsx'), 'x\n');

    await renameAtPath('ui/Button.jsx', 'Button', { tsx: true }, no);

    await fs.access(path.join(dir, 'ui', 'Button.tsx'));
    await assert.rejects(fs.access(path.join(dir, 'ui', 'Button.jsx')));
  });
});

test('renameComponent refuses to escape the project', async () => {
  await inTempDir(async (dir) => {
    await fs.mkdir(path.join(dir, 'components', 'Button'), { recursive: true });
    await fs.writeFile(path.join(dir, 'components', 'Button', 'Button.jsx'), 'x\n');

    await renameComponent('Button', '../../Escaped', {}, 'components', no);

    await fs.access(path.join(dir, 'components', 'Button', 'Button.jsx'));
    await assert.rejects(fs.access(path.join(dir, '..', '..', 'Escaped')));
  });
});

test('renameHelper refuses a source that escapes the project', async () => {
  await inTempDir(async (dir) => {
    const outsideDir = path.join(dir, '..', `esc-${path.basename(dir)}`);
    await fs.mkdir(outsideDir, { recursive: true });
    await fs.writeFile(path.join(outsideDir, 'secret.js'), 'x\n');
    try {
      await renameHelper('../../' + path.basename(outsideDir) + '/secret', 'stolen', {}, 'helpers', no);
      await fs.access(path.join(outsideDir, 'secret.js'));
    } finally {
      await fs.rm(outsideDir, { recursive: true, force: true });
    }
  });
});

test('renameAtPath refuses a file outside the project', async () => {
  await inTempDir(async (dir) => {
    const outside = path.join(dir, '..', `outside-${path.basename(dir)}.jsx`);
    await fs.writeFile(outside, 'x\n');
    try {
      await renameAtPath(outside, 'Renamed', {}, no);
      await fs.access(outside);
    } finally {
      await fs.rm(outside, { force: true });
    }
  });
});
