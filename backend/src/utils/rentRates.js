/**
 * Predefined monthly rent amounts (KES) by unit type.
 * Deposit for every tenant = 1 month's rent.
 */
export const RENT_RATES = {
  THREE_BEDROOM: 30000,
  TWO_BEDROOM: 20000,
  ONE_BEDROOM: 10000,
  BEDSITTER: 7000,
  SINGLE_ROOM: 4000,
  // Business types — no fixed rate; set manually per unit
  SHOP: null,
  OFFICE: null,
};

// Default water rate — can be overridden per property/agent via request param
export const DEFAULT_WATER_RATE_PER_UNIT = 100; // KES per water unit

export function getRentForType(unitType) {
  return RENT_RATES[unitType] ?? null;
}
