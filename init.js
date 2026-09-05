import fs from 'fs/promises';
import path from 'path';
import defaultOptions from './default.js';

export const SETTINGS_FILE = 'semantic-react.settings.json';

export async function generateSettings(options = {}) {
    const filePath = path.join(process.cwd(), SETTINGS_FILE);

    try {
        await fs.access(filePath);
        if (!options.force) {
            console.log(`${SETTINGS_FILE} already exists (use --force to overwrite)`);
            return false;
        }
    } catch (err) {
        if (err.code !== 'ENOENT') throw err;
    }

    const content = JSON.stringify(defaultOptions, null, 2) + '\n';
    await fs.writeFile(filePath, content);

    console.log(`successfully created \n 🟢 ${SETTINGS_FILE}`);
    return true;
}
