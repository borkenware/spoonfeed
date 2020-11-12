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

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, basename } from 'path'

import * as log from '../log'
import readConfig from '../config'
import parseMarkdown from '../markdown/parser'
import fsToRegistry, { validateRegistry } from '../filesystem'
import { formatDelta, sluggify, slugToTitle } from '../util'
import { flattenToText } from '../markdown/util'
import codegen from './codegen'
import BundlerError from './error'

import { MarkdownType } from '../markdown/types'
import { BuildMode, Config, DocumentRegistry } from '../config/types'

export interface RenderedDocument {
  title: string
  slug: string
  category?: string
  parts: string[]
  code: string
}

export interface RenderedCategory {
  title: string
  slug: string
}

function resolveRegistry (config: Config): Promise<DocumentRegistry> {
  const path = join(config.workdir, config.documents.path)
  if (config.documents.source === 'filesystem') {
    if (!existsSync(path)) {
      throw new BundlerError(`Invalid configuration! The specified path does not exist! ${path}`)
    }

    return fsToRegistry(path)
  } else {
    if (!validateRegistry(path, config.documents.documents)) {
      throw new BundlerError('Invalid documentation! Some documents in the registry could not be found.')
    }

    const documentCount = config.documents.documents
      .map(d => typeof d === 'string' ? 1 : d.documents.length)
      .reduce((a, b) => a + b)

    return Promise.resolve({ documentCount, documents: config.documents.documents })
  }
}

async function parseFile (file: string, mode: BuildMode): Promise<RenderedDocument> {
  const md = await readFile(file, 'utf8')
  const parsed = parseMarkdown(md)
  const header = parsed.tree.find(n => n.type === MarkdownType.Heading && n.level === 1)
  const parts = parsed.tree.filter(n => n.type === MarkdownType.Heading && n.level === 2)
    .map(flattenToText).filter(Boolean) as string[]

  const title = header ? flattenToText(header) : null

  if (!header || !title || !title.trim()) {
    throw new Error(`Invalid document! Document at ${file} did not contain a Heading 1, or no text could be extracted from it.`)
  }

  return {
    title,
    parts,
    slug: sluggify(basename(file)),
    code: codegen(parsed.tree, mode)
  }
}

async function doBundle () {
  const config = readConfig()
  const registry = await resolveRegistry(config)
  log.debug(`Found ${registry.documentCount} documents to bundle to ${config.build.mode}.`)

  log.debug('Parsing markdown files')
  const documents: RenderedDocument[] = []
  const categories: RenderedCategory[] = []
  for (const item of registry.documents) {
    if (typeof item === 'string') {
      const doc = await parseFile(item, config.build.mode)
      documents.push(doc)
      continue
    }

    // todo: category manifest
    const slug = sluggify(item.category)
    categories.push({ title: slugToTitle(slug), slug })
    for (const d of item.documents) {
      const doc = await parseFile(d, config.build.mode)
      doc.category = slug
      documents.push(doc)
    }
  }

  log.debug('Assemble app')
  // todo

  if (config.ssr.generate) {
    log.debug('Generate server')
    // todo
  }
}

export default async function bundle () {
  const start = process.hrtime.bigint()
  try {
    log.info('Bundling...')
    await doBundle()
    log.success('Documentation built successfully!')
  } catch (e) {
    if (e instanceof BundlerError) log.error(e.message)
    else log.error('Failed to build the documentation!', e)
  } finally {
    const end = process.hrtime.bigint()
    log.info(`Took ${formatDelta(start, end)}`)
  }
}
