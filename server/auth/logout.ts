// Logout: clears the session cookie and bounces to /login.
// Mounted on BOTH POST (fetch from the app) and GET (plain <a> links).
// Ported from nuxt-boilerplate/server/routes/auth/logout.{get,post}.ts.
import type { Request, Response } from 'express'
import { clearUserSession } from './session'

export async function logout(req: Request, res: Response): Promise<void> {
  await clearUserSession(req, res)
  res.redirect('/login')
}
