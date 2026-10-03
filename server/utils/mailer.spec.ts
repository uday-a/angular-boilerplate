import { afterEach, describe, expect, it, vi } from 'vitest'
import { consola } from 'consola'
import { env } from './env'
import { feedbackEmail, inviteEmail, magicLinkEmail, sendEmail, welcomeEmail } from './mailer'

const savedKey = env.RESEND_API_KEY

afterEach(() => {
  env.RESEND_API_KEY = savedKey
  vi.restoreAllMocks()
})

describe('welcomeEmail', () => {
  it('builds a tagged welcome message', () => {
    const email = welcomeEmail({ name: 'Ada', email: 'ada@x.com', siteUrl: 'https://acme.test' })
    expect(email.to).toBe('ada@x.com')
    expect(email.subject).toBe('Welcome to Acme')
    expect(email.text).toContain('Ada')
    expect(email.html).toContain('Ada')
    expect(email.html).toContain('https://acme.test/dashboard')
    expect(email.tags).toEqual([{ name: 'kind', value: 'welcome' }])
  })
})

describe('magicLinkEmail', () => {
  it('embeds the link and TTL', () => {
    const email = magicLinkEmail({ email: 'u@x.com', link: 'https://acme.test/auth/magic-link?token=abc', expiresInMin: 15 })
    expect(email.to).toBe('u@x.com')
    expect(email.subject).toBe('Sign in to Acme')
    expect(email.html).toContain('token=abc')
    expect(email.html).toContain('15 minutes')
    expect(email.text).toContain('15 minutes')
    expect(email.tags).toEqual([{ name: 'kind', value: 'magic-link' }])
  })
})

describe('inviteEmail', () => {
  it('embeds the link, role, and inviter', () => {
    const email = inviteEmail({ email: 'new@acme.test', link: 'https://acme.test/invite/abc123', role: 'editor', inviter: 'Ada' })
    expect(email.to).toBe('new@acme.test')
    expect(email.subject).toBe(`You're invited to Acme as editor`)
    expect(email.html).toContain('https://acme.test/invite/abc123')
    expect(email.html).toContain('Ada')
    expect(email.text).toContain('7 days')
    expect(email.tags).toEqual([{ name: 'kind', value: 'invite' }])
  })

  it('works without an inviter label', () => {
    const email = inviteEmail({ email: 'new@acme.test', link: 'https://acme.test/invite/abc123', role: 'user' })
    expect(email.subject).toBe(`You're invited to Acme as user`)
    expect(email.text).not.toContain('invited by')
    expect(email.html).toContain('https://acme.test/invite/abc123')
  })
})

describe('feedbackEmail', () => {
  it('builds a tagged ops message with replyTo', () => {
    const email = feedbackEmail({
      to: 'ops@acme.test',
      reporter: { name: 'Ada', email: 'ada@x.com', login: 'ada' },
      category: 'bug',
      subject: 'Broken button',
      message: 'Clicking save does nothing.',
    })
    expect(email.to).toBe('ops@acme.test')
    expect(email.subject).toBe('[Feedback · bug] Broken button')
    expect(email.replyTo).toBe('ada@x.com')
    expect(email.tags).toEqual([
      { name: 'kind', value: 'feedback' },
      { name: 'category', value: 'bug' },
    ])
    expect(email.text).toContain('ada@x.com')
  })

  it('escapes HTML in the message body', () => {
    const email = feedbackEmail({
      to: 'ops@acme.test',
      reporter: { name: 'Ada', email: 'ada@x.com', login: 'ada' },
      category: 'idea',
      subject: 'XSS?',
      message: '<script>alert("x")</script>',
    })
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.html).not.toContain('<script>')
  })
})

describe('sendEmail dry-run', () => {
  it('returns { id: null } without sending when RESEND_API_KEY is unset', async () => {
    env.RESEND_API_KEY = undefined
    const box = vi.spyOn(consola, 'box').mockImplementation(() => {})
    const result = await sendEmail({
      to: 'u@x.com',
      subject: 'dry run',
      html: '<p>hi</p>',
    })
    expect(result).toEqual({ id: null })
    expect(box).toHaveBeenCalledOnce()
  })
})
