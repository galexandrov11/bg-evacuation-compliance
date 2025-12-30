/**
 * Rule Engine Types
 * Core type definitions for the evacuation compliance checker
 */

// ============================================================================
// Finding Types
// ============================================================================

export type FindingStatus = 'PASS' | 'FAIL' | 'REVIEW';
export type FindingSeverity = 'BLOCKER' | 'WARNING' | 'INFO';

export interface Finding {
  rule_id: string;           // e.g., "EGR-TRAVEL-001"
  status: FindingStatus;
  severity: FindingSeverity;
  scope: 'building' | 'storey' | 'space' | 'route' | 'exit' | 'stair';
  subject_id: string;        // ID of the entity being evaluated
  subject_name?: string;     // Human-readable name
  measured: number | null;
  required: number | null;
  explanation_bg: string;    // Bulgarian explanation
  legal_reference: string;   // e.g., "Наредба № Iз-1971, чл. 44"
  details?: Record<string, unknown>;
}

export interface EvaluationSummary {
  total_rules: number;
  passed: number;
  failed: number;
  review: number;
  blockers: number;
}

export interface EvaluationResult {
  project_id: string;
  evaluated_at: string;
  dataset_version: string;
  summary: EvaluationSummary;
  findings: Finding[];
}

// ============================================================================
// Project Input Types
// ============================================================================

export type HeightCategory = 'Н' | 'НН' | 'СВ' | 'В' | 'МВ';

export type FunctionalClass =
  | 'Ф1.1' | 'Ф1.2' | 'Ф1.3' | 'Ф1.4'
  | 'Ф2.1' | 'Ф2.2' | 'Ф2.3' | 'Ф2.4'
  | 'Ф3.1' | 'Ф3.2' | 'Ф3.3' | 'Ф3.4' | 'Ф3.5'
  | 'Ф4.1' | 'Ф4.2' | 'Ф4.3' | 'Ф4.4'
  | 'Ф5.1' | 'Ф5.2' | 'Ф5.3';

export type FireHazardCategory = 'Ф5А' | 'Ф5Б' | 'Ф5В' | 'Ф5Г' | 'Ф5Д';

export type FireResistanceRating = 'I' | 'II' | 'III' | 'IV' | 'V';

export type StairType = 'enclosed' | 'open' | 'external' | 'smoke_protected' | 'spiral';

export type ExitType = 'door' | 'stair' | 'external';

export interface BuildingInput {
  name: string;
  height_m?: number;
  height_category: HeightCategory;
  functional_class: FunctionalClass;
  fire_resistance_rating?: FireResistanceRating;
  has_sprinklers: boolean;
  has_smoke_control: boolean;
  has_fire_alarm: boolean;
  is_single_storey: boolean;
}

export interface SpaceInput {
  id: string;
  name: string;
  purpose: string;
  floor: number;
  area_m2: number;
  is_underground: boolean;
  fire_hazard_category?: FireHazardCategory;
  occupants_override?: number; // Manual override for occupant count
}

export interface RouteInput {
  id: string;
  name?: string;
  from_space_id: string;
  to_exit_id: string;
  length_m: number;
  has_dead_end: boolean;
  dead_end_length_m?: number;
  evacuation_type: 'single_direction' | 'multiple_directions';
}

export interface ExitInput {
  id: string;
  name: string;
  type: ExitType;
  width_m: number;
  serves_space_ids: string[];
  serves_floors: number[];
  has_panic_hardware: boolean;
}

export interface StairInput {
  id: string;
  name: string;
  type: StairType;
  width_m: number;
  serves_floors: number[];
  step_width_m?: number;
  step_height_m?: number;
  is_naturally_lit: boolean;
  has_smoke_vent: boolean;
}

export interface ProjectInput {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  building: BuildingInput;
  spaces: SpaceInput[];
  routes: RouteInput[];
  exits: ExitInput[];
  stairs: StairInput[];
}

// ============================================================================
// Dataset Types
// ============================================================================

export interface OccupantLoadEntry {
  id: number;
  functional_class: string;
  space_type: string;
  space_type_en: string;
  area_per_person_m2: number;
  notes: string | null;
  article_ref: string;
}

export interface MinExitsEntry {
  functional_class_group: string;
  category?: string;
  min_occupants: number;
  max_occupants: number | null;
  max_area_m2: number | null;
  underground_only: boolean;
  min_exits: number;
  min_width_m: number | null;
  notes?: string;
  article_ref: string;
}

export interface TravelDistanceEntry {
  id: number;
  context: string;
  evacuation_type: 'single_direction' | 'multiple_directions';
  max_distance_m: number;
  conditions: string | null;
  article_ref: string;
}

export interface DeadEndEntry {
  id: number;
  context: string;
  max_distance_m: number;
  requires_two_exits: boolean;
  additional_conditions?: string;
  article_ref: string;
}

export interface MinWidthEntry {
  element_type: string;
  context: string;
  min_width_m?: number;
  max_width_m?: number;
  width_per_100_people_m?: number;
  min_step_width_m?: number;
  max_height_m?: number;
  min_inner_diameter_m?: number;
  notes: string | null;
  article_ref: string;
}

export interface FunctionalClassInfo {
  code: string;
  name: string;
  name_en: string;
}

export interface HeightCategoryInfo {
  code: string;
  name: string;
  min_height_m?: number;
  max_height_m?: number;
  description: string;
}

export interface OrdinanceDataset {
  meta: {
    ordinance: string;
    version: string;
    effective_from: string;
    source: string;
    last_updated: string;
    notes: string;
  };
  tables: {
    occupant_load_table_8: OccupantLoadEntry[];
    min_exits_by_occupants: MinExitsEntry[];
    max_travel_distance: TravelDistanceEntry[];
    dead_end_limits: DeadEndEntry[];
    min_widths: MinWidthEntry[];
    functional_classes: FunctionalClassInfo[];
    fire_hazard_categories: { code: string; name: string; name_en: string }[];
    height_categories: HeightCategoryInfo[];
  };
  rules: Record<string, {
    id: string;
    name_bg: string;
    description_bg: string;
    article_ref: string;
    formula?: string;
    min_angle_degrees?: number;
  }>;
}

// ============================================================================
// Evaluation Context
// ============================================================================

export interface EvaluationContext {
  project: ProjectInput;
  datasets: OrdinanceDataset;
}

// ============================================================================
// Computed Values (intermediate results)
// ============================================================================

export interface ComputedSpace extends SpaceInput {
  computed_occupants: number;
  occupant_source: 'calculated' | 'override';
  area_per_person_m2: number | null;
}

export interface ComputedRoute extends RouteInput {
  from_space: ComputedSpace | null;
  to_exit: ExitInput | null;
  max_allowed_distance_m: number | null;
}
