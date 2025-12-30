/**
 * Dataset Lookup Utilities
 * Functions for looking up values from ordinance tables
 */

import type {
  OrdinanceDataset,
  OccupantLoadEntry,
  MinExitsEntry,
  TravelDistanceEntry,
  MinWidthEntry,
  FunctionalClass,
  FireHazardCategory,
} from './types';

/**
 * Get functional class group (Ф1, Ф2, etc.) from full class code
 */
export function getFunctionalClassGroup(functionalClass: FunctionalClass): string {
  return functionalClass.substring(0, 2);
}

/**
 * Check if a functional class is in the Ф5 group
 */
export function isIndustrialClass(functionalClass: FunctionalClass): boolean {
  return functionalClass.startsWith('Ф5');
}

/**
 * Look up occupant load factor from Table 8
 * Returns area per person in m² or null if not found
 */
export function lookupOccupantLoadFactor(
  table: OccupantLoadEntry[],
  functionalClass: FunctionalClass,
  spaceType?: string,
  isGroundFloor?: boolean
): OccupantLoadEntry | null {
  // First try exact match with space type
  if (spaceType) {
    const exactMatch = table.find(
      entry => entry.functional_class === functionalClass &&
               entry.space_type.toLowerCase().includes(spaceType.toLowerCase())
    );
    if (exactMatch) return exactMatch;
  }

  // Handle special cases for Ф3.1 (trade) with ground floor distinction
  if (functionalClass === 'Ф3.1') {
    const entries = table.filter(e => e.functional_class === 'Ф3.1');
    if (isGroundFloor !== undefined) {
      const match = entries.find(e =>
        isGroundFloor
          ? e.space_type.includes('кота терен')
          : e.space_type.includes('извън')
      );
      if (match) return match;
    }
    // Return ground floor default if not specified
    return entries.find(e => e.space_type.includes('кота терен')) || entries[0] || null;
  }

  // Look for functional class match
  const classMatch = table.find(entry => entry.functional_class === functionalClass);
  if (classMatch) return classMatch;

  // Fallback to general entries for offices/workshops
  const generalEntry = table.find(entry =>
    entry.functional_class === 'general' &&
    entry.space_type.toLowerCase().includes('офис')
  );

  return generalEntry || null;
}

/**
 * Look up minimum number of exits based on occupants and area
 */
export function lookupMinExits(
  table: MinExitsEntry[],
  functionalClass: FunctionalClass,
  occupants: number,
  area_m2: number,
  isUnderground: boolean,
  fireHazardCategory?: FireHazardCategory
): MinExitsEntry | null {
  const classGroup = getFunctionalClassGroup(functionalClass);
  const isF5 = isIndustrialClass(functionalClass);

  // Filter to relevant entries
  const relevantEntries = table.filter(entry => {
    // Match class group
    if (isF5) {
      if (entry.functional_class_group !== 'Ф5') return false;
      // For Ф5, also check category if specified
      if (entry.category && fireHazardCategory && entry.category !== fireHazardCategory) {
        return false;
      }
    } else {
      if (entry.functional_class_group !== 'Ф1-Ф4') return false;
    }

    // Check underground requirement
    if (entry.underground_only && !isUnderground) return false;

    // Check occupant range
    if (occupants < entry.min_occupants) return false;
    if (entry.max_occupants !== null && occupants > entry.max_occupants) return false;

    // Check area limit
    if (entry.max_area_m2 !== null && area_m2 > entry.max_area_m2) return false;

    return true;
  });

  // Return the entry with lowest min_exits that matches
  if (relevantEntries.length === 0) return null;

  return relevantEntries.reduce((min, entry) =>
    entry.min_exits < min.min_exits ? entry : min
  );
}

/**
 * Look up maximum travel distance
 */
export function lookupMaxTravelDistance(
  table: TravelDistanceEntry[],
  evacuationType: 'single_direction' | 'multiple_directions',
  context: 'room' | 'corridor' = 'room',
  fireHazardCategory?: FireHazardCategory,
  hasSpecialConditions?: {
    isSingleStorey?: boolean;
    fireResistanceRating?: string;
    hasSprinklers?: boolean;
    hasFireAlarm?: boolean;
  }
): TravelDistanceEntry | null {
  // Check for special cases first
  if (fireHazardCategory === 'Ф5Г' || fireHazardCategory === 'Ф5Д') {
    if (hasSpecialConditions?.isSingleStorey) {
      const specialEntry = table.find(e =>
        e.evacuation_type === evacuationType &&
        e.context.includes('Ф5Г/Ф5Д') &&
        e.context.includes('едноетажна')
      );
      if (specialEntry) return specialEntry;
    }
  }

  if (fireHazardCategory === 'Ф5В') {
    if (hasSpecialConditions?.hasSprinklers && hasSpecialConditions?.hasFireAlarm) {
      const specialEntry = table.find(e =>
        e.evacuation_type === evacuationType &&
        e.context.includes('Ф5В') &&
        e.context.includes('ПГИ')
      );
      if (specialEntry) return specialEntry;
    }
  }

  // Default lookup based on context
  const contextMap = {
    'room': 'Вътре в помещение',
    'corridor': 'До стълбище/защитена зона'
  };

  const entry = table.find(e =>
    e.evacuation_type === evacuationType &&
    e.context === contextMap[context]
  );

  return entry || null;
}

/**
 * Look up minimum width requirement
 */
export function lookupMinWidth(
  table: MinWidthEntry[],
  elementType: 'exit_door' | 'corridor' | 'stair' | 'stair_step' | 'external_stair' | 'spiral_stair',
  occupants: number,
  isUnderground: boolean = false
): MinWidthEntry | null {
  const entries = table.filter(e => e.element_type === elementType);

  if (entries.length === 0) return null;

  // For elements with per-100-people calculation
  if (elementType === 'corridor' || (elementType === 'stair' && occupants > 200)) {
    const contextMatch = entries.find(e =>
      isUnderground
        ? e.context.toLowerCase().includes('подземни')
        : e.context.toLowerCase().includes('надземни')
    );
    return contextMatch || entries[0];
  }

  // For doors, find by occupant range
  if (elementType === 'exit_door') {
    if (occupants <= 15) return entries.find(e => e.context.includes('15')) || null;
    if (occupants <= 50) return entries.find(e => e.context.includes('16-50') || e.context.includes('50')) || null;
    if (occupants <= 200) return entries.find(e => e.context.includes('200')) || null;
    return entries.find(e => e.context.includes('Над 200')) || null;
  }

  // For spiral stairs
  if (elementType === 'spiral_stair') {
    if (occupants <= 50) return entries.find(e => e.context.includes('16-50')) || null;
    return entries.find(e => e.context.includes('Над 50') || e.context.includes('50 човека')) || null;
  }

  // Return first matching entry
  return entries[0] || null;
}

/**
 * Calculate minimum total exit width based on occupants
 */
export function calculateMinTotalWidth(
  table: MinWidthEntry[],
  occupants: number,
  floorType: 'ground' | 'above' | 'underground'
): number {
  if (occupants <= 200) {
    // Use single width requirements
    const widthEntry = lookupMinWidth(table, 'exit_door', occupants, floorType === 'underground');
    return widthEntry?.min_width_m || 0.9;
  }

  // Calculate based on per-100-people formula
  const entry = table.find(e =>
    e.element_type === 'corridor' || e.element_type === 'stair'
  );

  let widthPer100: number;
  switch (floorType) {
    case 'ground':
      widthPer100 = 0.6; // чл. 41, ал. 4, т. 1
      break;
    case 'above':
      widthPer100 = 0.8; // чл. 41, ал. 4, т. 2
      break;
    case 'underground':
      widthPer100 = 1.2; // чл. 41, ал. 4, т. 3
      break;
  }

  return (occupants / 100) * widthPer100;
}

/**
 * Get descriptive name for functional class
 */
export function getFunctionalClassName(
  dataset: OrdinanceDataset,
  code: FunctionalClass
): string {
  const entry = dataset.tables.functional_classes.find(fc => fc.code === code);
  return entry?.name || code;
}

/**
 * Get height category from building height
 */
export function getHeightCategory(
  dataset: OrdinanceDataset,
  heightM: number
): string {
  const categories = dataset.tables.height_categories;

  for (const cat of categories) {
    const minOk = cat.min_height_m === undefined || heightM >= cat.min_height_m;
    const maxOk = cat.max_height_m === undefined || heightM < cat.max_height_m;
    if (minOk && maxOk) return cat.code;
  }

  return 'МВ'; // Default to highest if not found
}
