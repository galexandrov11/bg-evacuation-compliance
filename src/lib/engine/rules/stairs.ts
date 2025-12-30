/**
 * Stair Rules
 * Validates stair dimensions and requirements based on чл. 47-52
 */

import type {
  EvaluationContext,
  Finding,
  StairInput,
} from '../types';
import { calculateOccupantLoad } from './occupant-load';

/**
 * Get total occupants served by a stair
 */
function getOccupantsServedByStair(
  stair: StairInput,
  ctx: EvaluationContext
): number {
  const { project } = ctx;

  // Find all spaces on floors served by this stair
  const servedSpaces = project.spaces.filter(space =>
    stair.serves_floors.includes(space.floor)
  );

  let totalOccupants = 0;
  for (const space of servedSpaces) {
    const computed = calculateOccupantLoad(space, ctx);
    totalOccupants += computed.computed_occupants;
  }

  return totalOccupants;
}

/**
 * Evaluate stair width requirements
 */
function evaluateStairWidth(
  stair: StairInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];
  const { datasets } = ctx;

  const totalOccupants = getOccupantsServedByStair(stair, ctx);

  // Determine minimum width based on stair type and occupants
  let minWidth = 0.9; // Default minimum
  let articleRef = 'Наредба № Iз-1971, чл. 45';

  if (stair.type === 'spiral') {
    if (totalOccupants <= 50) {
      minWidth = 1.2;
      articleRef = 'Наредба № Iз-1971, чл. 52, ал. 1';
    } else {
      minWidth = 1.5;
      articleRef = 'Наредба № Iз-1971, чл. 52, ал. 2';
    }
  } else {
    // Regular stairs - width per 100 people
    // Underground: 1.2m per 100 people
    // Above ground: 0.8m per 100 people
    const hasUnderground = ctx.project.spaces.some(s =>
      stair.serves_floors.includes(s.floor) && s.is_underground
    );

    if (totalOccupants > 200) {
      const widthPer100 = hasUnderground ? 1.2 : 0.8;
      minWidth = Math.max(0.9, (totalOccupants / 100) * widthPer100);
      articleRef = hasUnderground
        ? 'Наредба № Iз-1971, чл. 45, ал. 1, т. 2'
        : 'Наредба № Iз-1971, чл. 45, ал. 1, т. 1';
    }
  }

  const status = stair.width_m >= minWidth ? 'PASS' : 'FAIL';

  findings.push({
    rule_id: 'EGR-STAIR-001',
    status,
    severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
    scope: 'stair',
    subject_id: stair.id,
    subject_name: stair.name,
    measured: stair.width_m,
    required: Math.round(minWidth * 100) / 100,
    explanation_bg: status === 'PASS'
      ? `Широчина на стълбищното рамо (${stair.width_m} m) отговаря на изискването (мин. ${minWidth.toFixed(2)} m) за ${totalOccupants} човека.`
      : `Недостатъчна широчина на стълбищното рамо. Измерена: ${stair.width_m} m, Изискване: мин. ${minWidth.toFixed(2)} m за ${totalOccupants} човека.`,
    legal_reference: articleRef,
    details: {
      totalOccupants,
      stair_type: stair.type,
      serves_floors: stair.serves_floors,
    },
  });

  // Check max width (2.4m)
  if (stair.width_m > 2.4) {
    findings.push({
      rule_id: 'EGR-STAIR-002',
      status: 'REVIEW',
      severity: 'WARNING',
      scope: 'stair',
      subject_id: stair.id,
      subject_name: stair.name,
      measured: stair.width_m,
      required: 2.4,
      explanation_bg: `Широчината на стълбищното рамо (${stair.width_m} m) надвишава 2.4 m. Необходимо е разделяне с парапети.`,
      legal_reference: 'Наредба № Iз-1971, чл. 45, ал. 7',
      details: { stair_type: stair.type },
    });
  }

  return findings;
}

/**
 * Evaluate stair step dimensions
 */
function evaluateStairSteps(
  stair: StairInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];

  // Check step width (min 0.25m for internal stairs)
  if (stair.step_width_m !== undefined) {
    let minStepWidth = 0.25;
    let articleRef = 'Наредба № Iз-1971, чл. 47, ал. 4';

    if (stair.type === 'spiral') {
      minStepWidth = 0.23; // Measured at 0.30m from inner edge
      articleRef = 'Наредба № Iз-1971, чл. 52, ал. 1, т. 1';
    }

    const status = stair.step_width_m >= minStepWidth ? 'PASS' : 'FAIL';

    findings.push({
      rule_id: 'EGR-STAIR-003',
      status,
      severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
      scope: 'stair',
      subject_id: stair.id,
      subject_name: stair.name,
      measured: stair.step_width_m,
      required: minStepWidth,
      explanation_bg: status === 'PASS'
        ? `Широчина на стъпалото (${stair.step_width_m} m) отговаря на изискването (мин. ${minStepWidth} m).`
        : `Недостатъчна широчина на стъпалото. Измерена: ${stair.step_width_m} m, Изискване: мин. ${minStepWidth} m.`,
      legal_reference: articleRef,
      details: { stair_type: stair.type },
    });
  }

  // Check step height (max 0.22m for internal, 0.25m for external)
  if (stair.step_height_m !== undefined) {
    const maxStepHeight = stair.type === 'external' ? 0.25 : 0.22;
    const articleRef = stair.type === 'external'
      ? 'Наредба № Iз-1971, чл. 51, ал. 2'
      : 'Наредба № Iз-1971, чл. 47, ал. 4';

    const status = stair.step_height_m <= maxStepHeight ? 'PASS' : 'FAIL';

    findings.push({
      rule_id: 'EGR-STAIR-004',
      status,
      severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
      scope: 'stair',
      subject_id: stair.id,
      subject_name: stair.name,
      measured: stair.step_height_m,
      required: maxStepHeight,
      explanation_bg: status === 'PASS'
        ? `Височина на стъпалото (${stair.step_height_m} m) отговаря на изискването (макс. ${maxStepHeight} m).`
        : `Превишена височина на стъпалото. Измерена: ${stair.step_height_m} m, Изискване: макс. ${maxStepHeight} m.`,
      legal_reference: articleRef,
      details: { stair_type: stair.type },
    });
  }

  return findings;
}

/**
 * Evaluate stair lighting and ventilation
 */
function evaluateStairLighting(
  stair: StairInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];

  // Internal stairs with more than 3 floors need natural lighting or smoke ventilation
  if (stair.type === 'enclosed' && stair.serves_floors.length > 3) {
    if (!stair.is_naturally_lit && !stair.has_smoke_vent) {
      findings.push({
        rule_id: 'EGR-STAIR-005',
        status: 'FAIL',
        severity: 'BLOCKER',
        scope: 'stair',
        subject_id: stair.id,
        subject_name: stair.name,
        measured: null,
        required: null,
        explanation_bg: `Вътрешното евакуационно стълбище обслужва повече от три етажа (${stair.serves_floors.length}) и не е осигурено с естествено осветление или димоотвеждане.`,
        legal_reference: 'Наредба № Iз-1971, чл. 50, ал. 2',
        details: {
          serves_floors: stair.serves_floors,
          is_naturally_lit: stair.is_naturally_lit,
          has_smoke_vent: stair.has_smoke_vent,
        },
      });
    }
  }

  return findings;
}

/**
 * Evaluate all stair rules
 */
export function evaluateStairs(ctx: EvaluationContext): Finding[] {
  const findings: Finding[] = [];

  for (const stair of ctx.project.stairs) {
    findings.push(...evaluateStairWidth(stair, ctx));
    findings.push(...evaluateStairSteps(stair, ctx));
    findings.push(...evaluateStairLighting(stair, ctx));
  }

  return findings;
}
