import fs from 'fs/promises';
import path from 'path';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

export async function generateHelper(helperName, options = {}, destinationPath = 'helpers') {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const folderPath = path.join(process.cwd(), destinationPath);
    const filePath = path.join(folderPath, `${helperName}.${extension}`);

    try {
        await fs.mkdir(folderPath, { recursive: true });

        // Remove any existing file for this component that has a different extension
        for (const ext of ALLOWED_EXTENSIONS) {
            if (ext === extension) continue;
            const oldFilePath = path.join(folderPath, `${helperName}.${ext}`);
            try {
                await fs.unlink(oldFilePath);
                console.log(`Removed ${oldFilePath}`);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        }

        const content = `export default function ${helperName}() {\n  // ...\n}\n`;
        await fs.writeFile(filePath, content);

        console.log(`successfully created \n 🟢 ${helperName}.${extension} \n`);
    } catch (err) {
        console.log('Error: ', err);
    }
}