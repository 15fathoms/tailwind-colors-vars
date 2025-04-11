import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const CLI_PATH = path.resolve('./tailwindColors.js');
const OUTPUT_DIR = path.resolve('./__test_output__');

function runCommand(cmd) {
  return execSync(`node ${CLI_PATH} ${cmd}`, { encoding: 'utf-8' });
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function cleanup() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

describe('Tailwind Colors CLI', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  it('should generate CSS file with HEX format in flat mode', () => {
    runCommand(`-f hex -e css -o ${OUTPUT_DIR} --flat`);
    const expected = path.join(OUTPUT_DIR, 'colors-hex.css');
    assert.ok(fileExists(expected), 'CSS HEX file should be generated');
  });

  it('should generate SCSS file with RGBA format in nested folders', () => {
    runCommand(`-f rgba -e scss -o ${OUTPUT_DIR}`);
    const expected = path.join(OUTPUT_DIR, 'scss', 'colors-rgba.scss');
    assert.ok(fileExists(expected), 'SCSS RGBA file should be generated');
  });

  it('should warn when using --flat with multiple formats', () => {
    const output = runCommand(`-f all -e css -o ${OUTPUT_DIR} --flat`);
    assert.ok(output.includes('Warning:'), 'Should warn about flat + multiple formats');
  });

  it('should write JSON file correctly', () => {
    const jsonPath = path.join(OUTPUT_DIR, 'colors.json');
    runCommand(`-f hex --json-out ${jsonPath}`);
    assert.ok(fileExists(jsonPath), 'JSON file should be generated');
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    assert.ok(json.hex, 'JSON should contain hex field');
  });

  it('should print to console if --print is used', () => {
    const output = runCommand('-f hex -e css --print');
    assert.ok(output.includes(':root'), 'Output should include CSS content');
  });
});
