/*
 * Copyright (c) 2020-2021 Borkenware, All rights reserved.
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

import type { Config } from '../types/config.js'

import { existsSync } from 'fs'
import { dirname, join } from 'path'

import { extendedTypeof } from '../util.js'
import validate from './validator.js'

interface ConfigPath { cfg: string | null, dir: string }

const BaseConfig: Config = {
  workdir: '',
  documents: {
    source: 'filesystem',
    path: 'docs',
    assets: 'assets',
  },
  ui: {
    title: 'Documentation',
    description: 'A documentation generated by Spoonfeed',
    copyright: null,
    logo: null,
    favicon: null,
    acknowledgements: true,
  },
  build: {
    target: 'build',
    mode: 'preact',
    optimizeImg: true,
    offline: true,
    mangle: true,
    split: true,
  },
  ssr: {
    generate: false,
    redirectInsecure: false,
    http2: false,
    ssl: null,
  },
}

function mergeDeep (target: Record<string, unknown>, ...sources: Array<Record<string, unknown>>): Record<string, unknown> {
  if (!sources.length) return target
  const source = sources.shift()

  for (const key in source) {
    if (extendedTypeof(source[key]) === 'object') {
      if (!target[key]) Object.assign(target, { [key]: {} })
      mergeDeep(target[key] as Record<string, unknown>, source[key] as Record<string, unknown>)
    } else {
      Object.assign(target, { [key]: source[key] })
    }
  }

  return mergeDeep(target, ...sources)
}

export function findConfig (dir: string | null = null): ConfigPath {
  if (!dir) dir = process.cwd()

  if (existsSync(join(dir, 'spoonfeed.config.js'))) {
    return { cfg: join(dir, 'spoonfeed.config.js'), dir: dir }
  }

  if (existsSync(join(dir, 'package.json'))) {
    return { cfg: null, dir: dir }
  }

  const next = dirname(dir)
  if (next === dir) {
    // We reached system root
    return { cfg: null, dir: dir }
  }

  return findConfig(next)
}

export default async function readConfig (): Promise<Config> {
  let cfg: Record<string, unknown> | void = {}
  const path = findConfig()
  if (path.cfg) {
    try {
      cfg = await import(path.cfg).then((m) => m?.default) as Record<string, unknown> | void
    } catch (e) {
      throw new SyntaxError(e)
    }

    if (!cfg) throw new Error('No config was exported')
    validate(cfg)
  }

  const config = {}
  mergeDeep(config, BaseConfig, cfg, { workdir: path.dir })
  return config as Config
}
