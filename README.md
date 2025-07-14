# Nepal Administrative Data

A comprehensive NPM package providing utility functions for Nepali administrative data including provinces, districts, and Gaunpalika/Nagarpalika (GaPa) with bilingual support for both English and Nepali languages.

## Features

- ✅ Get all provinces with codes and names
- ✅ Get all districts with codes and names
- ✅ Get all GaPas (Gaunpalika/Nagarpalika) with codes and names
- ✅ Filter districts by province
- ✅ Filter GaPas by district
- ✅ Bilingual support (English and Nepali)
- ✅ TypeScript support with full type definitions
- ✅ Works in both Node.js and React/browser environments
- ✅ Optimized for performance with efficient data lookup
- ✅ Zero dependencies

## Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher

## Installation

```bash
npm install nepal-administrative-data
```

## API Reference

### Core Functions

#### `getProvinces(language?: 'en' | 'ne'): NameCodePair[]`

Returns all provinces with their codes and names.

```javascript
const provinces = getProvinces(); // English (default)
const provincesNe = getProvinces('ne'); // Nepali
// Returns: [{ code: 1, name: "Koshi Pradesh" }, ...]
```

#### `getDistricts(language?: 'en' | 'ne'): NameCodePair[]`

Returns all districts with their codes and names.

```javascript
const districts = getDistricts(); // English
const districtsNe = getDistricts('ne'); // Nepali
// Returns: [{ code: 101, name: "Taplejung" }, ...]
```

#### `getGaPas(language?: 'en' | 'ne'): NameCodePair[]`

Returns all GaPas (municipalities) with their codes and names.

```javascript
const gapas = getGaPas(); // English
const gapasNe = getGaPas('ne'); // Nepali
// Returns: [{ code: 10101, name: "Phaktanlung Gaunpalika", totalWard: 7 }, ...]
```

#### `getDistrictsByProvince(provinceCode: number, language?: 'en' | 'ne'): NameCodePair[]`

Returns districts within a specific province.

```javascript
const districts = getDistrictsByProvince(1); // Koshi Pradesh districts
const districtsNe = getDistrictsByProvince(1, 'ne'); // In Nepali
// Returns: [{ code: 101, name: "Taplejung" }, ...]
```

#### `getGaPasByDistrict(districtCode: number, language?: 'en' | 'ne'): NameCodePair[]`

Returns GaPas within a specific district.

```javascript
const gapas = getGaPasByDistrict(101); // Taplejung GaPas
const gapasNe = getGaPasByDistrict(101, 'ne'); // In Nepali
// Returns: [{ code: 10101, name: "Phaktanlung Gaunpalika", totalWard: 7 }, ...]
```

### Detailed Information Functions

#### `getProvinceDetails(provinceCode: number): Province | null`

Returns detailed information about a specific province.

```javascript
const province = getProvinceDetails(1);
// Returns: { id: 1, code: 1, nameEn: "Koshi Pradesh", nameNe: "कोशी प्रदेश" }
```

#### `getDistrictDetails(districtCode: number): District | null`

Returns detailed information about a specific district.

```javascript
const district = getDistrictDetails(101);
// Returns: { id: 1, code: 101, nameEn: "Taplejung", nameNe: "ताप्लेजुङ", provinceId: 1, provinceCode: 1 }
```

#### `getGaPaDetails(gapaCode: number): GaPa | null`

Returns detailed information about a specific GaPa.

```javascript
const gapa = getGaPaDetails(10101);
// Returns: { id: 1, code: 10101, nameEn: "Phaktanlung Gaunpalika", nameNe: "फक्ताङ्लुङ्ग गाउँपालिका", districtId: 1, districtCode: 101, provinceId: 1, totalWards: 7 }
```

## TypeScript Support

This package includes full TypeScript definitions. All types are exported:

```typescript
import {
  Language,
  Province,
  District,
  GaPa,
  NameCodePair,
} from 'nepal-administrative-data';

// Language type
const lang: Language = 'en' | 'ne';

// Using interfaces
const province: Province = getProvinceDetails(1);
const districts: NameCodePair[] = getDistricts();
```

### Available Types

- `Language`: `'en' | 'ne'`
- `NameCodePair`: `{ code: number; name: string }`
- `Province`: Complete province information
- `District`: Complete district information
- `GaPa`: Complete GaPa/municipality information

## Examples

### Building an Address Form

Check the `/examples` directory for complete React and Node.js examples:

- `examples/react-example.tsx` - Complete React address selector with language switching
- `examples/nodejs-example.js` - Interactive CLI application

### Language Support

```javascript
// English names (default)
const provincesEn = getProvinces('en');
console.log(provincesEn[0].name); // "Koshi Pradesh"

// Nepali names
const provincesNe = getProvinces('ne');
console.log(provincesNe[0].name); // "कोशी प्रदेश"

// Switch languages dynamically
function getLocalizedProvinces(language) {
  return getProvinces(language);
}
```

### Error Handling

```javascript
try {
  const districts = getDistrictsByProvince(999); // Invalid province
} catch (error) {
  console.error(error.message); // "Province with ID/code 999 not found"
}

// Check if data exists
const province = getProvinceDetails(1);
if (province) {
  console.log(`Found: ${province.nameEn}`);
} else {
  console.log('Province not found');
}
```

## Browser Support

The package works in all modern browsers and provides multiple build formats:

- **ES Modules**: `dist/index.esm.js` (for modern bundlers)
- **CommonJS**: `dist/index.cjs.js` (for Node.js)
- **UMD**: `dist/index.umd.js` (for direct browser inclusion)

For direct browser usage:

```html
<script src="https://unpkg.com/nepal-administrative-data/dist/index.umd.js"></script>
<script>
  const provinces = NepalAdministrativeData.getProvinces();
  console.log(provinces);
</script>
```

## Performance

- **Fast Lookup**: Data is processed once and cached in memory using Maps for O(1) lookups
- **Small Bundle**: Minimal footprint with zero runtime dependencies
- **Tree Shaking**: ES modules support for optimal bundling in modern applications

## Data Structure

The package includes hierarchical data for:

- **7 Provinces** with unique codes and bilingual names
- **77 Districts** mapped to their respective provinces
- **753 GaPas/Municipalities** mapped to their respective districts
- **Ward Information** for each GaPa/municipality

All data is properly structured with unique identifiers and hierarchical relationships.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Run tests: `npm test`
5. Build the package: `npm run build`
6. Commit your changes: `git commit -am 'Add new feature'`
7. Push to branch: `git push origin feature/new-feature`
8. Submit a Pull Request

## Development

### Prerequisites

Ensure you have Node.js 18+ installed:

```bash
node --version  # Should show v18.0.0 or higher
```

If you need to upgrade Node.js:

- Download from [nodejs.org](https://nodejs.org/)
- Or use a version manager like [nvm](https://github.com/nvm-sh/nvm)

### Setup

```bash
# Clone the repository
git clone https://github.com/dikshyaghale/nepal-administrative-data.git
cd nepal-administrative-data

# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Run demo
node demo.js
```

### Development Commands

```bash
# Run tests in watch mode
npx jest --watch

# Generate coverage report
npx jest --coverage

# Build for production
npx rollup -c

# Clean and rebuild
rm -rf dist && npx rollup -c
```

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0

- Initial release
- Complete administrative data for Nepal
- Bilingual support (English/Nepali)
- TypeScript support
- Multiple build formats (ES, CommonJS, UMD)
- Comprehensive test suite
- React and Node.js examples
