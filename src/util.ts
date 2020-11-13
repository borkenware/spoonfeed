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

import { join }  from 'path'
import { existsSync }  from 'fs'
import { readdir, lstat, unlink, rmdir }  from 'fs/promises'

export type ExtendedType = 'string' | 'number' | 'bigint' |
  'boolean' | 'symbol' | 'undefined' | 'object' | 'function' |
  'array' | 'null' | 'nan'

const units = [ 'ns', 'µs', 'ms', 's' ]

export function extendedTypeof (obj: any): ExtendedType {
  let type: ExtendedType = typeof obj
  if (type === 'object' && Array.isArray(obj)) type = 'array'
  if (type === 'object' && obj === null) type = 'null'
  if (type === 'number' && isNaN(obj)) type = 'nan'

  return type
}

export function hasOwnProperty<X extends {}, Y extends PropertyKey>(obj: X, prop: Y): obj is X & Record<Y, any> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

export function formatDelta (from: bigint, to: bigint) {
  let passes = 0
  let delta = Number(to - from)
  while (delta > 2000 && passes < 4) {
    delta = delta / 1000
    passes++
  }

  return `${delta.toFixed(2)} ${units[passes]}`
}

export function sluggify (string: string) {
  return string.replace(/(^\d+-|\.(md|markdown)$)/ig, '')
    .replace(/[^a-z]+/ig, '-').replace(/(^-+|-+$)/ig, '').toLowerCase()
}

export function slugToTitle (slug: string) {
  return slug.split('-').map(s => s[0].toUpperCase() + s.slice(1).toLowerCase()).join(' ')
}

export async function rmdirRf (path: string) {
  if (existsSync(path)) {
    const files = await readdir(path);
    for (const file of files) {
      const curPath = join(path, file);
      const stat = await lstat(curPath);

      if (stat.isDirectory()) {
        await rmdirRf(curPath);
      } else {
        await unlink(curPath);
      }
    }
    await rmdir(path);
  }
}
