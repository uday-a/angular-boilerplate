import { describe, expect, it } from 'vitest'
import { recordAudit } from './audit'

describe('recordAudit', () => {
  it('never throws — even without a database', async () => {
    // No DATABASE_URL in the test env, so useDb() throws internally.
    // Audit must not break the product write it describes.
    await expect(recordAudit({
      userId: 1,
      action: 'test.event',
      entity: 'test',
      entityId: 42,
      metadata: { foo: 'bar' },
    })).resolves.toBeUndefined()
  })

  it('accepts minimal input', async () => {
    await expect(recordAudit({ action: 'test.minimal' })).resolves.toBeUndefined()
  })
})
