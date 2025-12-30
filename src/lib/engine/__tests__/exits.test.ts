/**
 * Exit Rules Tests
 * Tests for exit count and width validation
 */

import { describe, it, expect } from 'vitest';
import { evaluateExits } from '../rules/exits';
import {
  dataset,
  createSpace,
  createExit,
  createProject,
  createBuilding,
  officeBuilding,
} from './fixtures';
import type { EvaluationContext } from '../types';

describe('evaluateExits - minimum exits', () => {
  it('should PASS when space has required number of exits', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 100 })], // ~20 people
        exits: [createExit({ id: 'e1', serves_space_ids: ['s1'] })],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const exitCountFinding = findings.find(
      f => f.rule_id === 'EGR-EXIT-001' && f.subject_id === 's1'
    );

    expect(exitCountFinding).toBeDefined();
    expect(exitCountFinding?.status).toBe('PASS');
  });

  it('should FAIL when space has insufficient exits', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 1000 })], // ~200 people
        exits: [createExit({ id: 'e1', serves_space_ids: ['s1'] })],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const exitCountFinding = findings.find(
      f => f.rule_id === 'EGR-EXIT-001' && f.subject_id === 's1'
    );

    expect(exitCountFinding?.status).toBe('FAIL');
    expect(exitCountFinding?.severity).toBe('BLOCKER');
  });

  it('should count multiple exits serving same space', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 1000 })], // ~200 people
        exits: [
          createExit({ id: 'e1', serves_space_ids: ['s1'], width_m: 1.2 }),
          createExit({ id: 'e2', serves_space_ids: ['s1'], width_m: 1.2 }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const exitCountFinding = findings.find(
      f => f.rule_id === 'EGR-EXIT-001' && f.subject_id === 's1'
    );

    expect(exitCountFinding?.measured).toBe(2);
  });
});

describe('evaluateExits - exit widths', () => {
  it('should PASS when exit width meets requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 50 })], // ~10 people
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1'],
            width_m: 0.9,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const widthFinding = findings.find(
      f => f.rule_id === 'EGR-WIDTH-001' && f.subject_id === 'e1'
    );

    expect(widthFinding?.status).toBe('PASS');
  });

  it('should FAIL when exit width is below requirement', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 250 })], // ~50 people
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1'],
            width_m: 0.7, // Too narrow
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const widthFinding = findings.find(
      f => f.rule_id === 'EGR-WIDTH-001' && f.subject_id === 'e1'
    );

    expect(widthFinding?.status).toBe('FAIL');
    expect(widthFinding?.severity).toBe('BLOCKER');
  });

  it('should calculate total occupants from all served spaces', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', area_m2: 100 }),
          createSpace({ id: 's2', area_m2: 100 }),
        ],
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1', 's2'],
            width_m: 1.2,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const widthFinding = findings.find(
      f => f.rule_id === 'EGR-WIDTH-001' && f.subject_id === 'e1'
    );

    // Should account for occupants from both spaces
    expect(widthFinding?.details?.totalOccupants).toBeGreaterThan(20);
  });
});

describe('evaluateExits - panic hardware', () => {
  it('should FAIL when >100 occupants and no panic hardware', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 600 })], // ~120 people
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1'],
            width_m: 1.2,
            has_panic_hardware: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const panicFinding = findings.find(f => f.rule_id === 'EGR-EXIT-003');

    expect(panicFinding?.status).toBe('FAIL');
    expect(panicFinding?.severity).toBe('BLOCKER');
  });

  it('should not require panic hardware for ≤100 occupants', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 250 })], // ~50 people
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1'],
            width_m: 1.0,
            has_panic_hardware: false,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const panicFinding = findings.find(f => f.rule_id === 'EGR-EXIT-003');

    expect(panicFinding).toBeUndefined();
  });

  it('should PASS when panic hardware is installed', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [createSpace({ id: 's1', area_m2: 600 })], // ~120 people
        exits: [
          createExit({
            id: 'e1',
            serves_space_ids: ['s1'],
            width_m: 1.2,
            has_panic_hardware: true,
          }),
        ],
      }),
      datasets: dataset,
    };

    const findings = evaluateExits(ctx);
    const panicFinding = findings.find(f => f.rule_id === 'EGR-EXIT-003');

    expect(panicFinding).toBeUndefined();
  });
});

describe('evaluateExits - determinism', () => {
  it('should produce identical results for identical input', () => {
    const ctx: EvaluationContext = {
      project: createProject({
        building: officeBuilding,
        spaces: [
          createSpace({ id: 's1', area_m2: 300 }),
          createSpace({ id: 's2', area_m2: 200 }),
        ],
        exits: [
          createExit({ id: 'e1', serves_space_ids: ['s1'], width_m: 1.0 }),
          createExit({ id: 'e2', serves_space_ids: ['s2'], width_m: 0.9 }),
        ],
      }),
      datasets: dataset,
    };

    const result1 = evaluateExits(ctx);
    const result2 = evaluateExits(ctx);

    expect(result1).toEqual(result2);
  });
});
