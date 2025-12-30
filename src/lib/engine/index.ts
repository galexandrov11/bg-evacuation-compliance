/**
 * Rule Engine - Public API
 * Export all public types and functions
 */

// Main evaluation functions
export {
  evaluate,
  validateContext,
  hasBlockers,
  getFailedFindings,
} from './evaluator';

// Lookup utilities
export {
  lookupOccupantLoadFactor,
  lookupMinExits,
  lookupMaxTravelDistance,
  lookupMinWidth,
  calculateMinTotalWidth,
  getFunctionalClassName,
  getHeightCategory,
  getFunctionalClassGroup,
  isIndustrialClass,
} from './lookup';

// Occupant load helpers
export {
  calculateOccupantLoad,
  calculateTotalOccupants,
} from './rules/occupant-load';

// Types
export type {
  // Finding types
  Finding,
  FindingStatus,
  FindingSeverity,
  EvaluationResult,
  EvaluationSummary,
  EvaluationContext,

  // Input types
  ProjectInput,
  BuildingInput,
  SpaceInput,
  RouteInput,
  ExitInput,
  StairInput,

  // Enums
  HeightCategory,
  FunctionalClass,
  FireHazardCategory,
  FireResistanceRating,
  StairType,
  ExitType,

  // Dataset types
  OrdinanceDataset,
  OccupantLoadEntry,
  MinExitsEntry,
  TravelDistanceEntry,
  DeadEndEntry,
  MinWidthEntry,

  // Computed types
  ComputedSpace,
  ComputedRoute,
} from './types';
