/**
 * Project Input Schemas
 * Zod validation schemas for all project data
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const heightCategorySchema = z.enum(['Н', 'НН', 'СВ', 'В', 'МВ']);

export const functionalClassSchema = z.enum([
  'Ф1.1', 'Ф1.2', 'Ф1.3', 'Ф1.4',
  'Ф2.1', 'Ф2.2', 'Ф2.3', 'Ф2.4',
  'Ф3.1', 'Ф3.2', 'Ф3.3', 'Ф3.4', 'Ф3.5',
  'Ф4.1', 'Ф4.2', 'Ф4.3', 'Ф4.4',
  'Ф5.1', 'Ф5.2', 'Ф5.3',
]);

export const fireHazardCategorySchema = z.enum([
  'Ф5А', 'Ф5Б', 'Ф5В', 'Ф5Г', 'Ф5Д',
]);

export const fireResistanceRatingSchema = z.enum(['I', 'II', 'III', 'IV', 'V']);

export const stairTypeSchema = z.enum([
  'enclosed', 'open', 'external', 'smoke_protected', 'spiral',
]);

export const exitTypeSchema = z.enum(['door', 'stair', 'external', 'corridor', 'internal']);

export const evacuationTypeSchema = z.enum(['single_direction', 'multiple_directions']);

// ============================================================================
// Building Schema
// ============================================================================

export const buildingSchema = z.object({
  name: z.string().min(1, 'Името на сградата е задължително'),
  height_m: z.number().positive().optional(),
  height_category: heightCategorySchema,
  functional_class: functionalClassSchema,
  fire_resistance_rating: fireResistanceRatingSchema.optional(),
  has_sprinklers: z.boolean(),
  has_smoke_control: z.boolean(),
  has_fire_alarm: z.boolean(),
  is_single_storey: z.boolean(),
});

export type BuildingFormData = z.infer<typeof buildingSchema>;

// ============================================================================
// Space Schema
// ============================================================================

export const spaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Името на помещението е задължително'),
  purpose: z.string().min(1, 'Предназначението е задължително'),
  floor: z.number().int(),
  area_m2: z.number().positive('Площта трябва да е положително число'),
  is_underground: z.boolean(),
  fire_hazard_category: fireHazardCategorySchema.optional(),
  occupants_override: z.number().int().positive().optional(),
});

export type SpaceFormData = z.infer<typeof spaceSchema>;

// ============================================================================
// Route Schema
// ============================================================================

export const routeSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  from_space_id: z.string().min(1, 'Начално помещение е задължително'),
  to_exit_id: z.string().min(1, 'Краен изход е задължителен'),
  length_m: z.number().positive('Дължината трябва да е положително число'),
  has_dead_end: z.boolean(),
  dead_end_length_m: z.number().nonnegative().optional(),
  evacuation_type: evacuationTypeSchema,
});

export type RouteFormData = z.infer<typeof routeSchema>;

// ============================================================================
// Exit Schema
// ============================================================================

export const exitSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Името на изхода е задължително'),
  type: exitTypeSchema,
  width_m: z.number().positive('Широчината трябва да е положително число'),
  serves_space_ids: z.array(z.string()).min(1, 'Изходът трябва да обслужва поне едно помещение'),
  serves_floors: z.array(z.number().int()),
  has_panic_hardware: z.boolean(),
});

export type ExitFormData = z.infer<typeof exitSchema>;

// ============================================================================
// Stair Schema
// ============================================================================

export const stairSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Името на стълбището е задължително'),
  type: stairTypeSchema,
  width_m: z.number().positive('Широчината трябва да е положително число'),
  serves_floors: z.array(z.number().int()).min(1, 'Стълбището трябва да обслужва поне един етаж'),
  step_width_m: z.number().positive().optional(),
  step_height_m: z.number().positive().optional(),
  is_naturally_lit: z.boolean(),
  has_smoke_vent: z.boolean(),
});

export type StairFormData = z.infer<typeof stairSchema>;

// ============================================================================
// Full Project Schema
// ============================================================================

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Името на проекта е задължително'),
  created_at: z.string(),
  updated_at: z.string(),
  building: buildingSchema,
  spaces: z.array(spaceSchema),
  routes: z.array(routeSchema),
  exits: z.array(exitSchema),
  stairs: z.array(stairSchema),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// ============================================================================
// Partial schemas for step-by-step form
// ============================================================================

export const buildingStepSchema = buildingSchema;
export const spacesStepSchema = z.array(spaceSchema).min(1, 'Добавете поне едно помещение');
export const routesStepSchema = z.array(routeSchema);
export const exitsStepSchema = z.array(exitSchema).min(1, 'Добавете поне един евакуационен изход');
export const stairsStepSchema = z.array(stairSchema);

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Create a new empty project with defaults
 */
export function createEmptyProject(): ProjectFormData {
  const now = new Date().toISOString();
  return {
    id: '',
    name: '',
    created_at: now,
    updated_at: now,
    building: {
      name: '',
      height_category: 'Н',
      functional_class: 'Ф3.1',
      has_sprinklers: false,
      has_smoke_control: false,
      has_fire_alarm: false,
      is_single_storey: false,
    },
    spaces: [],
    routes: [],
    exits: [],
    stairs: [],
  };
}

/**
 * Validate a project and return errors
 */
export function validateProject(data: unknown): {
  success: boolean;
  data?: ProjectFormData;
  errors?: z.ZodError;
} {
  const result = projectSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
