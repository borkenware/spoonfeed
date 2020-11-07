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
import * as log from '../log'
import readConfig from '../config'
import { Config, DocumentRegistry } from '../config/types'
import fsToRegistry, { validateRegistry } from '../filesystem'
import { formatDelta } from '../util'

import parseDocuments from './parse'

function resolveRegistry (config: Config): Promise<DocumentRegistry> {
  const path = join(config.workdir, config.documents.path)
  if (config.documents.source === 'filesystem') {
    if (!existsSync(path)) {
      throw new Error(`Invalid configuration! The specified path does not exist! ${path}`)
    }

    return fsToRegistry(path)
  } else {
    if (!validateRegistry(path, config.documents.documents)) {
      throw new Error('Invalid documentation! Some documents in the registry could not be found.')
    }

    const documentCount = config.documents.documents
      .map(d => typeof d === 'string' ? 1 : d.documents.length)
      .reduce((a, b) => a + b)

    return Promise.resolve({ documentCount, documents: config.documents.documents })
  }
}

async function doBundle () {
  const config = readConfig()
  const registry = await resolveRegistry(config)
  log.debug(`Found ${registry.documentCount} documents to bundle to ${config.build.mode}.`)

  log.debug('Parsing markdown files')
  const categories = await parseDocuments(registry)
  categories.resources = categories.resources.map(r => ({ ...r, path: join(config.documents.assets, r.path) }))

  // console.log(categories.resources)

  log.debug('Generating code')
  // todo

  log.debug('Assemble app')
  // todo

  if (config.ssr.generate) {
    log.debug('Generate server')
    // todo
  }

  log.info('test log')
  log.warn('test log')
  log.error('test log')
}

export default async function bundle () {
  const start = process.hrtime.bigint()
  try {
    await doBundle()
  } catch (e) {
    log.error('Failed to build the documentation!', e)
  } finally {
    const end = process.hrtime.bigint()
    log.success(`Took ${formatDelta(start, end)}`)
  }
}