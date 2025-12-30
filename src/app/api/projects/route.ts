/**
 * Projects API Routes
 * CRUD operations for saved projects (user-scoped)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { projects } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';

// GET /api/projects - List user's projects
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.TURSO_DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const db = getDb();
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        created_at: projects.created_at,
        updated_at: projects.updated_at,
      })
      .from(projects)
      .where(eq(projects.user_id, session.user.id))
      .orderBy(desc(projects.updated_at));

    return NextResponse.json(userProjects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.TURSO_DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { name, data, last_evaluation } = body;

    if (!name || !data) {
      return NextResponse.json(
        { error: 'Name and data are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = nanoid();
    const now = new Date();

    await db.insert(projects).values({
      id,
      user_id: session.user.id,
      name,
      data: JSON.stringify(data),
      created_at: now,
      updated_at: now,
      last_evaluation: last_evaluation ? JSON.stringify(last_evaluation) : null,
    });

    return NextResponse.json({ id, name, created_at: now, updated_at: now });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
