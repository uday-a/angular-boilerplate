import { afterEach, describe, expect, it } from 'vitest'
import { env } from './env'
import { getPolar, planForProductId, productIdForPlan } from './polar'

const saved = {
  pro: env.POLAR_PRO_PRODUCT_ID,
  team: env.POLAR_TEAM_PRODUCT_ID,
  enterprise: env.POLAR_ENTERPRISE_PRODUCT_ID,
  token: env.POLAR_ACCESS_TOKEN,
  secret: env.POLAR_WEBHOOK_SECRET,
}

afterEach(() => {
  env.POLAR_PRO_PRODUCT_ID = saved.pro
  env.POLAR_TEAM_PRODUCT_ID = saved.team
  env.POLAR_ENTERPRISE_PRODUCT_ID = saved.enterprise
  env.POLAR_ACCESS_TOKEN = saved.token
  env.POLAR_WEBHOOK_SECRET = saved.secret
})

describe('productIdForPlan / planForProductId', () => {
  it('returns null for every plan when no product IDs are configured', () => {
    env.POLAR_PRO_PRODUCT_ID = undefined
    env.POLAR_TEAM_PRODUCT_ID = undefined
    env.POLAR_ENTERPRISE_PRODUCT_ID = undefined
    expect(productIdForPlan('pro')).toBeNull()
    expect(productIdForPlan('team')).toBeNull()
    expect(productIdForPlan('enterprise')).toBeNull()
  })

  it('maps plans to their configured product IDs', () => {
    env.POLAR_PRO_PRODUCT_ID = 'prod_pro_123'
    env.POLAR_TEAM_PRODUCT_ID = 'prod_team_456'
    env.POLAR_ENTERPRISE_PRODUCT_ID = 'prod_ent_789'
    expect(productIdForPlan('pro')).toBe('prod_pro_123')
    expect(productIdForPlan('team')).toBe('prod_team_456')
    expect(productIdForPlan('enterprise')).toBe('prod_ent_789')
  })

  it('inverts product IDs back to plans', () => {
    env.POLAR_PRO_PRODUCT_ID = 'prod_pro_123'
    env.POLAR_TEAM_PRODUCT_ID = 'prod_team_456'
    env.POLAR_ENTERPRISE_PRODUCT_ID = 'prod_ent_789'
    expect(planForProductId('prod_pro_123')).toBe('pro')
    expect(planForProductId('prod_team_456')).toBe('team')
    expect(planForProductId('prod_ent_789')).toBe('enterprise')
  })

  it('returns null for unknown product IDs', () => {
    env.POLAR_PRO_PRODUCT_ID = 'prod_pro_123'
    expect(planForProductId('prod_unknown_xyz')).toBeNull()
    expect(planForProductId('')).toBeNull()
  })
})

describe('getPolar', () => {
  it('returns null when Polar is unconfigured', async () => {
    env.POLAR_ACCESS_TOKEN = undefined
    env.POLAR_WEBHOOK_SECRET = undefined
    await expect(getPolar()).resolves.toBeNull()
  })

  it('returns null when only one of the pair is set', async () => {
    env.POLAR_ACCESS_TOKEN = 'polar_test_token'
    env.POLAR_WEBHOOK_SECRET = undefined
    await expect(getPolar()).resolves.toBeNull()
  })
})
