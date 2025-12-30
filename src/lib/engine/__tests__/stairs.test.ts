/**
 * Stair Rules Tests
 * Tests for stair dimension and requirement validation
 */

import { describe, it, expect } from 'vitest';
import { evaluateStairs } from '../rules/stairs';
import {
  dataset,
  createSpace,
  createStair,
  createProject,
  officeBuilding,
} from './fixtures';
import type { EvaluationContext } from '../types';

describe('evaluateStairs - stair width', () => {
  it('should PASS when stair width meets requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1, area_m2: 100 })],
        stairs: [
          createStair({
            id: 'st1',
            width_m: 1.2,
            serves_floors: [0, 1],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const widthFinding = findings.find(
      f => f.rule_id === 'EGR-STAIR-001' && f.subject_id === 'st1'
    );

    expect(widthFinding?.status).toBe('PASS');
  });

  it('should FAIL when stair width is below requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1, area_m2: 100 })],
        stairs: [
          createStair({
            id: 'st1',
            width_m: 0.7, // Below 0.9m minimum
            serves_floors: [0, 1],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const widthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-001');

    expect(widthFinding?.status).toBe('FAIL');
    expect(widthFinding?.severity).toBe('BLOCKER');
  });

  it('should require wider stair for large occupancy', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', floor: 1, area_m2: 1000 }), // ~200 people
          createSpace({ id: 's2', floor: 2, area_m2: 1000 }), // ~200 people
        ],
        stairs: [
          createStair({
            id: 'st1',
            width_m: 1.2, // May not be enough for 400 people
            serves_floors: [0, 1, 2],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const widthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-001');

    expect(widthFinding?.required).toBeGreaterThan(0.9);
  });

  it('should warn when stair width exceeds 2.4m', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1, area_m2: 100 })],
        stairs: [
          createStair({
            id: 'st1',
            width_m: 2.8, // Exceeds 2.4m max
            serves_floors: [0, 1],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const maxWidthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-002');

    expect(maxWidthFinding?.status).toBe('REVIEW');
    expect(maxWidthFinding?.severity).toBe('WARNING');
  });
});

describe('evaluateStairs - spiral stairs', () => {
  it('should require 1.2m width for spiral stairs ≤50 people', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1, area_m2: 100 })], // ~20 people
        stairs: [
          createStair({
            id: 'st1',
            type: 'spiral',
            width_m: 1.2,
            serves_floors: [0, 1],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const widthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-001');

    expect(widthFinding?.status).toBe('PASS');
    expect(widthFinding?.required).toBe(1.2);
  });

  it('should require 1.5m width for spiral stairs >50 people', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1, area_m2: 500 })], // ~100 people
        stairs: [
          createStair({
            id: 'st1',
            type: 'spiral',
            width_m: 1.2, // Not enough for >50 people
            serves_floors: [0, 1],
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const widthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-001');

    expect(widthFinding?.status).toBe('FAIL');
    expect(widthFinding?.required).toBe(1.5);
  });
});

describe('evaluateStairs - step dimensions', () => {
  it('should PASS when step width meets requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1 })],
        stairs: [
          createStair({
            id: 'st1',
            serves_floors: [0, 1],
            step_width_m: 0.30, // Above 0.25m minimum
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const stepWidthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-003');

    expect(stepWidthFinding?.status).toBe('PASS');
  });

  it('should FAIL when step width is below requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1 })],
        stairs: [
          createStair({
            id: 'st1',
            serves_floors: [0, 1],
            step_width_m: 0.20, // Below 0.25m minimum
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const stepWidthFinding = findings.find(f => f.rule_id === 'EGR-STAIR-003');

    expect(stepWidthFinding?.status).toBe('FAIL');
    expect(stepWidthFinding?.severity).toBe('BLOCKER');
  });

  it('should PASS when step height is within limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1 })],
        stairs: [
          createStair({
            id: 'st1',
            serves_floors: [0, 1],
            step_height_m: 0.18, // Below 0.22m max
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const stepHeightFinding = findings.find(f => f.rule_id === 'EGR-STAIR-004');

    expect(stepHeightFinding?.status).toBe('PASS');
  });

  it('should FAIL when step height exceeds limit', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1 })],
        stairs: [
          createStair({
            id: 'st1',
            serves_floors: [0, 1],
            step_height_m: 0.25, // Exceeds 0.22m max for internal
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const stepHeightFinding = findings.find(f => f.rule_id === 'EGR-STAIR-004');

    expect(stepHeightFinding?.status).toBe('FAIL');
  });

  it('should allow higher steps for external stairs', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', floor: 1 })],
        stairs: [
          createStair({
            id: 'st1',
            type: 'external',
            serves_floors: [0, 1],
            step_height_m: 0.24, // Allowed for external (max 0.25m)
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const stepHeightFinding = findings.find(f => f.rule_id === 'EGR-STAIR-004');

    expect(stepHeightFinding?.status).toBe('PASS');
  });
});

describe('evaluateStairs - lighting and ventilation', () => {
  it('should FAIL when enclosed stair serves >3 floors without lighting/ventilation', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's0', floor: 0 }),
          createSpace({ id: 's1', floor: 1 }),
          createSpace({ id: 's2', floor: 2 }),
          createSpace({ id: 's3', floor: 3 }),
        ],
        stairs: [
          createStair({
            id: 'st1',
            type: 'enclosed',
            serves_floors: [0, 1, 2, 3],
            is_naturally_lit: false,
            has_smoke_vent: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const lightingFinding = findings.find(f => f.rule_id === 'EGR-STAIR-005');

    expect(lightingFinding?.status).toBe('FAIL');
    expect(lightingFinding?.severity).toBe('BLOCKER');
  });

  it('should PASS when enclosed stair has natural lighting', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's0', floor: 0 }),
          createSpace({ id: 's1', floor: 1 }),
          createSpace({ id: 's2', floor: 2 }),
          createSpace({ id: 's3', floor: 3 }),
        ],
        stairs: [
          createStair({
            id: 'st1',
            type: 'enclosed',
            serves_floors: [0, 1, 2, 3],
            is_naturally_lit: true,
            has_smoke_vent: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const lightingFinding = findings.find(f => f.rule_id === 'EGR-STAIR-005');

    expect(lightingFinding).toBeUndefined();
  });

  it('should PASS when enclosed stair has smoke ventilation', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's0', floor: 0 }),
          createSpace({ id: 's1', floor: 1 }),
          createSpace({ id: 's2', floor: 2 }),
          createSpace({ id: 's3', floor: 3 }),
        ],
        stairs: [
          createStair({
            id: 'st1',
            type: 'enclosed',
            serves_floors: [0, 1, 2, 3],
            is_naturally_lit: false,
            has_smoke_vent: true,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const lightingFinding = findings.find(f => f.rule_id === 'EGR-STAIR-005');

    expect(lightingFinding).toBeUndefined();
  });

  it('should not require lighting/vent for stairs serving ≤3 floors', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's0', floor: 0 }),
          createSpace({ id: 's1', floor: 1 }),
          createSpace({ id: 's2', floor: 2 }),
        ],
        stairs: [
          createStair({
            id: 'st1',
            type: 'enclosed',
            serves_floors: [0, 1, 2],
            is_naturally_lit: false,
            has_smoke_vent: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateStairs(ctx);
    const lightingFinding = findings.find(f => f.rule_id === 'EGR-STAIR-005');

    expect(lightingFinding).toBeUndefined();
  });
});

describe('evaluateStairs - determinism', () => {
  it('should produce identical results for identical input', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', floor: 1, area_m2: 200 }),
          createSpace({ id: 's2', floor: 2, area_m2: 200 }),
        ],
        stairs: [
          createStair({
            id: 'st1',
            serves_floors: [0, 1, 2],
            width_m: 1.2,
            step_width_m: 0.28,
            step_height_m: 0.18,
          }),
        ],
      }),
      datasets: dataset,
    };

    const result1 = evaluateStairs(ctx);
    const result2 = evaluateStairs(ctx);

    expect(result1).toEqual(result2);
  });
});
