import { Router } from 'express'
import { z } from 'zod'
import { apiError, apiHandler } from '../utils/response'
import { env } from '../utils/env'
import { sendEmail, feedbackEmail } from '../utils/mailer'
import { getSession, isDemoSession } from './_session'

// Mirrors nuxt-boilerplate/server/api/feedback.post.ts.
// Mounted at /api/feedback (see server/api/index.ts):
//   POST /api/feedback → { delivered, id }
const FeedbackInput = z.object({
  category: z.enum(['bug', 'idea', 'praise']),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(120, 'Subject must be 120 characters or fewer'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(4000, 'Message must be 4000 characters or fewer'),
})

export const feedbackRouter: Router = Router()

feedbackRouter.post('/', apiHandler(async (req) => {
  const session = await getSession(req)

  // Demo sessions are minted by anyone on demand; don't let them relay
  // email through our sender.
  if (isDemoSession(session)) {
    throw apiError('FORBIDDEN', 'Feedback is disabled in demo mode.')
  }

  const parsed = FeedbackInput.safeParse(req.body)
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
  }))

  return { delivered: Boolean(id) || !env.RESEND_API_KEY, id }
}))
