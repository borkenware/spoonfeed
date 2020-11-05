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

import { join } from 'path'
import { statSync } from 'fs'
import { readdir as fsReaddir } from 'fs/promises'

const md = /\.(md|markdown)$/i

interface ReaddirResult {
  folders: string[]
  files: string[]
}

export interface Category {
  category: string
  documents: string[]
}

export type Registry = Array<Category | string>

async function readdir (folder: string): Promise<ReaddirResult> {
  const files: string[] = []
  const folders: string[] = []

  for (const file of await fsReaddir(folder)) {
    if (statSync(join(folder, file)).isDirectory()) {
      folders.push(file)
    } else if (md.test(file)) {
      files.push(file)
    }
  }

  return { files, folders }
}

export default async function fsToRegistry (basepath: string): Promise<Registry> {
  const registry: Registry = []
  const res = await readdir(basepath)
  registry.push(...res.files.map(f => join(basepath, f)))
  for (const folder of res.folders) {
    const { files } = await readdir(join(basepath, folder))
    const documents = files.map(f => join(basepath, folder, f))
    registry.push({ category: folder.replace(/^\d+-/, ''), documents })
  }

  return registry
}
