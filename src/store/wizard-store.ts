/**
 * Wizard Store
 * Zustand store for managing the multi-step form state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  BuildingFormData,
  SpaceFormData,
  RouteFormData,
  ExitFormData,
  StairFormData,
} from '@/schemas/project';

// Wizard steps
export const WIZARD_STEPS = [
  { id: 'building', name: 'Сграда', description: 'Основна информация за сградата' },
  { id: 'spaces', name: 'Помещения', description: 'Добавете помещенията' },
  { id: 'exits', name: 'Изходи', description: 'Евакуационни изходи' },
  { id: 'routes', name: 'Маршрути', description: 'Евакуационни пътища' },
  { id: 'stairs', name: 'Стълбища', description: 'Евакуационни стълбища' },
  { id: 'review', name: 'Преглед', description: 'Преглед и проверка' },
] as const;

export type WizardStepId = typeof WIZARD_STEPS[number]['id'];

interface WizardState {
  // Project metadata
  projectId: string | null;
  projectName: string;

  // Current step
  currentStep: number;

  // Form data
  building: BuildingFormData | null;
  spaces: SpaceFormData[];
  exits: ExitFormData[];
  routes: RouteFormData[];
  stairs: StairFormData[];

  // Validation state
  stepsCompleted: Record<WizardStepId, boolean>;

  // Actions
  setProjectName: (name: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Building actions
  setBuilding: (data: BuildingFormData) => void;

  // Space actions
  addSpace: (space: Omit<SpaceFormData, 'id'>) => string;
  updateSpace: (id: string, space: Partial<SpaceFormData>) => void;
  removeSpace: (id: string) => void;

  // Exit actions
  addExit: (exit: Omit<ExitFormData, 'id'>) => string;
  updateExit: (id: string, exit: Partial<ExitFormData>) => void;
  removeExit: (id: string) => void;

  // Route actions
  addRoute: (route: Omit<RouteFormData, 'id'>) => string;
  updateRoute: (id: string, route: Partial<RouteFormData>) => void;
  removeRoute: (id: string) => void;

  // Stair actions
  addStair: (stair: Omit<StairFormData, 'id'>) => string;
  updateStair: (id: string, stair: Partial<StairFormData>) => void;
  removeStair: (id: string) => void;

  // Step completion
  markStepComplete: (step: WizardStepId) => void;
  markStepIncomplete: (step: WizardStepId) => void;

  // Reset
  reset: () => void;
  loadProject: (data: {
    id: string;
    name: string;
    building: BuildingFormData;
    spaces: SpaceFormData[];
    exits: ExitFormData[];
    routes: RouteFormData[];
    stairs: StairFormData[];
  }) => void;
}

const initialState = {
  projectId: null,
  projectName: '',
  currentStep: 0,
  building: null,
  spaces: [],
  exits: [],
  routes: [],
  stairs: [],
  stepsCompleted: {
    building: false,
    spaces: false,
    exits: false,
    routes: false,
    stairs: false,
    review: false,
  },
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setProjectName: (name) => set({ projectName: name }),

      setStep: (step) => {
        if (step >= 0 && step < WIZARD_STEPS.length) {
          set({ currentStep: step });
        }
      },

      nextStep: () => {
        const { currentStep } = get();
        if (currentStep < WIZARD_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      // Building
      setBuilding: (data) => set({
        building: data,
        stepsCompleted: { ...get().stepsCompleted, building: true },
      }),

      // Spaces
      addSpace: (space) => {
        const id = nanoid(8);
        set((state) => ({
          spaces: [...state.spaces, { ...space, id }],
        }));
        return id;
      },

      updateSpace: (id, space) => set((state) => ({
        spaces: state.spaces.map((s) =>
          s.id === id ? { ...s, ...space } : s
        ),
      })),

      removeSpace: (id) => set((state) => ({
        spaces: state.spaces.filter((s) => s.id !== id),
        // Also remove routes referencing this space
        routes: state.routes.filter((r) => r.from_space_id !== id),
        // Update exits to remove this space from serves_space_ids
        exits: state.exits.map((e) => ({
          ...e,
          serves_space_ids: e.serves_space_ids.filter((sid) => sid !== id),
        })),
      })),

      // Exits
      addExit: (exit) => {
        const id = nanoid(8);
        set((state) => ({
          exits: [...state.exits, { ...exit, id }],
        }));
        return id;
      },

      updateExit: (id, exit) => set((state) => ({
        exits: state.exits.map((e) =>
          e.id === id ? { ...e, ...exit } : e
        ),
      })),

      removeExit: (id) => set((state) => ({
        exits: state.exits.filter((e) => e.id !== id),
        // Also remove routes referencing this exit
        routes: state.routes.filter((r) => r.to_exit_id !== id),
      })),

      // Routes
      addRoute: (route) => {
        const id = nanoid(8);
        set((state) => ({
          routes: [...state.routes, { ...route, id }],
        }));
        return id;
      },

      updateRoute: (id, route) => set((state) => ({
        routes: state.routes.map((r) =>
          r.id === id ? { ...r, ...route } : r
        ),
      })),

      removeRoute: (id) => set((state) => ({
        routes: state.routes.filter((r) => r.id !== id),
      })),

      // Stairs
      addStair: (stair) => {
        const id = nanoid(8);
        set((state) => ({
          stairs: [...state.stairs, { ...stair, id }],
        }));
        return id;
      },

      updateStair: (id, stair) => set((state) => ({
        stairs: state.stairs.map((s) =>
          s.id === id ? { ...s, ...stair } : s
        ),
      })),

      removeStair: (id) => set((state) => ({
        stairs: state.stairs.filter((s) => s.id !== id),
      })),

      // Step completion
      markStepComplete: (step) => set((state) => ({
        stepsCompleted: { ...state.stepsCompleted, [step]: true },
      })),

      markStepIncomplete: (step) => set((state) => ({
        stepsCompleted: { ...state.stepsCompleted, [step]: false },
      })),

      // Reset
      reset: () => set(initialState),

      // Load existing project
      loadProject: (data) => set({
        projectId: data.id,
        projectName: data.name,
        building: data.building,
        spaces: data.spaces,
        exits: data.exits,
        routes: data.routes,
        stairs: data.stairs,
        currentStep: 0,
        stepsCompleted: {
          building: true,
          spaces: data.spaces.length > 0,
          exits: data.exits.length > 0,
          routes: true,
          stairs: true,
          review: false,
        },
      }),
    }),
    {
      name: 'flames-wizard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        currentStep: state.currentStep,
        building: state.building,
        spaces: state.spaces,
        exits: state.exits,
        routes: state.routes,
        stairs: state.stairs,
        stepsCompleted: state.stepsCompleted,
      }),
    }
  )
);

/**
 * Get the project data in the format expected by the rule engine
 */
export function getProjectFromStore(state: WizardState) {
  const now = new Date().toISOString();
  return {
    id: state.projectId || nanoid(12),
    name: state.projectName || 'Untitled Project',
    created_at: now,
    updated_at: now,
    building: state.building!,
    spaces: state.spaces,
    routes: state.routes,
    exits: state.exits,
    stairs: state.stairs,
  };
}
