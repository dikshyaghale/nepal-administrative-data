// Demo script showing how to use the Nepal Administrative Data package

const {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
} = require('./dist/index.cjs.js');

console.log('🇳🇵 Nepal Administrative Data Package Demo\n');

// 1. Get all provinces
console.log('1️ All Provinces (English):');
const provinces = getProvinces();
provinces.forEach((p) => console.log(`   ${p.code}: ${p.name}`));

console.log('\n1️ All Provinces (Nepali):');
const provincesNe = getProvinces('ne');
provincesNe.forEach((p) => console.log(`   ${p.code}: ${p.name}`));

// 2. Get all districts
console.log('\n2️⃣ All Districts:');
const districts = getDistricts();
districts.forEach((d) => console.log(`   ${d.code}: ${d.name}`));

// 3. Get all GaPas
console.log('\n3️⃣ All GaPas:');
const gapas = getGaPas();
gapas.forEach((g) => console.log(`   ${g.code}: ${g.name}`));

// 4. Get districts by province
console.log('\n4️⃣ Districts in Koshi Pradesh (Province 1):');
const koshiDistricts = getDistrictsByProvince(1);
koshiDistricts.forEach((d) => console.log(`   ${d.code}: ${d.name}`));

// 5. Get GaPas by district
console.log('\n5️⃣ GaPas in Taplejung District (Code 101):');
const taplejungGapas = getGaPasByDistrict(101);
taplejungGapas.forEach((g) => console.log(`   ${g.code}: ${g.name}`));

// 6. Bilingual comparison
console.log('\n6️⃣ Language Comparison:');
console.log('English vs Nepali Names:');
provinces.forEach((pEn, index) => {
  const pNe = provincesNe[index];
  console.log(`${pEn.code}: ${pEn.name} | ${pNe.name}`);
});

// 7. Detailed information
console.log('\n7️⃣ Detailed Information:');
const provinceDetails = getProvinceDetails(1);
console.log('Province Details:', provinceDetails);

const districtDetails = getDistrictDetails(101);
console.log('District Details:', districtDetails);

const gapaDetails = getGaPaDetails(10101);
console.log('GaPa Details:', gapaDetails);

console.log('\n✅ Demo completed successfully!');
