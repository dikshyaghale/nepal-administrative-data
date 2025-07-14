// Export all types
export * from './types';

// Export all utility functions
export {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
} from './utils';

// Export raw data for advanced use cases
export { rawData } from './data';

// Default export with all functions for convenience
import {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
} from './utils';

// console.log(getProvinceDetails(1), 'province eng');
// console.log(getDistricts('en'), 'district en');
// console.log(getGaPas('ne'), 'gapgas');
// console.log(getDistrictsByProvince(1, 'ne'), 'district filter');
// console.log(getGaPasByDistrict(101, 'ne'), 'gapa filter');

export default {
  getProvinces,
  getDistricts,
  getGaPas,
  getDistrictsByProvince,
  getGaPasByDistrict,
  getProvinceDetails,
  getDistrictDetails,
  getGaPaDetails,
};
