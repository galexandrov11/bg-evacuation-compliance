/**
 * Test Fixtures
 * Shared test data for rule engine tests
 */

import type {
  ProjectInput,
  BuildingInput,
  SpaceInput,
  ExitInput,
  RouteInput,
  StairInput,
  OrdinanceDataset,
} from '../types';
import { loadDataset } from '@/lib/datasets/loader';

// Load the actual dataset for realistic testing
export const dataset = loadDataset();

// ============================================================================
// Building Fixtures
// ============================================================================

export const createBuilding = (overrides: Partial<BuildingInput> = {}): BuildingInput => ({
  name: 'Test Building',
  height_category: 'Н',
  functional_class: 'Ф4.1',
  has_sprinklers: false,
  has_smoke_control: false,
  has_fire_alarm: false,
  is_single_storey: false,
  ...overrides,
});

export const officeBuilding = createBuilding({
  name: 'Office Building',
  functional_class: 'Ф4.1',
  height_category: 'НН',
});

export const retailBuilding = createBuilding({
  name: 'Retail Building',
  functional_class: 'Ф3.1',
  height_category: 'Н',
});

export const residentialBuilding = createBuilding({
  name: 'Residential Building',
  functional_class: 'Ф1.3',
  height_category: 'СВ',
});

export const industrialBuilding = createBuilding({
  name: 'Industrial Building',
  functional_class: 'Ф5.1',
  height_category: 'Н',
  is_single_storey: true,
});

// ============================================================================
// Space Fixtures
// ============================================================================

export const createSpace = (overrides: Partial<SpaceInput> = {}): SpaceInput => ({
  id: 'space-1',
  name: 'Test Space',
  purpose: 'Office',
  floor: 0,
  area_m2: 100,
  is_underground: false,
  ...overrides,
});

export const officeSpace = createSpace({
  id: 'office-1',
  name: 'Open Plan Office',
  purpose: 'Office',
  area_m2: 500, // 500m² / 5m²/person = 100 people
});

export const retailSpace = createSpace({
  id: 'retail-1',
  name: 'Shop Floor',
  purpose: 'Retail',
  area_m2: 200, // Ground floor: 200m² / 2m²/person = 100 people
});

export const undergroundSpace = createSpace({
  id: 'underground-1',
  name: 'Basement Storage',
  purpose: 'Storage',
  floor: -1,
  area_m2: 150,
  is_underground: true,
});

// ============================================================================
// Exit Fixtures
// ============================================================================

export const createExit = (overrides: Partial<ExitInput> = {}): ExitInput => ({
  id: 'exit-1',
  name: 'Main Exit',
  type: 'door',
  width_m: 1.2,
  serves_space_ids: ['space-1'],
  serves_floors: [0],
  has_panic_hardware: false,
  ...overrides,
});

export const standardExit = createExit({
  id: 'exit-standard',
  name: 'Standard Exit',
  width_m: 0.9,
});

export const wideExit = createExit({
  id: 'exit-wide',
  name: 'Wide Exit',
  width_m: 1.8,
  has_panic_hardware: true,
});

export const narrowExit = createExit({
  id: 'exit-narrow',
  name: 'Narrow Exit',
  width_m: 0.7, // Below minimum
});

// ============================================================================
// Route Fixtures
// ============================================================================

export const createRoute = (overrides: Partial<RouteInput> = {}): RouteInput => ({
  id: 'route-1',
  from_space_id: 'space-1',
  to_exit_id: 'exit-1',
  length_m: 30,
  has_dead_end: false,
  evacuation_type: 'multiple_directions',
  ...overrides,
});

export const shortRoute = createRoute({
  id: 'route-short',
  length_m: 20,
});

export const longRoute = createRoute({
  id: 'route-long',
  length_m: 80, // Exceeds typical limits
});

export const deadEndRoute = createRoute({
  id: 'route-deadend',
  has_dead_end: true,
  dead_end_length_m: 15,
  evacuation_type: 'single_direction',
});

// ============================================================================
// Stair Fixtures
// ============================================================================

export const createStair = (overrides: Partial<StairInput> = {}): StairInput => ({
  id: 'stair-1',
  name: 'Main Staircase',
  type: 'enclosed',
  width_m: 1.2,
  serves_floors: [0, 1, 2],
  is_naturally_lit: true,
  has_smoke_vent: false,
  ...overrides,
});

export const standardStair = createStair({
  id: 'stair-standard',
  width_m: 1.2,
  step_width_m: 0.30,
  step_height_m: 0.17,
});

export const spiralStair = createStair({
  id: 'stair-spiral',
  name: 'Spiral Stair',
  type: 'spiral',
  width_m: 1.5,
  step_width_m: 0.25,
});

export const narrowStair = createStair({
  id: 'stair-narrow',
  name: 'Narrow Stair',
  width_m: 0.8, // Below minimum
});

// ============================================================================
// Project Fixtures
// ============================================================================

export const createProject = (overrides: Partial<ProjectInput> = {}): ProjectInput => ({
  id: 'project-1',
  name: 'Test Project',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  building: officeBuilding,
  spaces: [officeSpace],
  routes: [shortRoute],
  exits: [standardExit],
  stairs: [standardStair],
  ...overrides,
});

export const minimalProject = createProject({
  id: 'minimal',
  name: 'Minimal Project',
  building: createBuilding(),
  spaces: [createSpace({ area_m2: 50 })],
  exits: [createExit({ serves_space_ids: ['space-1'] })],
  routes: [],
  stairs: [],
});

export const retailProject = createProject({
  id: 'retail',
  name: 'Retail Project',
  building: retailBuilding,
  spaces: [retailSpace],
  exits: [
    createExit({ id: 'exit-1', serves_space_ids: ['retail-1'], width_m: 1.2 }),
    createExit({ id: 'exit-2', serves_space_ids: ['retail-1'], width_m: 1.2 }),
  ],
  routes: [createRoute({ from_space_id: 'retail-1', to_exit_id: 'exit-1' })],
  stairs: [],
});

export const multiStoreyProject = createProject({
  id: 'multi-storey',
  name: 'Multi-storey Building',
  building: createBuilding({ height_category: 'СВ' }),
  spaces: [
    createSpace({ id: 'floor-0', floor: 0, area_m2: 200 }),
    createSpace({ id: 'floor-1', floor: 1, area_m2: 200 }),
    createSpace({ id: 'floor-2', floor: 2, area_m2: 200 }),
    createSpace({ id: 'floor-3', floor: 3, area_m2: 200 }),
  ],
  exits: [
    createExit({ id: 'exit-1', serves_space_ids: ['floor-0'], width_m: 1.2 }),
  ],
  stairs: [
    createStair({
      id: 'stair-1',
      serves_floors: [0, 1, 2, 3],
      is_naturally_lit: false,
      has_smoke_vent: false,
    }),
  ],
  routes: [],
});
