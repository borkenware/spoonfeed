/*
 * Copyright (c) 2020 Borkenware, All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software without
 *    specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

jest.mock('fs', function () {
  const { Volume, createFsFromVolume } = require('memfs')
  return createFsFromVolume(
    Volume.fromJSON({
      '/test/fs/case1/a.md': '',
      '/test/fs/case1/b.md': '',
      '/test/fs/case2/cat1/a.md': '',
      '/test/fs/case2/cat1/b.md': '',
      '/test/fs/case2/cat2/a.md': '',
      '/test/fs/case2/cat2/b.md': '',
      '/test/fs/case3/a.md': '',
      '/test/fs/case3/b.md': '',
      '/test/fs/case3/c.txt': '',
      '/test/fs/case4/cat1/a.md': '',
      '/test/fs/case4/cat1/b.md': '',
      '/test/fs/case4/cat2/a.md': '',
      '/test/fs/case4/cat2/b.md': '',
      '/test/fs/case4/cat2/aaa/uwu.md': ''
    })
  )
})

jest.mock('fs/promises', function () {
  const fs = jest.requireMock('fs')
  return { readdir: (path: string) => Promise.resolve(fs.readdirSync(path)) }
})

import fsToRegistry from '../src/filesystem'

describe('filesystem crawler', function () {
  test('finds files', async function () {
    const res = await fsToRegistry('/test/fs/case1')
    expect(res.documentCount).toBe(2)
    expect(res.documents.length).toBe(2)
  })

  test('crawls categories', async function () {
    const res = await fsToRegistry('/test/fs/case2')
    expect(res.documentCount).toBe(4)
    expect(res.documents.length).toBe(2)
    expect(typeof res.documents[0]).toBe('object')
    expect(typeof res.documents[1]).toBe('object')
    expect((res.documents[0] as any).documents.length).toBe(2)
    expect((res.documents[1] as any).documents.length).toBe(2)
  })

  test('ignores non-md files', async function () {
    const res = await fsToRegistry('/test/fs/case3')
    expect(res.documentCount).toBe(2)
    expect(res.documents.length).toBe(2)
  })

  test('ignores sub-categories', async function () {
    const res = await fsToRegistry('/test/fs/case4')
    expect(res.documentCount).toBe(4)
    expect(res.documents.length).toBe(2)
    expect(typeof res.documents[0]).toBe('object')
    expect(typeof res.documents[1]).toBe('object')
    expect((res.documents[0] as any).documents.length).toBe(2)
    expect((res.documents[1] as any).documents.length).toBe(2)
  })

  test.todo('sorts files based on their prefix')
  test.todo('keeps original sorting for mixed files not prefixed')
})

describe('registry validator', function () {
  test.todo('recognizes valid registry')
  test.todo('rejects on non existing document')
  test.todo('rejects on non existing category')
  test.todo('rejects on non existing document within category')
})
