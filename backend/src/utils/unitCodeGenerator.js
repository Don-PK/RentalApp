/**
 * Generate unit code based on floor index and unit number.
 * Ground floor (index 0): GF1, GF2, GF3...
 * 1st floor (index 1):    A1,  A2,  A3...
 * 2nd floor (index 2):    B1,  B2,  B3...
 */
export function generateUnitCode(floorIndex, unitNumber) {
  if (floorIndex === 0) {
    return `GF${unitNumber}`;
  }
  const floorLetter = String.fromCharCode(64 + floorIndex); // 1->A, 2->B …
  return `${floorLetter}${unitNumber}`;
}

/**
 * Generate flat unit data array from a per-floor configuration.
 *
 * @param {Array<{ units: Array<{ unitType: string }> }>} floors
 *   Array indexed by floor (index 0 = ground floor).
 *   Each entry has a `units` array where every element represents one unit
 *   and carries its own `unitType`.
 *
 * @returns {Array<{ unitCode: string, floor: number, unitType: string }>}
 */
export function generateAllUnitData(floors) {
  const result = [];

  floors.forEach((floorConfig, floorIndex) => {
    floorConfig.units.forEach((unit, unitIdx) => {
      result.push({
        unitCode: generateUnitCode(floorIndex, unitIdx + 1),
        floor: floorIndex,
        unitType: unit.unitType,
        rent: unit.rent ? parseFloat(unit.rent) : null,
      });
    });
  });

  return result;
}
