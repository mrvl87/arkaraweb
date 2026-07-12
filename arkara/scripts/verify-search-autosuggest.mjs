import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentDir = dirname(fileURLToPath(import.meta.url));
const componentPath = resolve(currentDir, '../src/components/SearchAutosuggest.astro');
const source = readFileSync(componentPath, 'utf8');

const requiredTokens = [
  'aria-activedescendant',
  'aria-selected',
  'ArrowDown',
  'ArrowUp',
  'role="combobox"',
  'role="listbox"',
  'role="option"',
];

const missingTokens = requiredTokens.filter((token) => !source.includes(token));

if (missingTokens.length > 0) {
  console.error(`SearchAutosuggest a11y guard failed. Missing token(s): ${missingTokens.join(', ')}`);
  process.exit(1);
}

console.log('SearchAutosuggest a11y guard passed.');