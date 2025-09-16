#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { generatePdf } from '../lib/index.js';
import { initProject } from '../lib/project-init.js';

const program = new Command();

program
  .name('markdown-to-pdf')
  .description('Convert Markdown files to PDFs with custom themes and templates')
  .version('1.0.0');

program
  .command('convert <file>')
  .description('Convert a Markdown file to PDF')
  .option('-o, --output <file>', 'Output PDF file path')
  .option('-t, --theme <name>', 'Theme to use', 'default')
  .option('-c, --config <file>', 'Configuration file path')
  .option('--html', 'Also output intermediate HTML file')
  .option('--no-title-page', 'Skip title page generation')
  .action(async (file, options) => {
    try {
      const result = await generatePdf(file, options);
      console.log(chalk.green(`✅ PDF generated successfully: ${result.outputPath}`));
      if (options.html && result.htmlPath) {
        console.log(chalk.blue(`📄 HTML also saved: ${result.htmlPath}`));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('init [name]')
  .description('Initialize a new md2pdf project')
  .option('-t, --theme <name>', 'Theme to use', 'default')
  .action((name, options) => {
    try {
      const projectPath = initProject(name || 'my-docs', options);
      console.log(chalk.green(`✅ Project initialized: ${projectPath}`));
      console.log(chalk.blue('📁 Structure created with sample files and configuration'));
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('themes')
  .description('List available themes')
  .action(() => {
    // TODO: Implement theme listing
    console.log(chalk.blue('Available themes:'));
    console.log('  - default (built-in)');
    console.log('  - academic (built-in)');
    console.log('  - minimal (built-in)');
  });

program.parse();