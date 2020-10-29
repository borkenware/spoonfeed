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
  const memfs = createFsFromVolume(
    Volume.fromJSON({
      '/test/resolver/case1/package.json': '{}',
      '/test/resolver/case1/spoonfeed.config.js': 'module.exports = {}',
      '/test/resolver/case2/package.json': '{}',
      '/test/resolver/case2/spoonfeed.config.js': 'module.exports = {}',
      '/test/resolver/case2/src/owo.js': 'module.exports = "uwu"',
      '/test/resolver/case3/package.json': '{}'
    })
  )

  const { existsSync } = memfs
  memfs.existsSync = jest.fn(existsSync)
  return memfs
})

import * as fs from 'fs'
import { findConfig } from '../src/config'

describe('resolver', function () {
  beforeEach(function () {
    (fs.existsSync as any).mockClear()
  })

  test('resolves the config path', function () {
    const res = findConfig('/test/resolver/case1')
    expect(res).toBe('/test/resolver/case1/spoonfeed.config.js')
  })

  test('resolves the config path in a parent folder', function () {
    const res = findConfig('/test/resolver/case2/src')
    expect(res).toBe('/test/resolver/case2/spoonfeed.config.js')
  })

  test('stops at project root', function () {
    const res = findConfig('/test/resolver/case3/src')
    expect(res).toBeNull()
    expect(fs.existsSync).toHaveBeenCalledTimes(4)
  })
})

describe('validator', function () {
  // todo
})
