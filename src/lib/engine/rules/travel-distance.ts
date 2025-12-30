/**
 * Travel Distance Rules
 * Validates evacuation path lengths based on чл. 44
 */

import type {
  EvaluationContext,
  Finding,
  RouteInput,
} from '../types';
import { lookupMaxTravelDistance } from '../lookup';

/**
 * Evaluate travel distance for a single route
 */
function evaluateRouteDistance(
  route: RouteInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];
  const { project, datasets } = ctx;

  // Find the source space for this route
  const fromSpace = project.spaces.find(s => s.id === route.from_space_id);

  // Look up max allowed distance
  const distanceEntry = lookupMaxTravelDistance(
    datasets.tables.max_travel_distance,
    route.evacuation_type,
    'room',
    fromSpace?.fire_hazard_category,
    {
      isSingleStorey: project.building.is_single_storey,
      hasSprinklers: project.building.has_sprinklers,
      hasFireAlarm: project.building.has_fire_alarm,
    }
  );

  if (!distanceEntry) {
    findings.push({
      rule_id: 'EGR-TRAVEL-001',
      status: 'REVIEW',
      severity: 'WARNING',
      scope: 'route',
      subject_id: route.id,
      subject_name: route.name || `Маршрут ${route.id}`,
      measured: route.length_m,
      required: null,
      explanation_bg: `Не е намерено изискване за максимална дължина на евакуационен път от тип "${route.evacuation_type}".`,
      legal_reference: 'Наредба № Iз-1971, чл. 44',
      details: {
        from_space_id: route.from_space_id,
        to_exit_id: route.to_exit_id,
        evacuation_type: route.evacuation_type,
      },
    });
    return findings;
  }

  const maxDistance = distanceEntry.max_distance_m;
  const status = route.length_m <= maxDistance ? 'PASS' : 'FAIL';

  findings.push({
    rule_id: 'EGR-TRAVEL-001',
    status,
    severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
    scope: 'route',
    subject_id: route.id,
    subject_name: route.name || `Маршрут от ${fromSpace?.name || route.from_space_id}`,
    measured: route.length_m,
    required: maxDistance,
    explanation_bg: status === 'PASS'
      ? `Дължина на евакуационния път (${route.length_m} m) е в рамките на допустимата (${maxDistance} m) за евакуация ${route.evacuation_type === 'single_direction' ? 'в една посока' : 'в две или повече посоки'}.`
      : `Превишена допустима дължина на евакуационния път. Измерена: ${route.length_m} m, Допустима: ${maxDistance} m за евакуация ${route.evacuation_type === 'single_direction' ? 'в една посока' : 'в две или повече посоки'}.`,
    legal_reference: distanceEntry.article_ref,
    details: {
      from_space: fromSpace?.name,
      evacuation_type: route.evacuation_type,
      context: distanceEntry.context,
      conditions: distanceEntry.conditions,
    },
  });

  return findings;
}

/**
 * Evaluate dead-end length for routes with dead ends
 */
function evaluateDeadEndLength(
  route: RouteInput,
  ctx: EvaluationContext
): Finding[] {
  const findings: Finding[] = [];
  const { project, datasets } = ctx;

  if (!route.has_dead_end || route.dead_end_length_m === undefined) {
    return findings;
  }

  // Find source space
  const fromSpace = project.spaces.find(s => s.id === route.from_space_id);

  // Look up dead end limit
  const deadEndLimits = datasets.tables.dead_end_limits;

  // Default max dead end is 20m for single-direction evacuation
  let maxDeadEnd = 20;
  let articleRef = 'Наредба № Iз-1971, чл. 40, ал. 3';
  let context = 'Вътрешно помещение';

  // Check for special cases based on fire hazard category
  if (fromSpace?.fire_hazard_category === 'Ф5Г' || fromSpace?.fire_hazard_category === 'Ф5Д') {
    const entry = deadEndLimits.find(e => e.context.includes('Ф5Г/Ф5Д'));
    if (entry) {
      maxDeadEnd = entry.max_distance_m;
      articleRef = entry.article_ref;
      context = entry.context;
    }
  } else {
    const entry = deadEndLimits.find(e =>
      e.context.includes('съседни помещения Ф5В') ||
      e.context.includes('Ф1-Ф4')
    );
    if (entry) {
      maxDeadEnd = entry.max_distance_m;
      articleRef = entry.article_ref;
      context = entry.context;
    }
  }

  const status = route.dead_end_length_m <= maxDeadEnd ? 'PASS' : 'FAIL';

  findings.push({
    rule_id: 'EGR-TRAVEL-002',
    status,
    severity: status === 'FAIL' ? 'BLOCKER' : 'INFO',
    scope: 'route',
    subject_id: route.id,
    subject_name: route.name || `Маршрут от ${fromSpace?.name || route.from_space_id}`,
    measured: route.dead_end_length_m,
    required: maxDeadEnd,
    explanation_bg: status === 'PASS'
      ? `Дължина на задънен коридор (${route.dead_end_length_m} m) е в рамките на допустимата (${maxDeadEnd} m).`
      : `Превишена допустима дължина на задънен коридор. Измерена: ${route.dead_end_length_m} m, Допустима: ${maxDeadEnd} m.`,
    legal_reference: articleRef,
    details: {
      context,
      from_space: fromSpace?.name,
      fire_hazard_category: fromSpace?.fire_hazard_category,
    },
  });

  return findings;
}

/**
 * Evaluate all travel distance rules
 */
export function evaluateTravelDistance(ctx: EvaluationContext): Finding[] {
  const findings: Finding[] = [];

  for (const route of ctx.project.routes) {
    findings.push(...evaluateRouteDistance(route, ctx));
    findings.push(...evaluateDeadEndLength(route, ctx));
  }

  return findings;
}
