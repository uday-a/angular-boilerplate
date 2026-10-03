import { describe, expect, it } from 'vitest'
import {
  ROLES,
  apiKeys,
  auditLogs,
  invites,
  magicLinkTokens,
  projects,
  projectsRelations,
  subscriptions,
  subscriptionsRelations,
  userRole,
  users,
  usersRelations,
} from './schema'

describe('schema', () => {
  it('exports the user_role enum with user/admin/editor', () => {
    expect(userRole.enumValues).toEqual(['user', 'admin', 'editor'])
    expect([...ROLES]).toEqual(['user', 'admin', 'editor'])
  })

  it('exports all seven tables', () => {
    expect(users).toBeDefined()
    expect(projects).toBeDefined()
    expect(subscriptions).toBeDefined()
    expect(magicLinkTokens).toBeDefined()
    expect(apiKeys).toBeDefined()
    expect(auditLogs).toBeDefined()
    expect(invites).toBeDefined()
  })

  it('exposes the expected columns', () => {
    // Users: identity + profile + prefs + timestamps.
    for (const col of ['id', 'email', 'githubId', 'login', 'name', 'avatarUrl', 'role', 'bio', 'timezone', 'locale', 'notifyEmail', 'notifyInApp', 'createdAt', 'updatedAt']) {
      expect(users[col as keyof typeof users], `users.${col}`).toBeDefined()
    }
    // Projects: slug + owner FK + timestamps.
    for (const col of ['id', 'slug', 'name', 'description', 'ownerId', 'createdAt', 'updatedAt']) {
      expect(projects[col as keyof typeof projects], `projects.${col}`).toBeDefined()
    }
    // Subscriptions: 1:1 userId + Polar mirror fields.
    for (const col of ['id', 'userId', 'polarCustomerId', 'polarSubscriptionId', 'productId', 'status', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'canceledAt', 'createdAt', 'updatedAt']) {
      expect(subscriptions[col as keyof typeof subscriptions], `subscriptions.${col}`).toBeDefined()
    }
    // Magic-link tokens: SHA-256 hex hash + TTL + single-use.
    for (const col of ['id', 'email', 'tokenHash', 'expiresAt', 'usedAt', 'createdAt']) {
      expect(magicLinkTokens[col as keyof typeof magicLinkTokens], `magicLinkTokens.${col}`).toBeDefined()
    }
    // API keys: hash (never raw) + prefix + scopes + lifecycle timestamps.
    for (const col of ['id', 'userId', 'name', 'keyHash', 'prefix', 'scopes', 'lastUsedAt', 'expiresAt', 'revokedAt', 'createdAt']) {
      expect(apiKeys[col as keyof typeof apiKeys], `apiKeys.${col}`).toBeDefined()
    }
    // Audit logs: append-only, no updatedAt.
    for (const col of ['id', 'userId', 'action', 'entity', 'entityId', 'metadata', 'createdAt']) {
      expect(auditLogs[col as keyof typeof auditLogs], `auditLogs.${col}`).toBeDefined()
    }
    // Invites: email + role + hashed token + 7-day TTL + single-use.
    for (const col of ['id', 'email', 'role', 'tokenHash', 'invitedBy', 'expiresAt', 'acceptedAt', 'createdAt']) {
      expect(invites[col as keyof typeof invites], `invites.${col}`).toBeDefined()
    }
  })

  it('exports drizzle relations', () => {
    expect(usersRelations).toBeDefined()
    expect(projectsRelations).toBeDefined()
    expect(subscriptionsRelations).toBeDefined()
  })
})
