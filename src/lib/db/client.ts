/**
 * Turso Database Client
 * Lazy initialization to avoid build-time errors
 */

import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';

let client: Client | null = null;
let database: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is not configured');
  }

  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }

  return client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!database) {
    database = drizzle(getClient(), { schema });
  }
  return database;
}

// For compatibility - lazy getter
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    return getDb()[prop as keyof LibSQLDatabase<typeof schema>];
  },
});
