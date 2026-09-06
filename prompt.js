import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

export async function confirm(message) {
    const rl = readline.createInterface({ input, output });
    try {
        const answer = await rl.question(`${message} (y/N) `);
        return /^y(es)?$/i.test(answer.trim());
    } finally {
        rl.close();
    }
}
