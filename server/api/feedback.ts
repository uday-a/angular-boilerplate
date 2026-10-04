import express, { Router, type Request } from 'express'
import { z } from 'zod'
import { apiError, apiHandler } from '../utils/response'
import { env } from '../utils/env'
import { sendEmail, feedbackEmail, type EmailAttachment } from '../utils/mailer'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/feedback.post.ts.
// Mounted at /api/feedback (see server/api/index.ts):
//   POST /api/feedback (JSON, or multipart/form-data with screenshots) → { delivered, id }
const FeedbackInput = z.object({
  category: z.enum(['bug', 'idea', 'praise']),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(120, 'Subject must be 120 characters or fewer'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(4000, 'Message must be 4000 characters or fewer'),
})

// Attachments are screenshots, so images only. Client validates first;
// the server re-checks every file because client checks are bypassable.
export const MAX_FILES = 3
export const MAX_FILE_BYTES = 5 * 1024 * 1024

interface ParsedFeedback {
  fields: Record<string, unknown>
  attachments: EmailAttachment[]
}

// Multipart arrives as a raw Buffer (express.raw below); the platform's
// Response.formData() parses it — no multipart dependency needed.
export async function parseFeedbackBody(req: Request): Promise<ParsedFeedback> {
  const contentType = req.headers['content-type'] ?? ''
  if (!contentType.includes('multipart/form-data')) {
    const body = (req.body ?? {}) as Record<string, unknown>
    return { fields: { category: body['category'], subject: body['subject'], message: body['message'] }, attachments: [] }
  }
  if (!Buffer.isBuffer(req.body)) throw apiError('VALIDATION_FAILED', 'Invalid feedback payload')
  let form: FormData
  try {
    form = await new Response(new Uint8Array(req.body), { headers: { 'content-type': contentType } }).formData()
  }
  catch {
    throw apiError('VALIDATION_FAILED', 'Invalid feedback payload')
  }
  const text = (name: string) => {
    const v = form.get(name)
    return typeof v === 'string' ? v : undefined
  }
  const files = [...form.values()].filter((v): v is File => typeof v !== 'string')
  if (files.length > MAX_FILES) throw apiError('VALIDATION_FAILED', `You can attach up to ${MAX_FILES} images`)
  const attachments = await Promise.all(files.map(async (file) => {
    const filename = file.name || 'attachment'
    if (!file.type.startsWith('image/')) throw apiError('VALIDATION_FAILED', `${filename} is not an image`)
    if (file.size > MAX_FILE_BYTES) throw apiError('VALIDATION_FAILED', `${filename} is larger than 5 MB`)
    return { filename, content: Buffer.from(await file.arrayBuffer()).toString('base64'), contentType: file.type }
  }))
  return { fields: { category: text('category'), subject: text('subject'), message: text('message') }, attachments }
}

export const feedbackRouter: Router = Router()

// 3 × 5 MB plus form overhead. Larger bodies 413 before parsing.
feedbackRouter.use(express.raw({ type: 'multipart/form-data', limit: MAX_FILES * MAX_FILE_BYTES + 64 * 1024 }))

feedbackRouter.post('/', apiHandler(async (req) => {
  const session = await getSession(req)

  // Demo sessions are minted by anyone on demand; don't let them relay
  // email through our sender.
  if (isDemoSession(session)) {
    throw apiError('FORBIDDEN', 'Feedback is disabled in demo mode.')
  }

  const { fields, attachments } = await parseFeedbackBody(req)
  const parsed = FeedbackInput.safeParse(fields)
  if (!parsed.success) {
    throw apiError('VALIDATION_FAILED', 'Invalid feedback payload', {
      issues: parsed.error.issues,
    })
  }

  // Where to deliver: EMAIL_OPS if set, otherwise EMAIL_FROM so an
  // unconfigured prod doesn't accidentally ship feedback to a random
  // address. Both surfaces print to consola in dev (no Resend key).
  const to = env.EMAIL_OPS ?? env.EMAIL_FROM

  const { id } = await sendEmail(feedbackEmail({
    to,
    reporter: {
      name: session.user.name ?? session.user.login,
      email: session.user.email ?? `${session.user.login}@github.invalid`,
      login: session.user.login,
    },
    category: parsed.data.category,
    subject: parsed.data.subject,
    message: parsed.data.message,
    ...(attachments.length ? { attachments } : {}),
  }))

  return { delivered: Boolean(id) || !env.RESEND_API_KEY, id }
}))
