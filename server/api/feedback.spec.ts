import { describe, expect, it } from 'vitest'
import type { Request } from 'express'
import { MAX_FILE_BYTES, parseFeedbackBody } from './feedback'

async function multipartReq(files: File[]): Promise<Request> {
  const form = new FormData()
  form.set('category', 'bug')
  form.set('subject', 'Broken chart')
  form.set('message', 'The funnel chart overflows on mobile.')
  for (const f of files) form.append("files", f)
  const res = new Response(form)
  return {
    headers: { 'content-type': res.headers.get('content-type') },
    body: Buffer.from(await res.arrayBuffer()),
  } as unknown as Request
}

const png = (name: string, bytes = 10) => new File([new Uint8Array(bytes)], name, { type: 'image/png' })

describe('parseFeedbackBody', () => {
  it('reads fields and image attachments from multipart', async () => {
    const { fields, attachments } = await parseFeedbackBody(await multipartReq([png('a.png'), png('b.png')]))
    expect(fields).toEqual({ category: 'bug', subject: 'Broken chart', message: 'The funnel chart overflows on mobile.' })
    expect(attachments.map(a => [a.filename, a.contentType])).toEqual([['a.png', 'image/png'], ['b.png', 'image/png']])
  })

  // Client checks are bypassable, so the server enforces the same limits.
  it('rejects more than 3 files, non-images and files over 5 MB', async () => {
    await expect(parseFeedbackBody(await multipartReq([png('1.png'), png('2.png'), png('3.png'), png('4.png')]))).rejects.toThrow(/up to 3/)
    await expect(parseFeedbackBody(await multipartReq([new File(['x'], 'x.pdf', { type: 'application/pdf' })]))).rejects.toThrow(/not an image/)
    await expect(parseFeedbackBody(await multipartReq([png('big.png', MAX_FILE_BYTES + 1)]))).rejects.toThrow(/larger than 5 MB/)
  })

  it('still accepts a plain JSON body', async () => {
    const req = { headers: { 'content-type': 'application/json' }, body: { category: 'idea', subject: 'abc', message: 'hello there!' } } as unknown as Request
    expect((await parseFeedbackBody(req)).attachments).toEqual([])
  })
})
