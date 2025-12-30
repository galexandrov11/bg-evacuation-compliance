/**
 * Project API Routes (by ID)
 * GET, PUT, DELETE operations for single project (user-scoped)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function checkDbConfig() {
  if (!process.env.TURSO_DATABASE_URL) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }
  return null;
}

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbError = checkDbConfig();
  if (dbError) return dbError;

  try {
    const { id } = await params;
    const db = getDb();

    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.user_id, session.user.id)))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...project,
      data: JSON.parse(project.data),
      last_evaluation: project.last_evaluation
        ? JSON.parse(project.last_evaluation)
        : null,
    });
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbError = checkDbConfig();
  if (dbError) return dbError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, data, last_evaluation } = body;
    const db = getDb();

    const existing = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.user_id, session.user.id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    await db
      .update(projects)
      .set({
        name: name ?? existing.name,
        data: data ? JSON.stringify(data) : existing.data,
        updated_at: now,
        last_evaluation: last_evaluation
          ? JSON.stringify(last_evaluation)
          : existing.last_evaluation,
      })
      .where(and(eq(projects.id, id), eq(projects.user_id, session.user.id)));

    return NextResponse.json({
      id,
      name: name ?? existing.name,
      updated_at: now
    });
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbError = checkDbConfig();
  if (dbError) return dbError;

  try {
    const { id } = await params;
    const db = getDb();

    const existing = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.user_id, session.user.id)))
      .get();

    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.user_id, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
