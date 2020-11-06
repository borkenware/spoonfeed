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
import { cursorTo } from 'readline'
import readConfig from '../config'
import { Config, DocumentRegistry } from '../config/types'
import fsToRegistry, { validateRegistry } from '../filesystem'
import { formatDelta } from '../util'

let point: bigint
let prevStep: string | null = null
let cur = 0
function logStep (step: string | null) {
  if (prevStep) {
    cursorTo(process.stdout, 0)
    console.log(`Step ${cur} ${prevStep} - Done in ${formatDelta(point, process.hrtime.bigint())}`)
  }

  if (step) {
    prevStep = step
    process.stdout.write(`Step ${++cur} ${step}...`)
    point = process.hrtime.bigint()
  }
}

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

export default async function bundle () {
  const start = process.hrtime.bigint()
  const config = readConfig()
  const registry = await resolveRegistry(config)
  console.log(`Found ${registry.documentCount} documents to bundle to ${config.build.mode}.`)

  logStep('Parsing markdown files')
  // todo

  logStep('Generating code')
  // todo

  logStep('Assemble app')
  // todo

  if (config.ssr.generate) {
    logStep('Generate server')
    // todo
  }

  logStep(null)
  const end = process.hrtime.bigint()
  console.log(`Success! Took ${formatDelta(start, end)}`)
}
