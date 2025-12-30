/**
 * Lookup Utilities Tests
 * Tests for dataset lookup functions
 */

import { describe, it, expect } from 'vitest';
import {
  getFunctionalClassGroup,
  isIndustrialClass,
  lookupOccupantLoadFactor,
  lookupMinExits,
  lookupMaxTravelDistance,
  lookupMinWidth,
  calculateMinTotalWidth,
} from '../lookup';
import { dataset } from './fixtures';

describe('getFunctionalClassGroup', () => {
  it('should extract class group from full class code', () => {
    expect(getFunctionalClassGroup('Ф1.1')).toBe('Ф1');
    expect(getFunctionalClassGroup('Ф2.3')).toBe('Ф2');
    expect(getFunctionalClassGroup('Ф3.1')).toBe('Ф3');
    expect(getFunctionalClassGroup('Ф4.2')).toBe('Ф4');
    expect(getFunctionalClassGroup('Ф5.3')).toBe('Ф5');
  });
});

describe('isIndustrialClass', () => {
  it('should return true for Ф5 classes', () => {
    expect(isIndustrialClass('Ф5.1')).toBe(true);
    expect(isIndustrialClass('Ф5.2')).toBe(true);
    expect(isIndustrialClass('Ф5.3')).toBe(true);
  });

  it('should return false for non-Ф5 classes', () => {
    expect(isIndustrialClass('Ф1.1')).toBe(false);
    expect(isIndustrialClass('Ф2.1')).toBe(false);
    expect(isIndustrialClass('Ф3.1')).toBe(false);
    expect(isIndustrialClass('Ф4.1')).toBe(false);
  });
});

describe('lookupOccupantLoadFactor', () => {
  const table = dataset.tables.occupant_load_table_8;

  it('should find occupant load for retail at ground level (Ф3.1)', () => {
    const entry = lookupOccupantLoadFactor(table, 'Ф3.1', 'retail', true);
    expect(entry).not.toBeNull();
    expect(entry?.area_per_person_m2).toBe(2.0); // Ground level retail
  });

  it('should find occupant load for retail above ground level (Ф3.1)', () => {
    const entry = lookupOccupantLoadFactor(table, 'Ф3.1', 'retail', false);
    expect(entry).not.toBeNull();
    expect(entry?.area_per_person_m2).toBe(3.0); // Above ground retail
  });

  it('should fall back to general entry for non-existent functional class', () => {
    const entry = lookupOccupantLoadFactor(table, 'Ф9.9' as any, 'unknown');
    // Falls back to general entry (offices/workshops)
    expect(entry).not.toBeNull();
    expect(entry?.functional_class).toBe('general');
  });

  it('should find entry for catering (Ф3.2)', () => {
    const entry = lookupOccupantLoadFactor(table, 'Ф3.2', 'restaurant');
    expect(entry).not.toBeNull();
    expect(entry?.area_per_person_m2).toBe(1.0);
  });

  it('should find entry for museums (Ф2.1)', () => {
    const entry = lookupOccupantLoadFactor(table, 'Ф2.1');
    expect(entry).not.toBeNull();
    expect(entry?.area_per_person_m2).toBe(1.35);
  });
});

describe('lookupMinExits', () => {
  const table = dataset.tables.min_exits_by_occupants;

  it('should find min exits for small occupancy (≤50 people)', () => {
    const entry = lookupMinExits(table, 'Ф4.1', 30, 150, false);
    expect(entry).not.toBeNull();
    expect(entry?.min_exits).toBe(1);
  });

  it('should find min exits for medium occupancy (51-200 people)', () => {
    const entry = lookupMinExits(table, 'Ф4.1', 100, 500, false);
    expect(entry).not.toBeNull();
    expect(entry?.min_exits).toBeGreaterThanOrEqual(2);
  });

  it('should find min exits for large occupancy (>200 people)', () => {
    const entry = lookupMinExits(table, 'Ф4.1', 500, 2500, false);
    expect(entry).not.toBeNull();
    expect(entry?.min_exits).toBeGreaterThanOrEqual(2);
  });

  it('should handle underground spaces', () => {
    const entry = lookupMinExits(table, 'Ф4.1', 100, 500, true);
    expect(entry).not.toBeNull();
  });
});

describe('lookupMaxTravelDistance', () => {
  const table = dataset.tables.max_travel_distance;

  it('should find distance for single direction evacuation', () => {
    const entry = lookupMaxTravelDistance(table, 'single_direction', 'room');
    expect(entry).not.toBeNull();
    expect(entry?.max_distance_m).toBeGreaterThan(0);
  });

  it('should find distance for multiple direction evacuation', () => {
    const entry = lookupMaxTravelDistance(table, 'multiple_directions', 'room');
    expect(entry).not.toBeNull();
    expect(entry?.max_distance_m).toBeGreaterThan(0);
  });

  it('should return higher limit for multiple directions than single', () => {
    const single = lookupMaxTravelDistance(table, 'single_direction', 'room');
    const multiple = lookupMaxTravelDistance(table, 'multiple_directions', 'room');

    if (single && multiple) {
      expect(multiple.max_distance_m).toBeGreaterThanOrEqual(single.max_distance_m);
    }
  });
});

describe('lookupMinWidth', () => {
  const table = dataset.tables.min_widths;

  it('should find min width for exit door with small occupancy', () => {
    const entry = lookupMinWidth(table, 'exit_door', 10, false);
    expect(entry).not.toBeNull();
    // For ≤15 people, min_width_m is null (allows less than 0.9m)
    expect(entry?.min_width_m).toBeNull();
  });

  it('should find min width for exit door with medium occupancy', () => {
    const entry = lookupMinWidth(table, 'exit_door', 100, false);
    expect(entry).not.toBeNull();
    expect(entry?.min_width_m).toBeGreaterThanOrEqual(0.9);
  });
});

describe('calculateMinTotalWidth', () => {
  const table = dataset.tables.min_widths;

  it('should calculate width for small occupancy (≤200)', () => {
    const width = calculateMinTotalWidth(table, 100, 'ground');
    expect(width).toBeGreaterThanOrEqual(0.9);
  });

  it('should calculate width for large occupancy (>200)', () => {
    const width = calculateMinTotalWidth(table, 500, 'above');
    // 500 people * 0.8m/100 = 4.0m for above ground
    expect(width).toBe(4.0);
  });

  it('should use higher multiplier for underground floors', () => {
    const groundWidth = calculateMinTotalWidth(table, 500, 'ground');
    const undergroundWidth = calculateMinTotalWidth(table, 500, 'underground');
    // Underground should require more width per person
    expect(undergroundWidth).toBeGreaterThan(groundWidth);
  });
});
