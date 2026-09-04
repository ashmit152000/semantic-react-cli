#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { generateComponent } from './component.js';
import { generateHelper } from './helper.js';
import { generateHook } from './hook.js';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
);

const program = new Command();

program
  .name('semantic-react')
  .description(pkg.description)
  .version(pkg.version);

const generate = program
  .command('generate')
  .alias('g')
  .description('Generate a scaffold');

// For Creating a component folder with a colocated CSS file
generate
  .command('component <name>')
  .alias('c')
  .description('Generate a component folder with a colocated CSS file')
  .option('--jsx', 'Generate a .jsx file instead of .js')
  .option('--tsx', 'Generate a .tsx file instead of .js')
  .option('--ts', 'Generate a .ts file instead of .js')
  .action((name, options) => generateComponent(name, options));

// For Creating a helper file
  generate
    .command('helper <name>')
    .alias('h')
    .description('Generate a helper file')
    .option('--jsx', 'Generate a .jsx file instead of .js')
    .option('--tsx', 'Generate a .tsx file instead of .js')
    .option('--ts', 'Generate a .ts file instead of .js')
    .action((name, options) => generateHelper(name, options));

// For Creating a hook file
generate
  .command('hook <name>')
  .alias('k')
  .description('Generate a hook file')
  .option('--jsx', 'Generate a .jsx file instead of .js')
  .option('--tsx', 'Generate a .tsx file instead of .js')
  .option('--ts', 'Generate a .ts file instead of .js')
  .action((name, options) => generateHook(name, options));

program.parse(process.argv);
