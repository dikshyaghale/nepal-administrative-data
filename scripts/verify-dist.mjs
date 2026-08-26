/**
 * Smoke-tests the published artifacts rather than the TypeScript sources.
 *
 * Jest runs against `src/`, which cannot catch packaging mistakes: a wrong
 * `exports` condition, an ESM file that Node parses as CommonJS, or a bundle that
 * silently lost a function. This script loads `dist/` exactly the way a consumer
 * would, and checks it against `data/source.json` - the same snapshot the 1.0.x
 * hand-written `src/data.ts` was built from.
 */
import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const source = JSON.parse(readFileSync(join(root, 'data/source.json'), 'utf8'));

const checks = [];
const check = (name, fn) => checks.push([name, fn]);

const PUBLIC_API = [
  'getProvinces',
  'getDistricts',
  'getGaPas',
  'getDistrictsByProvince',
  'getGaPasByDistrict',
  'getProvinceDetails',
  'getDistrictDetails',
  'getGaPaDetails',
];

const cjs = require(join(root, 'dist/index.cjs.js'));
const esm = await import(pathToFileURL(join(root, 'dist/index.esm.js')));

check('CJS entry exposes the full 1.0.x API', () => {
  for (const name of PUBLIC_API) assert.equal(typeof cjs[name], 'function');
  assert.ok(Array.isArray(cjs.rawData));
  assert.equal(typeof cjs.default, 'object');
  for (const name of PUBLIC_API) {
    assert.equal(typeof cjs.default[name], 'function');
  }
  assert.deepEqual(Object.keys(cjs.default).sort(), [...PUBLIC_API].sort());
});

check('ESM entry is parsed as a real ES module', () => {
  for (const name of PUBLIC_API) assert.equal(typeof esm[name], 'function');
  assert.ok(Array.isArray(esm.rawData));
  assert.equal(typeof esm.default, 'object');
});

check('no API beyond 1.0.x leaked into either bundle', () => {
  const allowed = new Set([...PUBLIC_API, 'rawData', 'default', '__esModule']);
  for (const build of [cjs, esm]) {
    const extra = Object.keys(build).filter((k) => !allowed.has(k));
    assert.deepEqual(extra, [], `unexpected exports: ${extra.join(', ')}`);
  }
});

check('rawData matches the source snapshot exactly', () => {
  for (const build of [cjs, esm]) {
    assert.equal(build.rawData.length, source.length);
    assert.equal(JSON.stringify(build.rawData), JSON.stringify(source));
  }
});

check('both formats return identical results', () => {
  const calls = [
    ['getProvinces', ['en']],
    ['getProvinces', ['ne']],
    ['getDistricts', ['en']],
    ['getDistricts', ['ne']],
    ['getGaPas', ['en']],
    ['getGaPas', ['ne']],
    ['getDistrictsByProvince', [1, 'ne']],
    ['getGaPasByDistrict', [101, 'ne']],
    ['getProvinceDetails', [3]],
    ['getDistrictDetails', [27]],
    ['getGaPaDetails', [10101]],
  ];
  for (const [fn, args] of calls) {
    assert.equal(JSON.stringify(cjs[fn](...args)), JSON.stringify(esm[fn](...args)));
  }
  assert.equal(cjs.getProvinces().length, 7);
  assert.equal(cjs.getDistricts().length, 77);
  assert.equal(cjs.getGaPas().length, 753);
});

check('GaPa objects keep the exact 1.0.x shape', () => {
  const expected = [
    'id',
    'code',
    'nameEn',
    'nameNe',
    'districtId',
    'districtCode',
    'provinceId',
    'totalWards',
  ];
  for (const build of [cjs, esm]) {
    assert.deepEqual(Object.keys(build.getGaPaDetails(10101)), expected);
    assert.deepEqual(Object.keys(build.getGaPas('en')[0]), [
      'code',
      'name',
      'totalWard',
    ]);
  }
});

check('error messages and types from 1.0.x are preserved', () => {
  for (const build of [cjs, esm]) {
    assert.throws(() => build.getDistrictsByProvince(999), (error) => {
      assert.equal(error.constructor, Error);
      assert.equal(error.message, 'Province with ID/code 999 not found');
      return true;
    });
    assert.throws(() => build.getGaPasByDistrict(9999), (error) => {
      assert.equal(error.constructor, Error);
      assert.equal(error.message, 'District with ID/code 9999 not found');
      return true;
    });
    assert.throws(() => build.getProvinces('xx'), (error) => {
      assert.equal(error.constructor, Error);
      assert.equal(error.message, 'Invalid language. Must be "en" or "ne"');
      return true;
    });
  }
});

check('indexes are decoded once and memoised', () => {
  // Object identity across calls proves the decoded index is built lazily and
  // then cached, rather than rebuilt per call the way 1.0.x processData() was.
  const probePath = join(root, 'dist/index.cjs.js');
  delete require.cache[require.resolve(probePath)];
  const fresh = require(probePath);

  assert.equal(fresh.getGaPaDetails(10101), fresh.getGaPaDetails(10101));
  assert.equal(fresh.getProvinceDetails(1), fresh.getProvinceDetails(1));
  assert.equal(fresh.getDistrictDetails(101), fresh.getDistrictDetails(101));
  // rawData is a lazy view, so repeated reads must stay stable too.
  assert.equal(fresh.rawData[0].Province, 1);
  assert.equal(fresh.rawData.length, source.length);
});

check('published bundles stay small', () => {
  const limit = 32 * 1024;
  for (const file of ['dist/index.cjs.js', 'dist/index.esm.js']) {
    const size = statSync(join(root, file)).size;
    assert.ok(size < limit, `${file} is ${size} B, over the ${limit} B budget`);
  }
});

let failed = 0;
for (const [name, fn] of checks) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed++;
    console.error(`FAIL  ${name}\n      ${error.message}`);
  }
}

if (failed) {
  console.error(`\n${failed} dist check(s) failed`);
  process.exit(1);
}
console.log(`\n${checks.length} dist checks passed`);
