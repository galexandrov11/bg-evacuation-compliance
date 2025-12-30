/**
 * Occupant Load Rules Tests
 * Tests for occupant calculation and validation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateOccupantLoad,
  calculateTotalOccupants,
  evaluateOccupantLoad,
} from '../rules/occupant-load';
import {
  dataset,
  createSpace,
  createProject,
  createBuilding,
  retailBuilding,
  officeBuilding,
} from './fixtures';
import type { EvaluationContext } from '../types';

describe('calculateOccupantLoad', () => {
  it('should calculate occupants based on area and load factor', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: retailBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 100, floor: 0 })],
      }),
      datasets: dataset,
    };

    const result = calculateOccupantLoad(ctx.project.spaces[0], ctx);

    // Retail at ground level: 2.0 m²/person
    // 100m² / 2.0 = 50 people
    expect(result.computed_occupants).toBe(50);
    expect(result.occupant_source).toBe('calculated');
    expect(result.area_per_person_m2).toBe(2.0);
  });

  it('should use override when provided', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: retailBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 100, occupants_override: 75 })],
      }),
      datasets: dataset,
    };

    const result = calculateOccupantLoad(ctx.project.spaces[0], ctx);

    expect(result.computed_occupants).toBe(75);
    expect(result.occupant_source).toBe('override');
    expect(result.area_per_person_m2).toBeNull();
  });

  it('should use default factor when no match found', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: createBuilding({ functional_class: 'Ф1.4' }), // Uncommon class
        spaces: [createSpace({ id: 's1', area_m2: 100, purpose: 'unknown' })],
      }),
      datasets: dataset,
    };

    const result = calculateOccupantLoad(ctx.project.spaces[0], ctx);

    // Default is 5.0 m²/person
    expect(result.computed_occupants).toBe(20); // 100 / 5.0
    expect(result.area_per_person_m2).toBe(5.0);
  });

  it('should round up occupant count', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: retailBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 101, floor: 0 })],
      }),
      datasets: dataset,
    };

    const result = calculateOccupantLoad(ctx.project.spaces[0], ctx);

    // 101 / 2.0 = 50.5, should round up to 51
    expect(result.computed_occupants).toBe(51);
  });

  it('should differentiate ground floor vs upper floors for retail', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: retailBuilding,
        spaces: [
          createSpace({ id: 'ground', area_m2: 100, floor: 0 }),
          createSpace({ id: 'upper', area_m2: 100, floor: 1 }),
        ],
      }),
      datasets: dataset,
    };

    const groundResult = calculateOccupantLoad(ctx.project.spaces[0], ctx);
    const upperResult = calculateOccupantLoad(ctx.project.spaces[1], ctx);

    // Ground: 2.0 m²/person = 50 people
    // Upper: 3.0 m²/person = 34 people (rounded up from 33.33)
    expect(groundResult.computed_occupants).toBe(50);
    expect(upperResult.computed_occupants).toBe(34);
  });
});

describe('calculateTotalOccupants', () => {
  it('should sum occupants across all spaces', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', area_m2: 100 }),
          createSpace({ id: 's2', area_m2: 200 }),
          createSpace({ id: 's3', area_m2: 150 }),
        ],
      }),
      datasets: dataset,
    };

    const result = calculateTotalOccupants(ctx);

    expect(result.total).toBeGreaterThan(0);
    expect(result.bySpace).toHaveLength(3);
  });

  it('should return zero for empty spaces array', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [],
      }),
      datasets: dataset,
    };

    const result = calculateTotalOccupants(ctx);

    expect(result.total).toBe(0);
    expect(result.bySpace).toHaveLength(0);
  });
});

describe('evaluateOccupantLoad', () => {
  it('should generate INFO finding for each space', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', area_m2: 100 }),
          createSpace({ id: 's2', area_m2: 200 }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateOccupantLoad(ctx);

    // At least one finding per space
    expect(findings.length).toBeGreaterThanOrEqual(2);

    // All EGR-OCC-001 findings should be INFO and PASS
    const occFindings = findings.filter(f => f.rule_id === 'EGR-OCC-001');
    expect(occFindings).toHaveLength(2);
    occFindings.forEach(f => {
      expect(f.status).toBe('PASS');
      expect(f.severity).toBe('INFO');
    });
  });

  it('should use general fallback when no exact match found', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: createBuilding({ functional_class: 'Ф1.4' }),
        spaces: [createSpace({ id: 's1', purpose: 'unusual space type' })],
      }),
      datasets: dataset,
    };

    const findings = evaluateOccupantLoad(ctx);

    // Should have at least INFO finding about occupant calculation
    const infoFindings = findings.filter(
      f => f.rule_id === 'EGR-OCC-001' && f.status === 'PASS'
    );
    expect(infoFindings.length).toBeGreaterThan(0);
  });

  it('should include legal reference in all findings', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 100 })],
      }),
      datasets: dataset,
    };

    const findings = evaluateOccupantLoad(ctx);

    findings.forEach(f => {
      expect(f.legal_reference).toBeTruthy();
      // Legal references contain article numbers (чл.)
      expect(f.legal_reference).toMatch(/чл\./);
    });
  });
});

describe('evaluateOccupantLoad - REVIEW warnings', () => {
  it('should generate WARNING finding when no load factor found', () => {
    // Use a dataset with empty occupant load table to trigger default factor and warning
    const emptyLoadTableDataset = {
      ...dataset,
      tables: {
        ...dataset.tables,
        occupant_load_table_8: [], // Empty table will cause lookup to return null
      },
    };

    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 100, purpose: 'test-space' })],
      }),
      datasets: emptyLoadTableDataset,
    };

    const findings = evaluateOccupantLoad(ctx);

    // Should have the INFO finding with default calculation
    const infoFinding = findings.find(
      f => f.rule_id === 'EGR-OCC-001' && f.subject_id === 's1'
    );
    expect(infoFinding).toBeDefined();
    expect(infoFinding?.status).toBe('PASS');

    // Should also have a WARNING finding about using default factor (EGR-OCC-002)
    const warningFinding = findings.find(
      f => f.rule_id === 'EGR-OCC-002' && f.subject_id === 's1'
    );
    expect(warningFinding).toBeDefined();
    expect(warningFinding?.status).toBe('REVIEW');
    expect(warningFinding?.severity).toBe('WARNING');
    expect(warningFinding?.details?.default_used).toBe(5.0);
  });

  it('should use default 5.0 m2/person when no load entry found', () => {
    // Use a dataset with empty occupant load table
    const emptyLoadTableDataset = {
      ...dataset,
      tables: {
        ...dataset.tables,
        occupant_load_table_8: [],
      },
    };

    const ctx: EvaluationContext = {
      project: createProject({
        building: createBuilding({ functional_class: 'Ф4.1' }),
        spaces: [createSpace({ id: 's1', area_m2: 50, purpose: 'unknown-type' })],
      }),
      datasets: emptyLoadTableDataset,
    };

    const result = calculateOccupantLoad(ctx.project.spaces[0], ctx);

    // 50m2 / 5.0 = 10 people
    expect(result.computed_occupants).toBe(10);
    expect(result.occupant_source).toBe('calculated');
    expect(result.area_per_person_m2).toBe(5.0);
  });
});

describe('determinism', () => {
  it('should produce identical results for identical input', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: retailBuilding,
        spaces: [
          createSpace({ id: 's1', area_m2: 150, floor: 0 }),
          createSpace({ id: 's2', area_m2: 75, floor: 1 }),
        ],
      }),
      datasets: dataset,
    };

    const result1 = evaluateOccupantLoad(ctx);
    const result2 = evaluateOccupantLoad(ctx);

    expect(result1).toEqual(result2);
  });
});
