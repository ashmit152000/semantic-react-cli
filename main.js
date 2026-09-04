#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { generateComponent } from './component.js';

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

generate
  .command('component <name>')
  .alias('c')
  .description('Generate a component folder with a colocated CSS file')
  .option('--jsx', 'Generate a .jsx file instead of .js')
  .option('--tsx', 'Generate a .tsx file instead of .js')
  .option('--ts', 'Generate a .ts file instead of .js')
  .action((name, options) => generateComponent(name, options));

program.parse(process.argv);
