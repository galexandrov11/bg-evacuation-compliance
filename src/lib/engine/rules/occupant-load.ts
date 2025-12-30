/**
 * Occupant Load Rules
 * Calculates and validates occupant counts based on чл. 36, табл. 8
 */

import type {
  EvaluationContext,
  Finding,
  ComputedSpace,
  SpaceInput,
} from '../types';
import { lookupOccupantLoadFactor } from '../lookup';

/**
 * Calculate occupant load for a single space
 */
export function calculateOccupantLoad(
  space: SpaceInput,
  ctx: EvaluationContext
): ComputedSpace {
  const { datasets, project } = ctx;

  // If occupant override is set, use it
  if (space.occupants_override !== undefined && space.occupants_override > 0) {
    return {
      ...space,
      computed_occupants: space.occupants_override,
      occupant_source: 'override',
      area_per_person_m2: null,
    };
  }

  // Look up occupant load factor from Table 8
  const isGroundFloor = space.floor === 0;
  const loadEntry = lookupOccupantLoadFactor(
    datasets.tables.occupant_load_table_8,
    project.building.functional_class,
    space.purpose,
    isGroundFloor
  );

  if (!loadEntry) {
    // Default to 5.0 m²/person (office standard) if not found
    const defaultAreaPerPerson = 5.0;
    return {
      ...space,
      computed_occupants: Math.ceil(space.area_m2 / defaultAreaPerPerson),
      occupant_source: 'calculated',
      area_per_person_m2: defaultAreaPerPerson,
    };
  }

  const computedOccupants = Math.ceil(space.area_m2 / loadEntry.area_per_person_m2);

  return {
    ...space,
    computed_occupants: computedOccupants,
    occupant_source: 'calculated',
    area_per_person_m2: loadEntry.area_per_person_m2,
  };
}

/**
 * Calculate total occupants for the building
 */
export function calculateTotalOccupants(
  ctx: EvaluationContext
): { total: number; bySpace: ComputedSpace[] } {
  const computedSpaces = ctx.project.spaces.map(space =>
    calculateOccupantLoad(space, ctx)
  );

  const total = computedSpaces.reduce(
    (sum, space) => sum + space.computed_occupants,
    0
  );

  return { total, bySpace: computedSpaces };
}

/**
 * Evaluate occupant load rules
 * Generates findings for occupant calculations
 */
export function evaluateOccupantLoad(ctx: EvaluationContext): Finding[] {
  const findings: Finding[] = [];
  const { project, datasets } = ctx;

  for (const space of project.spaces) {
    const computed = calculateOccupantLoad(space, ctx);

    // Look up the factor used
    const loadEntry = lookupOccupantLoadFactor(
      datasets.tables.occupant_load_table_8,
      project.building.functional_class,
      space.purpose,
      space.floor === 0
    );

    // Generate informational finding about occupant calculation
    findings.push({
      rule_id: 'EGR-OCC-001',
      status: 'PASS',
      severity: 'INFO',
      scope: 'space',
      subject_id: space.id,
      subject_name: space.name,
      measured: computed.computed_occupants,
      required: null,
      explanation_bg: computed.occupant_source === 'override'
        ? `Брой хора: ${computed.computed_occupants} (зададено ръчно)`
        : `Брой хора: ${computed.computed_occupants} (изчислено от ${space.area_m2} m² / ${computed.area_per_person_m2} m²/човек)`,
      legal_reference: loadEntry?.article_ref || 'Наредба № Iз-1971, чл. 36, табл. 8',
      details: {
        area_m2: space.area_m2,
        area_per_person_m2: computed.area_per_person_m2,
        source: computed.occupant_source,
        functional_class: project.building.functional_class,
      },
    });

    // Warning if using default factor (not found in table)
    if (!loadEntry && computed.occupant_source === 'calculated') {
      findings.push({
        rule_id: 'EGR-OCC-002',
        status: 'REVIEW',
        severity: 'WARNING',
        scope: 'space',
        subject_id: space.id,
        subject_name: space.name,
        measured: null,
        required: null,
        explanation_bg: `Не е намерен коефициент за гъстота на обитаване за клас ${project.building.functional_class} и предназначение "${space.purpose}". Използвана е стойност по подразбиране (5.0 m²/човек).`,
        legal_reference: 'Наредба № Iз-1971, чл. 36, табл. 8',
        details: {
          purpose: space.purpose,
          functional_class: project.building.functional_class,
          default_used: 5.0,
        },
      });
    }
  }

  return findings;
}
