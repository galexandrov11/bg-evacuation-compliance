/**
 * Exit Rules
 * Validates number of exits and exit widths based on чл. 41, чл. 42
 */

import type {
  EvaluationContext,
  Finding,
  SpaceInput,
  ExitInput,
} from '../types';
import { calculateOccupantLoad } from './occupant-load';
import { lookupMinExits, lookupMinWidth, isIndustrialClass } from '../lookup';

/**
 * Get exits serving a specific space
 */
function getExitsForSpace(space: SpaceInput, exits: ExitInput[]): ExitInput[] {
  return exits.filter(exit => exit.serves_space_ids.includes(space.id));
}

/**
 * Evaluate minimum number of exits for a space
 */
function evaluateMinExitsForSpace(
  space: SpaceInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];
  const { project, datasets } = ctx;

  // Calculate occupants for this space
  const computed = calculateOccupantLoad(space, ctx);
  const occupants = computed.computed_occupants;

  // Get exits serving this space
  const spaceExits = getExitsForSpace(space, project.exits);
  const actualExits = spaceExits.length;

  // Look up required exits
  const exitRequirement = lookupMinExits(
    datasets.tables.min_exits_by_occupants,
    project.building.functional_class,
    occupants,
    space.area_m2,
    space.is_underground,
    space.fire_hazard_category
  );

  if (!exitRequirement) {
    findings.push({
      rule_id: 'EGR-EXIT-001',
      status: 'REVIEW',
      severity: 'WARNING',
      scope: 'space',
      subject_id: space.id,
      subject_name: space.name,
      measured: actualExits,
      required: null,
      explanation_bg: `Не е намерено изискване за минимален брой изходи за ${occupants} човека в помещение от клас ${project.building.functional_class}. Моля, проверете ръчно.`,
      legal_reference: 'Наредба № Iз-1971, чл. 41-42',
      details: { occupants, area_m2: space.area_m2 },
    });
    return findings;
  }

  const requiredExits = exitRequirement.min_exits;
  const status = actualExits >= requiredExits ? 'PASS' : 'FAIL';

  findings.push({
    rule_id: 'EGR-EXIT-001',
    status,
    severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
    scope: 'space',
    subject_id: space.id,
    subject_name: space.name,
    measured: actualExits,
    required: requiredExits,
    explanation_bg: status === 'PASS'
      ? `Брой евакуационни изходи (${actualExits}) отговаря на изискването (мин. ${requiredExits}) за ${occupants} човека.`
      : `Недостатъчен брой евакуационни изходи. Налични: ${actualExits}, Изискване: мин. ${requiredExits} за ${occupants} човека.`,
    legal_reference: exitRequirement.article_ref,
    details: {
      occupants,
      area_m2: space.area_m2,
      is_underground: space.is_underground,
      functional_class: project.building.functional_class,
    },
  });

  return findings;
}

/**
 * Evaluate exit width requirements
 */
function evaluateExitWidth(
  exit: ExitInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];
  const { project, datasets } = ctx;

  // Calculate total occupants served by this exit
  const servedSpaces = project.spaces.filter(s =>
    exit.serves_space_ids.includes(s.id)
  );

  let totalOccupants = 0;
  for (const space of servedSpaces) {
    const computed = calculateOccupantLoad(space, ctx);
    totalOccupants += computed.computed_occupants;
  }

  // Determine if any served space is underground
  const hasUnderground = servedSpaces.some(s => s.is_underground);

  // Look up minimum width requirement
  const widthReq = lookupMinWidth(
    datasets.tables.min_widths,
    'exit_door',
    totalOccupants,
    hasUnderground
  );

  if (!widthReq) {
    findings.push({
      rule_id: 'EGR-WIDTH-001',
      status: 'REVIEW',
      severity: 'WARNING',
      scope: 'exit',
      subject_id: exit.id,
      subject_name: exit.name,
      measured: exit.width_m,
      required: null,
      explanation_bg: `Не е намерено изискване за минимална широчина за ${totalOccupants} човека.`,
      legal_reference: 'Наредба № Iз-1971, чл. 41',
      details: { totalOccupants },
    });
    return findings;
  }

  const minWidth = widthReq.min_width_m || 0.9;
  const status = exit.width_m >= minWidth ? 'PASS' : 'FAIL';

  findings.push({
    rule_id: 'EGR-WIDTH-001',
    status,
    severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
    scope: 'exit',
    subject_id: exit.id,
    subject_name: exit.name,
    measured: exit.width_m,
    required: minWidth,
    explanation_bg: status === 'PASS'
      ? `Широчина на изхода (${exit.width_m} m) отговаря на изискването (мин. ${minWidth} m) за ${totalOccupants} човека.`
      : `Недостатъчна широчина на изхода. Измерена: ${exit.width_m} m, Изискване: мин. ${minWidth} m за ${totalOccupants} човека.`,
    legal_reference: widthReq.article_ref,
    details: {
      totalOccupants,
      serves_spaces: exit.serves_space_ids,
    },
  });

  // Check max width for large occupancy
  if (totalOccupants > 50 && widthReq.max_width_m) {
    const maxWidth = widthReq.max_width_m;
    if (exit.width_m > maxWidth) {
      findings.push({
        rule_id: 'EGR-WIDTH-002',
        status: 'REVIEW',
        severity: 'WARNING',
        scope: 'exit',
        subject_id: exit.id,
        subject_name: exit.name,
        measured: exit.width_m,
        required: maxWidth,
        explanation_bg: `Широчината на изхода (${exit.width_m} m) надвишава максималната единична широчина (${maxWidth} m). Препоръчва се разделяне на изхода.`,
        legal_reference: 'Наредба № Iз-1971, чл. 41, ал. 6',
        details: { totalOccupants },
      });
    }
  }

  // Check panic hardware requirement for >100 occupants
  if (totalOccupants > 100 && !exit.has_panic_hardware) {
    findings.push({
      rule_id: 'EGR-EXIT-003',
      status: 'FAIL',
      severity: 'BLOCKER',
      scope: 'exit',
      subject_id: exit.id,
      subject_name: exit.name,
      measured: null,
      required: null,
      explanation_bg: `Изходът обслужва над 100 човека (${totalOccupants}) и изисква брава тип "антипаник" съгласно БДС EN 1125.`,
      legal_reference: 'Наредба № Iз-1971, чл. 43, ал. 2',
      details: { totalOccupants, has_panic_hardware: exit.has_panic_hardware },
    });
  }

  return findings;
}

/**
 * Evaluate all exit rules
 */
export function evaluateExits(ctx: EvaluationContext): Finding[] {
  const findings: Finding[] = [];
  const { project } = ctx;

  // Evaluate minimum exits per space
  for (const space of project.spaces) {
    findings.push(...evaluateMinExitsForSpace(space, ctx));
  }

  // Evaluate exit widths
  for (const exit of project.exits) {
    findings.push(...evaluateExitWidth(exit, ctx));
  }

  return findings;
}
