/**
 * Generates the compact encoded data modules in `src/data/` from `data/source.json`.
 *
 * Run with: npm run generate
 *
 * Encoding strategy
 * -----------------
 * The source is a fully denormalised table (753 rows), where every row repeats the
 * province name (en + ne), the district name (en + ne) and every JSON key. The
 * generated modules store the same information normalised into three newline
 * delimited strings, exploiting three verified invariants of the dataset:
 *
 *   1. districtCode   === provinceCode * 100 + (1-based index of district in province)
 *   2. localLevelCode === districtCode  * 100 + (1-based index of local level in district)
 *   3. rows are grouped by district and ordered by local level code
 *
 * Because of (1)-(3) no code needs to be stored at all: they are recomputed while
 * decoding. Only names, child counts, ward counts and a suffix index are kept.
 *
 * Repeated name suffixes ("Rural Municipality", "गाउँपालिका", ...) are replaced by a
 * single base36 index into a dictionary. Suffix variants intentionally include the
 * typos and trailing whitespace present in the official source data so that the
 * decoded strings are byte-identical to the previously published ones.
 *
 * Finally, Nepali names are transliterated to single-byte ASCII. The whole dataset
 * uses only 63 distinct Devanagari characters, so each one is mapped to a printable
 * ASCII character; that turns 3 UTF-8 bytes per character into 1 and shrinks the
 * Nepali half of the payload roughly threefold. The alphabet is emitted alongside
 * the data so decoding is a table lookup.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * English suffix variants, longest-first so that greedy matching is correct.
 * Index in this array + 1 is what gets stored (0 means "no suffix / verbatim").
 */
const EN_SUFFIXES = [
  'Sub-Metropolitian City',
  'Rural Municipality',
  'Metropolitian City',
  'Sub-Metropolitan City',
  'Metropolitan City',
  'Municipality',
];

/** Nepali suffix variants, longest-first. Includes source-data typos. */
const NE_SUFFIXES = [
  'उपमहानगरपालिका',
  'महानगरपालिका',
  'गाउँपालिका',
  'गाउंपालिका',
  'नगरपालिका',
];

const FIELD = '|';
const RECORD = '\n';

/**
 * Splits `name` into a stem and a 1-based dictionary index.
 * A trailing space is folded into a separate flag so that the dictionary stays small.
 * Returns [stem, index, hadTrailingSpace].
 */
function splitSuffix(name, dictionary) {
  const trailingSpace = name.endsWith(' ');
  const trimmed = trailingSpace ? name.slice(0, -1) : name;

  for (let i = 0; i < dictionary.length; i++) {
    const suffix = dictionary[i];
    if (trimmed.endsWith(' ' + suffix)) {
      return [trimmed.slice(0, -(suffix.length + 1)), i + 1, trailingSpace];
    }
  }
  return [name, 0, false];
}

function assert(condition, message) {
  if (!condition) throw new Error('Data invariant violated: ' + message);
}

/**
 * Printable ASCII codes usable as packed-Nepali symbols.
 *
 * Excludes the field separator `|`, the record separator `\n`, and the two
 * characters that would need escaping inside the emitted string literal (`\` and
 * `'`) so that one packed character always costs exactly one source byte.
 */
const ASCII_POOL = [];
for (let code = 35; code <= 126; code++) {
  if (code !== 39 && code !== 92 && code !== 124) ASCII_POOL.push(code);
}

const rows = JSON.parse(readFileSync(join(root, 'data/source.json'), 'utf8'));

/** Every distinct Devanagari character used anywhere in the dataset. */
const neAlphabet = [
  ...new Set(
    rows.flatMap((row) => [
      ...row['Province Name Ne'],
      ...row['District Name Ne'],
      ...row['GaPa Name Ne'],
    ])
  ),
].sort();

assert(
  neAlphabet.length <= ASCII_POOL.length,
  `${neAlphabet.length} Nepali characters do not fit in ${ASCII_POOL.length} ASCII slots`
);

const nePool = ASCII_POOL.slice(0, neAlphabet.length)
  .map((code) => String.fromCharCode(code))
  .join('');
const neEncodeMap = new Map(neAlphabet.map((ch, i) => [ch, nePool[i]]));

/** Packs a Nepali string into one ASCII character per Devanagari character. */
function packNe(value) {
  let out = '';
  for (const ch of value) {
    const mapped = neEncodeMap.get(ch);
    assert(mapped !== undefined, `character ${JSON.stringify(ch)} is not in the alphabet`);
    out += mapped;
  }
  return out;
}

/** Inverse of {@link packNe}, used by the round trip check below. */
function unpackNe(value) {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    out += neAlphabet[nePool.indexOf(value[i])];
  }
  return out;
}

const provinces = new Map();
const districts = new Map();
const localLevels = [];

for (const row of rows) {
  const provinceCode = row['Province'];
  const districtId = row['District Id'];
  const districtCode = row['District Code'];

  if (!provinces.has(provinceCode)) {
    provinces.set(provinceCode, {
      code: provinceCode,
      nameEn: row['Province Name En'],
      nameNe: row['Province Name Ne'],
      districtCount: 0,
    });
  }

  if (!districts.has(districtId)) {
    districts.set(districtId, {
      id: districtId,
      code: districtCode,
      nameEn: row['District Name En'],
      nameNe: row['District Name Ne'],
      provinceCode,
      localLevelCount: 0,
    });
    const province = provinces.get(provinceCode);
    province.districtCount++;
    assert(
      districtCode === provinceCode * 100 + province.districtCount,
      `districtCode ${districtCode} is not derivable from its position`
    );
  }

  const district = districts.get(districtId);
  district.localLevelCount++;
  assert(
    row['GAPA Code'] === districtCode * 100 + district.localLevelCount,
    `localLevelCode ${row['GAPA Code']} is not derivable from its position`
  );
  assert(
    row['GAPA Id'] === district.localLevelCount,
    `GAPA Id ${row['GAPA Id']} is not sequential within district ${districtCode}`
  );

  localLevels.push({
    nameEn: row['GaPa Name En'],
    nameNe: row['GaPa Name Ne'],
    totalWards: row['Total Wards'],
  });
}

assert(
  rows.every((r, i) => i === 0 || rows[i - 1]['GAPA Code'] < r['GAPA Code']),
  'rows are not ordered by local level code'
);

// --- encode -----------------------------------------------------------------

const provinceRecords = [...provinces.values()].map(
  (p) =>
    `${p.nameEn}${FIELD}${packNe(p.nameNe)}${FIELD}${p.districtCount.toString(
      36
    )}`
);

const districtRecords = [...districts.values()].map(
  (d) =>
    `${d.nameEn}${FIELD}${packNe(d.nameNe)}${FIELD}${d.localLevelCount.toString(
      36
    )}`
);

const localLevelRecords = localLevels.map((l) => {
  const [stemEn, enIdx, enSpace] = splitSuffix(l.nameEn, EN_SUFFIXES);
  const [stemNe, neIdx, neSpace] = splitSuffix(l.nameNe, NE_SUFFIXES);

  assert(enIdx > 0, `unknown English suffix in "${l.nameEn}"`);
  assert(neIdx > 0, `unknown Nepali suffix in "${l.nameNe}"`);
  assert(l.totalWards < 36, `ward count ${l.totalWards} does not fit in base36`);

  // flags: [enSuffix][neSuffix][trailingSpaceBits][wards] - all base36, 4 chars total
  const spaceBits = (enSpace ? 1 : 0) | (neSpace ? 2 : 0);
  const flags =
    enIdx.toString(36) +
    neIdx.toString(36) +
    spaceBits.toString(36) +
    l.totalWards.toString(36);

  return `${stemEn}${FIELD}${packNe(stemNe)}${FIELD}${flags}`;
});

// --- verify round trip ------------------------------------------------------

localLevelRecords.forEach((record, i) => {
  const [stemEn, stemNe, flags] = record.split(FIELD);
  const enIdx = parseInt(flags[0], 36);
  const neIdx = parseInt(flags[1], 36);
  const spaceBits = parseInt(flags[2], 36);
  const wards = parseInt(flags[3], 36);

  const nameEn =
    stemEn + ' ' + EN_SUFFIXES[enIdx - 1] + (spaceBits & 1 ? ' ' : '');
  const nameNe =
    unpackNe(stemNe) + ' ' + NE_SUFFIXES[neIdx - 1] + (spaceBits & 2 ? ' ' : '');

  assert(nameEn === localLevels[i].nameEn, `en round trip failed: ${nameEn}`);
  assert(nameNe === localLevels[i].nameNe, `ne round trip failed: ${nameNe}`);
  assert(wards === localLevels[i].totalWards, `ward round trip failed`);
  assert(record.split(FIELD).length === 3, `field separator leaked into names`);
});

for (const [collection, records] of [
  [[...provinces.values()], provinceRecords],
  [[...districts.values()], districtRecords],
]) {
  records.forEach((record, i) => {
    const parts = record.split(FIELD);
    assert(parts.length === 3, 'field separator leaked into names');
    assert(parts[0] === collection[i].nameEn, 'en round trip failed');
    assert(unpackNe(parts[1]) === collection[i].nameNe, 'ne round trip failed');
  });
}

// --- emit -------------------------------------------------------------------

const BANNER = `// AUTO-GENERATED by scripts/generate-data.mjs - do not edit by hand.\n// Regenerate with: npm run generate\n`;

/** Escapes a value for embedding in a single-quoted TS string literal. */
function literal(value) {
  return (
    "'" +
    value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') +
    "'"
  );
}

writeFileSync(
  join(root, 'src/data/dictionaries.ts'),
  `${BANNER}
/** English local level name suffixes, indexed from 1 in the encoded records. */
export const EN_SUFFIXES: readonly string[] = ${JSON.stringify(EN_SUFFIXES)};

/** Nepali local level name suffixes, indexed from 1 in the encoded records. */
export const NE_SUFFIXES: readonly string[] = ${JSON.stringify(NE_SUFFIXES)};

`
);

writeFileSync(
  join(root, 'src/data/nepaliAlphabet.ts'),
  `${BANNER}
/**
 * Every Devanagari character used by the dataset, in the order the packed
 * records reference them.
 */
export const NE_ALPHABET: string = ${JSON.stringify(neAlphabet.join(''))};

/**
 * ASCII stand-ins for {@link NE_ALPHABET}, position for position. Packed Nepali
 * fields contain only these characters, one byte each.
 *
 * Kept separate from the local level suffix dictionaries so that the province and
 * district entry points do not have to load them.
 */
export const NE_POOL: string = ${JSON.stringify(nePool)};
`
);

writeFileSync(
  join(root, 'src/data/provinces.ts'),
  `${BANNER}
/** \`nameEn|nameNe|districtCount\` per line, ordered by province code (1-based). */
export const PROVINCE_DATA: string = ${literal(provinceRecords.join(RECORD))};
`
);

writeFileSync(
  join(root, 'src/data/districts.ts'),
  `${BANNER}
/** \`nameEn|nameNe|localLevelCount\` per line, ordered by district id (1-based). */
export const DISTRICT_DATA: string = ${literal(districtRecords.join(RECORD))};
`
);

writeFileSync(
  join(root, 'src/data/localLevels.ts'),
  `${BANNER}
/**
 * \`stemEn|stemNe|flags\` per line, ordered by local level code.
 * \`flags\` is four base36 characters: english suffix index, nepali suffix index,
 * trailing-space bitmask and ward count.
 */
export const LOCAL_LEVEL_DATA: string = ${literal(localLevelRecords.join(RECORD))};
`
);

const bytes = (s) => Buffer.byteLength(s, 'utf8');
console.log('provinces  :', provinces.size, 'records,', bytes(provinceRecords.join(RECORD)), 'B');
console.log('districts  :', districts.size, 'records,', bytes(districtRecords.join(RECORD)), 'B');
console.log('localLevels:', localLevels.length, 'records,', bytes(localLevelRecords.join(RECORD)), 'B');
console.log('wards      :', localLevels.reduce((a, l) => a + l.totalWards, 0));
