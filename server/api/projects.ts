import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useDb, schema } from '../db/index'
import { apiError, apiHandler } from '../utils/response'
import { logger } from '../utils/logger'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/projects/index.ts +
// server/api/projects/[slug].ts. Mounted at /api/projects
// (see server/api/index.ts):
//   GET    /api/projects       → { projects }
//   POST   /api/projects       → { project }
//   GET    /api/projects/:slug → { project }
//   PUT    /api/projects/:slug → { project }
//   DELETE /api/projects/:slug → { deleted: true }
//
// All queries scope by ownerId = session.user.id so users only ever
// see their own rows.

const slug = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug must be 64 characters or fewer')
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Slug must be kebab-case (a-z, 0-9, hyphen)')

const CreateProject = z.object({
  slug,
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(2000).optional(),
})

const UpdateProject = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
})

export const projectsRouter: Router = Router()

projectsRouter.get('/', apiHandler(async (req) => {
  const session = await getSession(req)

  // Demo session has no DB row; surface a deterministic list so the UI
  // is clickable without polluting real data.
  if (isDemoSession(session)) return { projects: demoProjects() }

  const db = useDb()
  const rows = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.ownerId, session.user.id))
    .orderBy(schema.projects.createdAt)
  return { projects: rows }
}))

projectsRouter.post('/', apiHandler(async (req) => {
  const session = await getSession(req)

  const parsed = CreateProject.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid project payload', {
      issues: parsed.error.issues,
    })
  }

  if (isDemoSession(session)) {
    // Demo: echo back without persisting.
    return {
      project: {
        id: 0,
        ownerId: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        description: null,
        ...parsed.data,
      },
    }
  }

  const db = useDb()
  try {
    const [project] = await db
      .insert(schema.projects)
      .values({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        ownerId: session.user.id,
      })
      .returning()
    logger.info('projects.created', { ownerId: session.user.id, slug: parsed.data.slug })
    return { project }
  }
  catch (e) {
    // Drizzle + postgres-js bubble pg's unique_violation as code '23505'.
    if ((e as { code?: string }).code === '23505') {
      throw apiError('VALIDATION_FAILED', `A project with slug '${parsed.data.slug}' already exists`, { field: 'slug' })
    }
    throw e
  }
}))

projectsRouter.get('/:slug', apiHandler(async (req) => {
  const session = await getSession(req)
  const slugParam = firstParam(req.params['slug'])
  if (!slugParam) throw apiError('VALIDATION_FAILED', 'Missing slug')

  if (isDemoSession(session)) {
    const demo = demoBySlug(slugParam)
    if (!demo) throw apiError('NOT_FOUND', `Project ${slugParam} does not exist`)
    return { project: demo }
  }

  const db = useDb()
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(and(eq(schema.projects.slug, slugParam), eq(schema.projects.ownerId, session.user.id)))
    .limit(1)
  if (!project) throw apiError('NOT_FOUND', `Project ${slugParam} does not exist`)
  return { project }
}))

projectsRouter.put('/:slug', apiHandler(async (req) => {
  const session = await getSession(req)
  const slugParam = firstParam(req.params['slug'])
  if (!slugParam) throw apiError('VALIDATION_FAILED', 'Missing slug')

  const parsed = UpdateProject.safeParse(req.body)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid project payload', {
      issues: parsed.error.issues,
    })
  }

  if (isDemoSession(session)) {
    const demo = demoBySlug(slugParam)
    if (!demo) throw apiError('NOT_FOUND', `Project ${slugParam} does not exist`)
    return { project: { ...demo, ...parsed.data, updatedAt: new Date() } }
  }

  const db = useDb()
  const [project] = await db
    .update(schema.projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(schema.projects.slug, slugParam), eq(schema.projects.ownerId, session.user.id)))
    .returning()
  if (!project) throw apiError('NOT_FOUND', `Project ${slugParam} does not exist`)
  logger.info('projects.updated', { ownerId: session.user.id, slug: slugParam })
  return { project }
}))

projectsRouter.delete('/:slug', apiHandler(async (req) => {
  const session = await getSession(req)
  const slugParam = firstParam(req.params['slug'])
  if (!slugParam) throw apiError('VALIDATION_FAILED', 'Missing slug')

  if (isDemoSession(session)) return { deleted: true }

  const db = useDb()
  const [project] = await db
    .delete(schema.projects)
    .where(and(eq(schema.projects.slug, slugParam), eq(schema.projects.ownerId, session.user.id)))
    .returning({ id: schema.projects.id })
  if (!project) throw apiError('NOT_FOUND', `Project ${slugParam} does not exist`)
  logger.info('projects.deleted', { ownerId: session.user.id, slug: slugParam })
  return { deleted: true }
}))

// Express 5 types params as string | string[]; single-segment :slug is
// always a string at runtime — narrow once for the query builders.
function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Deterministic demo data so the UI looks populated in demo mode.
function demoProjects() {
  return [
    { id: 1, slug: 'design-engineering', name: 'Design Engineering', description: 'Frontend platform, design system, UX research.', ownerId: 0, createdAt: new Date('2026-01-12'), updatedAt: new Date('2026-04-30') },
    { id: 2, slug: 'sales-marketing', name: 'Sales & Marketing', description: 'GTM ops, campaigns, pipeline analytics.', ownerId: 0, createdAt: new Date('2026-02-04'), updatedAt: new Date('2026-05-12') },
    { id: 3, slug: 'travel', name: 'Travel', description: 'Trip planning, expense tracking, traveler ops.', ownerId: 0, createdAt: new Date('2026-03-19'), updatedAt: new Date('2026-05-15') },
  ]
}

function demoBySlug(slugParam: string) {
  return demoProjects().find(d => d.slug === slugParam)
}
