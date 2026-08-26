/**
 * Benchmarks the common queries against a built CommonJS entry point.
 *
 * Usage:
 *   node scripts/benchmark.mjs [path-to-cjs-entry]
 *
 * Defaults to `dist/index.cjs.js`. Pass the 1.x bundle to compare:
 *   git show v1.0.10:dist/index.cjs.js > /tmp/old.cjs && node scripts/benchmark.mjs /tmp/old.cjs
 *
 * Uses only `node:perf_hooks` - no benchmarking dependency is added to the repo.
 */
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const entry = resolve(process.argv[2] || join(root, 'dist/index.cjs.js'));

/** Runs `fn` for at least `minMs`, returning nanoseconds per operation. */
function measure(fn, minMs = 250) {
  // Warm up so the JIT has settled before the timed run.
  for (let i = 0; i < 20; i++) fn();

  let iterations = 0;
  const start = performance.now();
  while (performance.now() - start < minMs) {
    fn();
    iterations++;
  }
  const elapsed = performance.now() - start;
  return (elapsed * 1e6) / iterations;
}

const format = (ns) =>
  ns >= 1e6
    ? `${(ns / 1e6).toFixed(3)} ms`
    : ns >= 1e3
      ? `${(ns / 1e3).toFixed(2)} us`
      : `${ns.toFixed(0)} ns`;

/**
 * Cold start is measured in a child process: within one process the first
 * require is unrepeatable, and the module cache would make a second one free.
 */
function coldStart(samples = 12) {
  const script = `
    const t0 = process.hrtime.bigint();
    const pkg = require(${JSON.stringify(entry)});
    const t1 = process.hrtime.bigint();
    pkg.getProvinces();
    const t2 = process.hrtime.bigint();
    pkg.getGaPas();
    const t3 = process.hrtime.bigint();
    console.log(JSON.stringify([Number(t1-t0), Number(t2-t1), Number(t3-t2)]));
  `;
  const runs = [];
  for (let i = 0; i < samples; i++) {
    runs.push(
      JSON.parse(
        execFileSync(process.execPath, ['-e', script], {
          encoding: 'utf8',
        }).trim()
      )
    );
  }
  const median = (xs) => xs.slice().sort((a, b) => a - b)[xs.length >> 1];
  return {
    require: median(runs.map((r) => r[0])),
    firstProvinces: median(runs.map((r) => r[1])),
    firstGaPas: median(runs.map((r) => r[2])),
  };
}

const pkg = require(entry);

const cold = coldStart();
console.log(`entry: ${entry}\n`);
console.log('cold start (median of 12 child processes)');
console.log(`  require(pkg)              ${format(cold.require)}`);
console.log(`  + first getProvinces()    ${format(cold.firstProvinces)}`);
console.log(`  + first getGaPas()        ${format(cold.firstGaPas)}`);
console.log(
  `  total to first full query ${format(
    cold.require + cold.firstProvinces + cold.firstGaPas
  )}\n`
);

const cases = [
  ['getProvinces()', () => pkg.getProvinces()],
  ['getDistricts()', () => pkg.getDistricts()],
  ['getGaPas()', () => pkg.getGaPas()],
  ['getGaPas("ne")', () => pkg.getGaPas('ne')],
  ['getDistrictsByProvince(3)', () => pkg.getDistrictsByProvince(3)],
  ['getGaPasByDistrict(306)', () => pkg.getGaPasByDistrict(306)],
  ['getProvinceDetails(7)', () => pkg.getProvinceDetails(7)],
  ['getDistrictDetails(709)', () => pkg.getDistrictDetails(709)],
  ['getGaPaDetails(70909)', () => pkg.getGaPaDetails(70909)],
  ['getGaPaDetails(9) [by id]', () => pkg.getGaPaDetails(9)],
];

console.log('steady state (warm cache)');
for (const [name, fn] of cases) {
  console.log(`  ${name.padEnd(26)} ${format(measure(fn))}`);
}

if (typeof pkg.findByCode === 'function') {
  console.log('\nnew in 2.0');
  for (const [name, fn] of [
    ['findByCode(1010101)', () => pkg.findByCode(1010101)],
    ['getChildren(306)', () => pkg.getChildren(306)],
    ['getBreadcrumb(1010101)', () => pkg.getBreadcrumb(1010101)],
    ['getSiblings(10101)', () => pkg.getSiblings(10101)],
    ['search("Kathmandu")', () => pkg.search('Kathmandu')],
    ['getStatistics()', () => pkg.getStatistics()],
    ['getWards(30608)', () => pkg.getWards(30608)],
  ]) {
    console.log(`  ${name.padEnd(26)} ${format(measure(fn))}`);
  }
}
