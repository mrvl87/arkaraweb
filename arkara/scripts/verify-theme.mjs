import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const bootstrap = source('../src/layouts/BaseLayout.astro').match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const controls = ts.transpileModule(source('../src/components/layout/ThemeToggle.astro').match(/<script>([\s\S]*?)<\/script>/)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
let passed = 0;
function test(name, run) { run(); passed++; console.log(`PASS ${name}`); }

function page(saved, blocked = false) {
  const stored = new Map(saved === undefined ? [] : [['arkara-theme', saved]]);
  const listeners = new Map();
  const buttons = [{ hidden: true, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } }];
  const root = { dataset: { theme: 'dark' } };
  const meta = { content: '', setAttribute(key, value) { this[key] = value; } };
  class Element { closest(selector) { return selector === '[data-theme-toggle]' ? buttons[0] : null; } }
  const register = (type, listener) => {
    listeners.set(type, [...(listeners.get(type) || []), listener]);
  };
  const context = vm.createContext({
    Element,
    document: {
      documentElement: root,
      querySelector: () => meta,
      querySelectorAll: () => buttons,
      addEventListener: register,
    },
    window: { addEventListener: register },
    localStorage: {
      getItem(key) { if (blocked) throw Error('Storage blocked'); return stored.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error('Storage blocked'); stored.set(key, value); },
    },
  });
  vm.runInContext(bootstrap, context);
  const initialTheme = root.dataset.theme;
  vm.runInContext(controls, context);
  const emit = (name, event = {}) => (listeners.get(name) || []).forEach((fn) => fn(event));
  return { root, meta, buttons, stored, initialTheme, emit, click: () => emit('click', { target: new Element() }) };
}

test('Dark default is applied before rendering and control is accessible', () => {
  const p = page();
  assert.equal(p.initialTheme, 'dark');
  assert.equal(p.meta.content, '#10251a');
  assert.equal(p.buttons[0].hidden, false);
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'true');
});
test('Saved light choice is applied before rendering and survives reload', () => {
  const p = page('light');
  assert.equal(p.initialTheme, 'light');
  assert.equal(p.meta.content, '#f8f5ec');
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'false');
});
test('Toggle updates color, accessible state and saved choice in both directions', () => {
  const p = page();
  p.click();
  assert.equal(p.root.dataset.theme, 'light');
  assert.equal(p.stored.get('arkara-theme'), 'light');
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'false');
  assert.equal(p.meta.content, '#f8f5ec');
  assert.equal(page(p.stored.get('arkara-theme')).initialTheme, 'light');
  p.click();
  assert.equal(p.stored.get('arkara-theme'), 'dark');
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'true');
});
test('Blocked storage and invalid saved data leave the control usable', () => {
  assert.equal(page('invalid').initialTheme, 'dark');
  const p = page('light', true);
  assert.equal(p.initialTheme, 'dark');
  p.click();
  assert.equal(p.root.dataset.theme, 'light');
});
test('Other tabs synchronize theme; unrelated storage changes are ignored', () => {
  const p = page();
  p.emit('storage', { key: 'other', newValue: 'light' });
  assert.equal(p.root.dataset.theme, 'dark');
  p.emit('storage', { key: 'arkara-theme', newValue: 'light' });
  assert.equal(p.root.dataset.theme, 'light');
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'false');
  p.emit('storage', { key: null, newValue: null });
  assert.equal(p.root.dataset.theme, 'dark');
});
test('Page-load events synchronize replacement controls without duplicate clicks', () => {
  const p = page('light');
  p.buttons[0] = { hidden: true, attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
  p.emit('astro:page-load');
  p.emit('astro:page-load');
  assert.equal(p.buttons[0].hidden, false);
  assert.equal(p.buttons[0].attributes['aria-pressed'], 'false');
  p.click();
  assert.equal(p.root.dataset.theme, 'dark');
});

const darkBlock = source('../src/styles/theme.css').match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/)[1];
const tokens = Object.fromEntries([...darkBlock.matchAll(/(--[\w-]+):\s*(#[a-f\d]{6});/gi)].map((m) => [m[1], m[2]]));
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map((c) => parseInt(c, 16) / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(foreground, background) {
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
test('Dark text and actions meet the 4.5:1 contrast target on their surfaces', () => {
  const pairs = [];
  for (const fg of ['--text', '--text-muted', '--ink-light', '--forest', '--forest-deep']) {
    for (const bg of ['--surface', '--surface-raised', '--surface-muted', '--forest-soft']) pairs.push([tokens[fg], tokens[bg], `${fg} on ${bg}`]);
  }
  pairs.push([tokens['--on-action'], tokens['--action-bg'], 'Primary button']);
  pairs.push([tokens['--on-action'], tokens['--action-hover'], 'Primary hover']);
  pairs.push([tokens['--yellow-dark'], tokens['--amber-soft'], 'Amber badge']);
  pairs.push([tokens['--red-warning'], '#482c27', 'Warning badge']);
  pairs.push([tokens['--forest-deep'], '#73521c', 'Headline underline']);
  const ratios = pairs.map(([fg, bg, label]) => ({ label, ratio: contrast(fg, bg) }));
  for (const { label, ratio } of ratios) assert.ok(ratio >= 4.5, `${label}: ${ratio.toFixed(2)}:1`);
  console.log(`  ${ratios.length} color pairs; minimum ${Math.min(...ratios.map((r) => r.ratio)).toFixed(2)}:1`);
});
console.log(`${passed} theme checks passed.`);
