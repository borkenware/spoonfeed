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
      '/test/resolver/case3/package.json': '{}',

      '/test/reader/case1/package.json': '{}',
      '/test/reader/case1/spoonfeed.config.js': 'module.exports = { ui: { title: "Test docs" } }',
      '/test/reader/case2/package.json': '{}',
      '/test/reader/case2/spoonfeed.config.js': 'module.exports = { ui: { title: "Test docs" }',
      '/test/reader/case3/package.json': '{}',
      '/test/reader/case3/spoonfeed.config.js': 'const cfg = { ui: { title: "Test docs" } }',
      '/test/reader/case4/package.json': '{}',
      '/test/reader/case4/spoonfeed.config.js': 'module.exports = "uwu"',
      '/test/reader/case5/package.json': '{}',
      '/test/reader/case5/spoonfeed.config.js': 'module.exports = { ui: { title: false } }',
      '/test/reader/case6/package.json': '{}'
    })
  )

  const { existsSync } = memfs
  memfs.existsSync = jest.fn(existsSync)
  return memfs
})

import * as fs from 'fs'
import readConfig, { findConfig } from '../src/config'
import validate from '../src/config/validator'

describe('resolver', function () {
  afterEach(() => (fs.existsSync as any).mockClear())

  test('resolves the config path', function () {
    const res = findConfig('/test/resolver/case1')
    expect(res.cfg).toBe('/test/resolver/case1/spoonfeed.config.js')
  })

  test('resolves the config path in a parent folder', function () {
    const res = findConfig('/test/resolver/case2/src')
    expect(res.cfg).toBe('/test/resolver/case2/spoonfeed.config.js')
  })

  test('stops at project root', function () {
    const res = findConfig('/test/resolver/case3/src')
    expect(res.cfg).toBeNull()
    expect(fs.existsSync).toHaveBeenCalledTimes(4)
  })

  test('stops at system root', function () {
    const res = findConfig('/test/resolver')
    expect(res.cfg).toBeNull()
    expect(fs.existsSync).toHaveBeenCalledTimes(6)
  })
})

describe('validator', function () {
  let ogCwd = process.cwd
  afterEach(() => (process.cwd = ogCwd))

  test('doesn\'t reject valid config', function () {
    expect(function () {
      validate({
        documents: { path: 'docs/yes' },
        ui: { title: 'Test docs', copyright: null },
        build: { mode: 'preact' },
        ssr: { generate: true, ssl: { cert: '/ssl.crt', key: '/ssl.key' } }
      })
    }).not.toThrow()
  })

  test('rejects invalid config types', function () {
    expect(function () {
      validate({
        documents: { path: 'docs/yes' },
        ui: { title: false },
        ssr: { generate: true }
      } as any) // as any since we're intentionally breaking types
    }).toThrow(/invalid field type/i)
  })

  test('rejects invalid config values', function () {
    expect(function () {
      validate({
        documents: { path: 'docs/yes' },
        build: { mode: 'magic' },
        ssr: { generate: true }
      } as any) // as any since we're intentionally breaking types
    }).toThrow(/invalid field value/i)
  })

  test('rejects missing fields', function () {
    expect(function () {
      validate({
        documents: { path: 'docs/yes' },
        ui: { title: 'Test docs' },
        ssr: { http2: true }
      } as any) // as any since we're intentionally breaking types
    }).toThrow(/missing required field/i)
  })
})

describe('reader', function () {
  let ogCwd = process.cwd
  afterEach(() => (process.cwd = ogCwd))

  function mockConfig (mockCwd) {
    process.cwd = () => mockCwd
    jest.mock(`${mockCwd}/spoonfeed.config.js`, function () {
      const fs = jest.requireMock('fs')
      const js = fs.readFileSync(`${mockCwd}/spoonfeed.config.js`, 'utf8')
      let module: any = {}
      eval(js)
      return module.exports
    }, { virtual: true })
  }

  test('reads config normally', function () {
    mockConfig('/test/reader/case1')
    expect(readConfig).not.toThrow()
  })

  test('handles invalid JS in config', function () {
    mockConfig('/test/reader/case2')
    expect(readConfig).toThrow(SyntaxError)
  })

  test('handles no exports', function () {
    mockConfig('/test/reader/case3')
    expect(readConfig).toThrow(/no config was exported/i)
  })

  test('handles invalid exports', function () {
    mockConfig('/test/reader/case4')
    expect(readConfig).toThrow(/invalid field type(.*?)for root/i)
  })

  test('throws on invalid config', function () {
    mockConfig('/test/reader/case5')
    expect(readConfig).toThrow()
  })

  test('allows no config', function () {
    process.cwd = () => '/test/reader/case6'
    expect(readConfig).not.toThrow()
  })
})
