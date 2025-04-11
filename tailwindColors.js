#!/usr/bin/env node

import fs from 'fs';
import colors from 'tailwindcss/colors';
import Color from 'colorjs.io';
import path from 'path';

// Simple CLI arg parsing
const args = process.argv.slice(2);
const opts = {
  format: 'all',
  ext: 'all',
  out: 'dist',
  print: false,
  json: false,
  jsonOut: null,
  flat: false,
  silent: false
};

function colorize(text, color) {
  const codes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m'
  };
  return `${codes[color] || ''}${text}${codes.reset}`;
}

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
Tailwind Colors Exporter

Usage:
  tailwind-colors [options]

Options:
  -f, --format <type>   Color format to export: hex, rgba, oklch, all (default: all)
  -e, --ext <type>      Output style: css, scss, less, styl, all (default: all)
  -o, --out <dir>       Output directory (default: dist)
  --print               Print to console instead of writing files
  --json                Output as a JSON dump of the selected formats
  --json-out <file>     Write JSON output to a specific file (e.g., colors.json)
  --flat                Output to single-level folder instead of per target
  --silent              Disable all logs and console outputs
  -h, --help            Show this help message
`);
  process.exit(0);
}

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-f' || args[i] === '--format') opts.format = args[i + 1];
  if (args[i] === '-e' || args[i] === '--ext') opts.ext = args[i + 1];
  if (args[i] === '-o' || args[i] === '--out') opts.out = args[i + 1];
  if (args[i] === '--print') opts.print = true;
  if (args[i] === '--json') opts.json = true;
  if (args[i] === '--json-out') opts.jsonOut = args[i + 1];
  if (args[i] === '--flat') opts.flat = true;
  if (args[i] === '--silent') opts.silent = true;
}

const ignore = ['lightBlue', 'trueGray', 'coolGray', 'warmGray', 'blueGray'];
const allFormats = ['hex', 'rgba', 'oklch'];
const allTargets = ['css', 'scss', 'less', 'styl'];

if (opts.format !== 'all' && !allFormats.includes(opts.format)) {
  if (!opts.silent) {
    console.error(colorize(`\n❌ Invalid format: ${opts.format}`, 'red'));
    console.error(`Accepted formats: ${allFormats.join(', ')} or 'all'`);
  }
  process.exit(1);
}

if (opts.ext !== 'all' && !allTargets.includes(opts.ext)) {
  if (!opts.silent) {
    console.error(colorize(`\n❌ Invalid extension: ${opts.ext}`, 'red'));
    console.error(`Accepted extensions: ${allTargets.join(', ')} or 'all'`);
  }
  process.exit(1);
}

const selectedFormats = opts.format === 'all' ? allFormats : [opts.format];
const selectedTargets = opts.ext === 'all' ? allTargets : [opts.ext];
const outputDir = path.resolve(opts.out);

// ⚠️ Validation pour --flat
if (opts.flat && (opts.format === 'all' || opts.ext === 'all')) {
  if (!opts.silent) {
    console.log(colorize(`\n⚠️ Warning: Using --flat with multiple formats or extensions may result in file overwrites.`, 'yellow'));
  }
}

const colorData = {
  hex: new Map(),
  rgba: new Map(),
  oklch: new Map()
};

function flattenColors(obj, prefix = '') {
  const result = [];
  for (const key in obj) {
    const val = obj[key];
    if (typeof val === 'string') {
      result.push([`${prefix}${key}`, val]);
    } else {
      result.push(...flattenColors(val, `${prefix}${key}-`));
    }
  }
  return result;
}

for (const colorName in colors) {
  if (ignore.includes(colorName)) continue;
  const entries = flattenColors(colors[colorName], `${colorName}-`);
  for (const [name, hex] of entries) {
    try {
      const color = new Color(hex);
      const hexStr = color.to('srgb').toString({ format: 'hex' });
      const [r, g, b] = color.to('srgb').coords.map(n => Math.round(Math.max(0, Math.min(1, n)) * 255));
      const rgbaStr = `rgba(${r}, ${g}, ${b}, 1)`;
      const [l, c, h] = color.oklch;
      const oklchStr = `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)})`;
      colorData.hex.set(name, hexStr);
      colorData.rgba.set(name, rgbaStr);
      colorData.oklch.set(name, oklchStr);
    } catch {
      colorData.hex.set(name, '/* invalid */');
      colorData.rgba.set(name, '/* invalid */');
      colorData.oklch.set(name, '/* invalid */');
    }
  }
}

if (opts.json || opts.jsonOut) {
  const result = {};
  for (const format of selectedFormats) {
    result[format] = Object.fromEntries(colorData[format]);
  }
  const jsonStr = JSON.stringify(result, null, 2);
  if (opts.jsonOut) {
    fs.mkdirSync(path.dirname(opts.jsonOut), { recursive: true });
    fs.writeFileSync(opts.jsonOut, jsonStr, 'utf8');
    if (!opts.silent) console.log(colorize(`✅ JSON written to ${opts.jsonOut}`, 'green'));
  } else {
    console.log(jsonStr);
  }
  process.exit(0);
}

const writers = {
  css: (map) => `:root {\n${[...map].filter(([_, v]) => !v.includes('invalid')).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`,
  scss: (map) => [...map].filter(([_, v]) => !v.includes('invalid')).map(([k, v]) => `$${k}: ${v};`).join('\n'),
  less: (map) => [...map].filter(([_, v]) => !v.includes('invalid')).map(([k, v]) => `@${k}: ${v};`).join('\n'),
  styl: (map) => [...map].filter(([_, v]) => !v.includes('invalid')).map(([k, v]) => `${k} = ${v};`).join('\n')
};

for (const format of selectedFormats) {
  const map = colorData[format];
  for (const target of selectedTargets) {
    const ext = target === 'scss' ? '.scss' : target === 'styl' ? '.styl' : `.${target}`;
    const finalDir = opts.flat ? outputDir : path.join(outputDir, target);
    const filePath = path.join(finalDir, `colors-${format}.${target}`);
    const content = writers[target](map);

    if (opts.print) {
      console.log(`\n=== ${target.toUpperCase()} (${format.toUpperCase()}) ===`);
      console.log(content);
    } else {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf8');
      if (!opts.silent) console.log(colorize(`✅ Generated: ${filePath}`, 'cyan'));
    }
  }
}

if (!opts.print && !opts.json && !opts.jsonOut && !opts.silent) {
  console.log(colorize('🎉 Done. Tailwind color variables exported.', 'green'));
}
