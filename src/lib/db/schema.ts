/**
 * Database Schema
 * Projects table for storing user compliance checks
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  data: text('data').notNull(), // JSON stringified project data
  created_at: integer('created_at', { mode: 'timestamp' }).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).notNull(),
  last_evaluation: text('last_evaluation'), // JSON stringified result (optional)
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
