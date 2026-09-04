import fs from 'fs/promises';
import path from 'path';

const ALLOWED_EXTENSIONS = ['js', 'jsx', 'tsx', 'ts'];

export async function generateComponent(componentName, options = {}) {
    let extension = 'js';
    if (options.tsx) extension = 'tsx';
    else if (options.jsx) extension = 'jsx';
    else if (options.ts) extension = 'ts';

    const folderPath = path.join(process.cwd(),'components', componentName);
    const filePath = path.join(folderPath, `${componentName}.${extension}`);
    const cssPath = path.join(folderPath, `${componentName}.css`)

    try {
        await fs.mkdir(folderPath, { recursive: true });

        // Remove any existing file for this component that has a different extension
        for (const ext of ALLOWED_EXTENSIONS) {
            if (ext === extension) continue;
            const oldFilePath = path.join(folderPath, `${componentName}.${ext}`);
            try {
                await fs.unlink(oldFilePath);
                console.log(`Removed ${oldFilePath}`);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        }

        const content = `export default function ${componentName}() {\n  // ...\n}\n`;
        await fs.writeFile(filePath, content);
        await fs.writeFile(cssPath, '');

        console.log(`successfully create \n 🟢 ${componentName}.${extension} \n 🟣 ${componentName}.css`);
    } catch (err) {
        console.log('Error: ', err);
    }
}