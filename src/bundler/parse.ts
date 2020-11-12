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

import { readFile } from 'fs/promises'
import { basename } from 'path'
import parse from '../markdown/parser'
import { flattenToText, slugToTitle } from '../markdown/util'
import { MarkdownType } from '../markdown/types'
import { DocumentRegistry } from '../config/types'

import { ParsedCategories, ParsedDocument, ParsedRegistry } from './types'

function sluggify (string: string) {
  return string.replace(/(^\d+-|\.(md|markdown)$)/ig, '').replace(/_/g, '-')
}

async function parseFile (file: string): Promise<ParsedDocument> {
  const markdown = await readFile(file, 'utf8')
  const parsed = parse(markdown)
  const header = parsed.tree.find(n => n.type === MarkdownType.Heading && n.level === 1)
  const title = header ? flattenToText(header) : null

  if (!header || !title || !title.trim()) {
    throw new Error(`Invalid document! Document at ${file} did not contain a Heading 1, or no text could be extracted from it.`)
  }

  return { title, slug: sluggify(basename(file)), nodes: parsed.tree }
}

export default async function parseDocuments (reg: DocumentRegistry): Promise<ParsedRegistry> {
  const categories: ParsedCategories[] = []
  const uncategorized: ParsedCategories = { title: '',  slug: '', documents: [] }

  for (const item of reg.documents) {
    if (typeof item === 'string') {
      const doc = await parseFile(item)
      uncategorized.documents.push(doc)
      continue
    }

    const slug = sluggify(item.category)
    // todo: category manifest
    const category: ParsedCategories = { title: slugToTitle(slug), slug, documents: [] }
    for (const d of item.documents) {
      const doc = await parseFile(d)
      category.documents.push(doc)
    }
    categories.push(category)
  }

  if (uncategorized.documents.length !== 0) {
    categories.unshift(uncategorized)
  }

  return { categories }
}
