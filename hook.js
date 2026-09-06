import fs from 'fs/promises';
import path from 'path';
import { confirm } from './prompt.js';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

export async function generateHook(hookName, options = {}, destinationPath = 'hooks', confirmFn = confirm) {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const folderPath = path.join(process.cwd(), destinationPath);
    const filePath = path.join(folderPath, `${hookName}.${extension}`);

    try {
        await fs.mkdir(folderPath, { recursive: true });

        // Find any existing file for this hook that has a different extension
        const staleFiles = [];
        for (const ext of ALLOWED_EXTENSIONS) {
            if (ext === extension) continue;
            const oldFilePath = path.join(folderPath, `${hookName}.${ext}`);
            try {
                await fs.access(oldFilePath);
                staleFiles.push(oldFilePath);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        }

        if (staleFiles.length > 0) {
            const fileNames = staleFiles.map((f) => path.basename(f)).join(', ');
            const shouldDelete = await confirmFn(`Found existing file(s) with a different extension: ${fileNames}. Delete them?`);
            if (shouldDelete) {
                for (const oldFilePath of staleFiles) {
                    await fs.unlink(oldFilePath);
                    console.log(`Removed ${oldFilePath}`);
                }
            } else {
                console.log('Keeping existing file(s); skipping deletion.');
            }
        }

        const content = `export default function ${hookName}() {\n  // ...\n}\n`;
        await fs.writeFile(filePath, content);

        console.log(`successfully created \n 🟢 ${hookName}.${extension} \n`);
    } catch (err) {
        console.log('Error: ', err);
    }
}