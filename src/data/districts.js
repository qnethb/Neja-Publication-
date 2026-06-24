// Sri Lanka's 25 administrative districts, grouped into delivery fee tiers.
// Fees are illustrative LKR amounts a small publisher might charge by zone.

const ZONE_FEES = {
  colombo: 250, // Western province core — cheapest
  suburban: 350, // nearby provinces
  outstation: 450, // further districts
}

export const districts = [
  { id: 'colombo', en: 'Colombo', si: 'කොළඹ', fee: ZONE_FEES.colombo },
  { id: 'gampaha', en: 'Gampaha', si: 'ගම්පහ', fee: ZONE_FEES.colombo },
  { id: 'kalutara', en: 'Kalutara', si: 'කළුතර', fee: ZONE_FEES.suburban },
  { id: 'kandy', en: 'Kandy', si: 'මහනුවර', fee: ZONE_FEES.suburban },
  { id: 'matale', en: 'Matale', si: 'මාතලේ', fee: ZONE_FEES.outstation },
  { id: 'nuwara-eliya', en: 'Nuwara Eliya', si: 'නුවරඑළිය', fee: ZONE_FEES.outstation },
  { id: 'galle', en: 'Galle', si: 'ගාල්ල', fee: ZONE_FEES.suburban },
  { id: 'matara', en: 'Matara', si: 'මාතර', fee: ZONE_FEES.outstation },
  { id: 'hambantota', en: 'Hambantota', si: 'හම්බන්තොට', fee: ZONE_FEES.outstation },
  { id: 'jaffna', en: 'Jaffna', si: 'යාපනය', fee: ZONE_FEES.outstation },
  { id: 'kilinochchi', en: 'Kilinochchi', si: 'කිලිනොච්චිය', fee: ZONE_FEES.outstation },
  { id: 'mannar', en: 'Mannar', si: 'මන්නාරම', fee: ZONE_FEES.outstation },
  { id: 'vavuniya', en: 'Vavuniya', si: 'වවුනියාව', fee: ZONE_FEES.outstation },
  { id: 'mullaitivu', en: 'Mullaitivu', si: 'මුලතිව්', fee: ZONE_FEES.outstation },
  { id: 'batticaloa', en: 'Batticaloa', si: 'මඩකලපුව', fee: ZONE_FEES.outstation },
  { id: 'ampara', en: 'Ampara', si: 'අම්පාර', fee: ZONE_FEES.outstation },
  { id: 'trincomalee', en: 'Trincomalee', si: 'ත්‍රිකුණාමලය', fee: ZONE_FEES.outstation },
  { id: 'kurunegala', en: 'Kurunegala', si: 'කුරුණෑගල', fee: ZONE_FEES.suburban },
  { id: 'puttalam', en: 'Puttalam', si: 'පුත්තලම', fee: ZONE_FEES.outstation },
  { id: 'anuradhapura', en: 'Anuradhapura', si: 'අනුරාධපුරය', fee: ZONE_FEES.outstation },
  { id: 'polonnaruwa', en: 'Polonnaruwa', si: 'පොළොන්නරුව', fee: ZONE_FEES.outstation },
  { id: 'badulla', en: 'Badulla', si: 'බදුල්ල', fee: ZONE_FEES.outstation },
  { id: 'monaragala', en: 'Monaragala', si: 'මොණරාගල', fee: ZONE_FEES.outstation },
  { id: 'ratnapura', en: 'Ratnapura', si: 'රත්නපුර', fee: ZONE_FEES.suburban },
  { id: 'kegalle', en: 'Kegalle', si: 'කෑගල්ල', fee: ZONE_FEES.suburban },
]

// Orders at or above this LKR subtotal qualify for free island-wide delivery.
export const FREE_DELIVERY_THRESHOLD = 5000

export function getDistrict(id) {
  return districts.find((d) => d.id === id) || null
}
