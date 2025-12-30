/**
 * Rule Engine Evaluator
 * Main orchestrator for running all compliance checks
 */

import type {
  EvaluationContext,
  EvaluationResult,
  EvaluationSummary,
  Finding,
} from './types';

import { evaluateOccupantLoad } from './rules/occupant-load';
import { evaluateExits } from './rules/exits';
import { evaluateTravelDistance } from './rules/travel-distance';
import { evaluateStairs } from './rules/stairs';

/**
 * Compute summary statistics from findings
 */
function computeSummary(findings: Finding[]): EvaluationSummary {
  return {
    total_rules: findings.length,
    passed: findings.filter(f => f.status === 'PASS').length,
    failed: findings.filter(f => f.status === 'FAIL').length,
    review: findings.filter(f => f.status === 'REVIEW').length,
    blockers: findings.filter(f => f.severity === 'BLOCKER' && f.status === 'FAIL').length,
  };
}

/**
 * Sort findings by severity (BLOCKER first) then by status
 */
function sortFindings(findings: Finding[]): Finding[] {
  const severityOrder = { BLOCKER: 0, WARNING: 1, INFO: 2 };
  const statusOrder = { FAIL: 0, REVIEW: 1, PASS: 2 };

  return [...findings].sort((a, b) => {
    // First by severity
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Then by status
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    // Then by rule_id
    return a.rule_id.localeCompare(b.rule_id);
  });
}

/**
 * Main evaluation function
 * Runs all rule modules and returns combined results
 *
 * IMPORTANT: This function is deterministic.
 * Same input + same dataset = same output.
 */
export function evaluate(ctx: EvaluationContext): EvaluationResult {
  const findings: Finding[] = [];

  // Run all rule modules in order
  // 1. Occupant load calculation (foundation for other rules)
  findings.push(...evaluateOccupantLoad(ctx));

  // 2. Exit requirements (depends on occupant load)
  findings.push(...evaluateExits(ctx));

  // 3. Travel distances
  findings.push(...evaluateTravelDistance(ctx));

  // 4. Stair requirements
  findings.push(...evaluateStairs(ctx));

  // Sort findings by severity and status
  const sortedFindings = sortFindings(findings);

  return {
    project_id: ctx.project.id,
    evaluated_at: new Date().toISOString(),
    dataset_version: ctx.datasets.meta.version,
    summary: computeSummary(sortedFindings),
    findings: sortedFindings,
  };
}

/**
 * Validate that all required data is present before evaluation
 */
export function validateContext(ctx: EvaluationContext): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check project data
  if (!ctx.project) {
    errors.push('Project data is missing');
    return { valid: false, errors };
  }

  if (!ctx.project.building) {
    errors.push('Building data is missing');
  }

  if (!ctx.project.spaces || ctx.project.spaces.length === 0) {
    errors.push('At least one space is required');
  }

  // Check for space IDs uniqueness
  const spaceIds = new Set(ctx.project.spaces.map(s => s.id));
  if (spaceIds.size !== ctx.project.spaces.length) {
    errors.push('Duplicate space IDs found');
  }

  // Check that route references are valid
  for (const route of ctx.project.routes) {
    if (!spaceIds.has(route.from_space_id)) {
      errors.push(`Route ${route.id} references unknown space ${route.from_space_id}`);
    }

    const exitIds = new Set(ctx.project.exits.map(e => e.id));
    if (!exitIds.has(route.to_exit_id)) {
      errors.push(`Route ${route.id} references unknown exit ${route.to_exit_id}`);
    }
  }

  // Check that exit space references are valid
  for (const exit of ctx.project.exits) {
    for (const spaceId of exit.serves_space_ids) {
      if (!spaceIds.has(spaceId)) {
        errors.push(`Exit ${exit.id} references unknown space ${spaceId}`);
      }
    }
  }

  // Check dataset
  if (!ctx.datasets) {
    errors.push('Dataset is missing');
    return { valid: false, errors };
  }

  if (!ctx.datasets.tables.occupant_load_table_8) {
    errors.push('Occupant load table is missing from dataset');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Quick check for blockers only (faster for validation)
 */
export function hasBlockers(ctx: EvaluationContext): boolean {
  const result = evaluate(ctx);
  return result.summary.blockers > 0;
}

/**
 * Get only failed findings
 */
export function getFailedFindings(ctx: EvaluationContext): Finding[] {
  const result = evaluate(ctx);
  return result.findings.filter(f => f.status === 'FAIL');
}
