import fs from 'fs/promises';
import path from 'path';

async function listFiles(dir) {
    const entries = [];

    let dirents;
    try {
        dirents = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        if (err.code === 'ENOENT') return null;
        throw err;
    }

    dirents.sort((a, b) => a.name.localeCompare(b.name));

    for (const dirent of dirents) {
        const entryPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            const nested = await listFiles(entryPath);
            entries.push({ name: dirent.name, isDirectory: true, children: nested ?? [] });
        } else {
            entries.push({ name: dirent.name, isDirectory: false });
        }
    }

    return entries;
}

// Language icon per file extension
const FILE_ICONS = {
    '.tsx': '⚛️',
    '.jsx': '⚛️',
    '.ts': '🟦',
    '.js': '🟨',
    '.css': '🎨',
};

function iconFor(fileName) {
    return FILE_ICONS[path.extname(fileName).toLowerCase()] ?? '📄';
}

// Print entries as a tree, drawing the connecting lines between them.
function printEntries(entries, prefix) {
    entries.forEach((entry, index) => {
        const isLast = index === entries.length - 1;
        const branch = isLast ? '└── ' : '├── ';
        const icon = entry.isDirectory ? '📁' : iconFor(entry.name);

        console.log(`${prefix}${branch}${icon} ${entry.name}`);

        if (entry.isDirectory) {
            const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
            if (entry.children.length === 0) {
                console.log(`${childPrefix}└── (empty)`);
            } else {
                printEntries(entry.children, childPrefix);
            }
        }
    });
}

function printSection(label, entries) {
    console.log(`\n${label}`);

    if (entries === null) {
        console.log('  (path does not exist yet)');
        return;
    }
    if (entries.length === 0) {
        console.log('  (empty)');
        return;
    }
    printEntries(entries, '  ');
}

export async function listPaths(paths) {
    const kinds = ['components', 'helpers', 'hooks'];

    for (const kind of kinds) {
        const destinationPath = paths[kind];
        const absolutePath = path.join(process.cwd(), destinationPath);
        printSection(`${kind} (${destinationPath})`, await listFiles(absolutePath));
    }
}

// List the contents of an arbitrary directory the user pointed at.
export async function listDirectory(dirArg) {
    const absolutePath = path.resolve(process.cwd(), dirArg);
    const label = path.relative(process.cwd(), absolutePath) || '.';

    let stat;
    try {
        stat = await fs.stat(absolutePath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`\n${label}\n  (path does not exist)`);
            return;
        }
        throw err;
    }

    if (!stat.isDirectory()) {
        console.log(`\n${label}\n  (not a directory)`);
        return;
    }

    printSection(label, await listFiles(absolutePath));
}
