#!/usr/bin/env bun
import { Command } from 'commander';
import { draw, themes } from '@quirkvis/core';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('qasmvis-js')
  .description('Quantum Circuit SVG Visualizer (JS version)')
  .version('0.1.0');

program
  .argument('<qasm_file>', 'Path to the QASM file')
  .option('-o, --output <filename>', 'Output SVG filename')
  .option('-t, --theme <theme_name>', 'Theme name (default, emoji, matrix, night)', 'default')
  .action((qasm_file, options) => {
    try {
      const qasm = fs.readFileSync(qasm_file, 'utf8');
      const theme = (themes as any)[options.theme] || themes.default;
      
      const svg = draw(qasm, theme);
      
      const output = options.output || qasm_file.replace(/\.qasm$/, '.svg');
      fs.writeFileSync(output, svg);
      console.log(`Generated ${output} using theme ${options.theme}`);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  });

program.parse();
