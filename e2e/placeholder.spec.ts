import { expect, test } from '@playwright/test'

test('landing page renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: /the platform your team will actually use/i })).toBeVisible()
  await expect(page).toHaveTitle('The workspace your team will actually use | UIPKGE')
})

test('api ping responds through the same origin', async ({ page }) => {
  const res = await page.request.get('/api/ping')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  expect(body.ok).toBe(true)
})
