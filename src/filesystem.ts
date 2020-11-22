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
import { existsSync } from 'fs'
import { stat, readdir as fsReaddir } from 'fs/promises'

import type { DocumentRegistry, RawDocumentRegistry } from './config/types'

let md = /\.(md|markdown)$/i

interface ReaddirResult {
  folders: string[]
  files: string[]
}

async function readdir (folder: string): Promise<ReaddirResult> {
  let files: string[] = []
  let folders: string[] = []

  for (let file of await fsReaddir(folder)) {
    let fileStat = await stat(join(folder, file))
    if (fileStat.isDirectory()) {
      folders.push(file)
    } else if (md.test(file)) {
      files.push(file)
    }
  }

  return { files: files, folders: folders }
}

export function validateRegistry (basepath: string, registry: RawDocumentRegistry): boolean {
  for (let r of registry) {
    if (typeof r === 'string') {
      if (!existsSync(join(basepath, r))) return false
    } else {
      let base = join(basepath, r.category)
      for (let d of r.documents) {
        if (!existsSync(join(base, d))) return false
      }
    }
  }

  return true
}

export default async function fsToRegistry (basepath: string): Promise<DocumentRegistry> {
  let registry: DocumentRegistry = {
    documentCount: 0,
    documents: [],
  }

  let res = await readdir(basepath)
  registry.documentCount += res.files.length
  registry.documents.push(...res.files.map((f) => join(basepath, f)))
  for (let folder of res.folders) {
    let { files } = await readdir(join(basepath, folder))
    let documents = files.map((f) => join(basepath, folder, f))
    registry.documentCount += documents.length
    registry.documents.push({ category: folder, documents: documents })
  }

  return registry
}
