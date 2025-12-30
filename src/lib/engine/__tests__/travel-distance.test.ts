/**
 * Travel Distance Rules Tests
 * Tests for evacuation path length validation
 */

import { describe, it, expect } from 'vitest';
import { evaluateTravelDistance } from '../rules/travel-distance';
import {
  dataset,
  createSpace,
  createRoute,
  createProject,
  createBuilding,
  officeBuilding,
  industrialBuilding,
} from './fixtures';
import type { EvaluationContext } from '../types';

describe('evaluateTravelDistance - REVIEW cases', () => {
  it('should return REVIEW when no distance requirement found in table', () => {
    // Create a custom dataset with empty max_travel_distance table to trigger null lookup
    const emptyDistanceDataset = {
      ...dataset,
      tables: {
        ...dataset.tables,
        max_travel_distance: [], // Empty table will cause lookupMaxTravelDistance to return null
      },
    };

    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 25,
            evacuation_type: 'multiple_directions',
          }),
        ],
      }),
      datasets: emptyDistanceDataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(
      f => f.rule_id === 'EGR-TRAVEL-001' && f.subject_id === 'r1'
    );

    expect(routeFinding).toBeDefined();
    expect(routeFinding?.status).toBe('REVIEW');
    expect(routeFinding?.severity).toBe('WARNING');
    expect(routeFinding?.required).toBeNull();
    expect(routeFinding?.measured).toBe(25);
    expect(routeFinding?.details?.evacuation_type).toBe('multiple_directions');
  });

  it('should include route name in REVIEW finding when provided', () => {
    const emptyDistanceDataset = {
      ...dataset,
      tables: {
        ...dataset.tables,
        max_travel_distance: [],
      },
    };

    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', name: 'Test Space' })],
        routes: [
          createRoute({
            id: 'r1',
            name: 'Main Corridor Route',
            from_space_id: 's1',
            length_m: 30,
            evacuation_type: 'single_direction',
          }),
        ],
      }),
      datasets: emptyDistanceDataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-001');

    expect(routeFinding?.subject_name).toBe('Main Corridor Route');
    expect(routeFinding?.details?.from_space_id).toBe('s1');
  });

  it('should use fallback name when route name not provided', () => {
    const emptyDistanceDataset = {
      ...dataset,
      tables: {
        ...dataset.tables,
        max_travel_distance: [],
      },
    };

    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            name: undefined,
            from_space_id: 's1',
            length_m: 30,
            evacuation_type: 'single_direction',
          }),
        ],
      }),
      datasets: emptyDistanceDataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-001');

    // Should use fallback name format
    expect(routeFinding?.subject_name).toContain('r1');
  });
});

describe('evaluateTravelDistance - route length', () => {
  it('should PASS when route length is within limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 20, // Well within typical 40m limit
            evacuation_type: 'multiple_directions',
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(
      f => f.rule_id === 'EGR-TRAVEL-001' && f.subject_id === 'r1'
    );

    expect(routeFinding?.status).toBe('PASS');
  });

  it('should FAIL when route length exceeds limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 100, // Exceeds typical limits
            evacuation_type: 'single_direction',
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(
      f => f.rule_id === 'EGR-TRAVEL-001' && f.subject_id === 'r1'
    );

    expect(routeFinding?.status).toBe('FAIL');
    expect(routeFinding?.severity).toBe('BLOCKER');
  });

  it('should allow longer distances for multiple direction evacuation', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r-single',
            from_space_id: 's1',
            length_m: 35,
            evacuation_type: 'single_direction',
          }),
          createRoute({
            id: 'r-multi',
            from_space_id: 's1',
            length_m: 35,
            evacuation_type: 'multiple_directions',
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);

    const singleFinding = findings.find(f => f.subject_id === 'r-single');
    const multiFinding = findings.find(f => f.subject_id === 'r-multi');

    // Multiple directions should have higher limit
    expect(multiFinding?.required).toBeGreaterThanOrEqual(singleFinding?.required || 0);
  });

  it('should include measured and required distances', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 25,
            evacuation_type: 'multiple_directions',
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const routeFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-001');

    expect(routeFinding?.measured).toBe(25);
    expect(routeFinding?.required).toBeGreaterThan(0);
  });
});

describe('evaluateTravelDistance - dead ends', () => {
  it('should PASS when dead end length is within limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 30,
            has_dead_end: true,
            dead_end_length_m: 10, // Well within 20m limit
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const deadEndFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-002');

    expect(deadEndFinding?.status).toBe('PASS');
  });

  it('should FAIL when dead end length exceeds limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 60,
            has_dead_end: true,
            dead_end_length_m: 45, // Exceeds 40m limit for Ф1-Ф4
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const deadEndFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-002');

    expect(deadEndFinding?.status).toBe('FAIL');
    expect(deadEndFinding?.severity).toBe('BLOCKER');
  });

  it('should not evaluate dead end when has_dead_end is false', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            has_dead_end: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const deadEndFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-002');

    expect(deadEndFinding).toBeUndefined();
  });

  it('should handle industrial buildings with special limits', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: createBuilding({
          functional_class: 'Ф5.1',
          is_single_storey: true,
        }),
        spaces: [
          createSpace({
            id: 's1',
            fire_hazard_category: 'Ф5Г',
          }),
        ],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            has_dead_end: true,
            dead_end_length_m: 30, // May be allowed for Ф5Г/Ф5Д
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateTravelDistance(ctx);
    const deadEndFinding = findings.find(f => f.rule_id === 'EGR-TRAVEL-002');

    // Industrial buildings may have different limits
    expect(deadEndFinding).toBeDefined();
    expect(deadEndFinding?.required).toBeGreaterThan(20);
  });
});

describe('evaluateTravelDistance - determinism', () => {
  it('should produce identical results for identical input', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1' })],
        routes: [
          createRoute({
            id: 'r1',
            from_space_id: 's1',
            length_m: 35,
            has_dead_end: true,
            dead_end_length_m: 15,
          }),
        ],
      }),
      datasets: dataset,
    };

    const result1 = evaluateTravelDistance(ctx);
    const result2 = evaluateTravelDistance(ctx);

    expect(result1).toEqual(result2);
  });
});
