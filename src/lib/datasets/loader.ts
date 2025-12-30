/**
 * Dataset Loader
 * Loads and validates ordinance datasets
 */

import type { OrdinanceDataset } from '../engine/types';

// Import the dataset directly (bundled with the app)
import datasetV2024_01 from '../../../data/datasets/iz-1971-v2024-01.json';

// Cache loaded datasets
const datasetCache = new Map<string, OrdinanceDataset>();

/**
 * Available dataset versions
 */
export const AVAILABLE_DATASETS = ['iz-1971-v2024-01'] as const;
export type DatasetVersion = typeof AVAILABLE_DATASETS[number];

/**
 * Get the current/latest dataset version
 */
export function getCurrentDatasetVersion(): DatasetVersion {
  return 'iz-1971-v2024-01';
}

/**
 * Load a dataset by version ID
 */
export function loadDataset(version: DatasetVersion = getCurrentDatasetVersion()): OrdinanceDataset {
  // Check cache first
  if (datasetCache.has(version)) {
    return datasetCache.get(version)!;
  }

  let dataset: OrdinanceDataset;

  switch (version) {
    case 'iz-1971-v2024-01':
      dataset = datasetV2024_01 as OrdinanceDataset;
      break;
    default:
      throw new Error(`Unknown dataset version: ${version}`);
  }

  // Validate dataset structure
  validateDataset(dataset);

  // Cache and return
  datasetCache.set(version, dataset);
  return dataset;
}

/**
 * Validate dataset structure
 */
export function validateDataset(dataset: unknown): asserts dataset is OrdinanceDataset {
  if (!dataset || typeof dataset !== 'object') {
    throw new Error('Dataset must be an object');
  }

  const d = dataset as Record<string, unknown>;

  // Check meta
  if (!d.meta || typeof d.meta !== 'object') {
    throw new Error('Dataset must have a meta object');
  }

  const meta = d.meta as Record<string, unknown>;
  if (!meta.ordinance || !meta.version) {
    throw new Error('Dataset meta must have ordinance and version');
  }

  // Check tables
  if (!d.tables || typeof d.tables !== 'object') {
    throw new Error('Dataset must have a tables object');
  }

  const tables = d.tables as Record<string, unknown>;
  const requiredTables = [
    'occupant_load_table_8',
    'min_exits_by_occupants',
    'max_travel_distance',
    'dead_end_limits',
    'min_widths',
    'functional_classes',
  ];

  for (const tableName of requiredTables) {
    if (!Array.isArray(tables[tableName])) {
      throw new Error(`Dataset must have ${tableName} as an array`);
    }
  }
}

/**
 * Get dataset metadata without loading the full dataset
 */
export function getDatasetMeta(version: DatasetVersion = getCurrentDatasetVersion()): {
  ordinance: string;
  version: string;
  effective_from: string;
  source: string;
} {
  const dataset = loadDataset(version);
  return {
    ordinance: dataset.meta.ordinance,
    version: dataset.meta.version,
    effective_from: dataset.meta.effective_from,
    source: dataset.meta.source,
  };
}

/**
 * Clear the dataset cache (useful for testing)
 */
export function clearDatasetCache(): void {
  datasetCache.clear();
}
