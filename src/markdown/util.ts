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

import { MarkdownType } from '../types/markdown.js'
import type { MarkdownNode, ParserBlockRule, ParserInlineRule, ParsedNode } from '../types/markdown.js'

interface InlineParseMatch {
  start: number
  end: number
  string: string
  type: MarkdownType
  recurse: boolean
}

function findTextNodes (nodes: Array<MarkdownNode | string>): string[] {
  const found = []

  for (const node of nodes) {
    if (typeof node === 'string') found.push(node)
    else if ('content' in node) {
      if (node.type === MarkdownType.TEXT && typeof node.content === 'string') found.push(node.content)
      const items = Array.isArray(node.content) ? node.content : [ node.content ]
      found.concat(findTextNodes(items))
    }
  }

  return found
}

export function parseBlocks (ruleset: ParserBlockRule[], markdown: string): ParsedNode[] {
  const buffer: Array<string | ParsedNode> = [ markdown ]

  for (const rule of ruleset) {
    for (let i = 0; i < buffer.length; i++) {
      let item: string | ParsedNode = buffer[i]
      if (typeof item !== 'string') continue

      let delta = 0
      const matches = typeof rule.regexp === 'function' ? rule.regexp(item) : item.matchAll(rule.regexp)
      for (const match of matches) {
        if (typeof match.index === 'undefined') continue
        const index = match.index - delta

        const before = item.slice(0, index)
        const after = item.slice(index + match[0].length)
        const block = {
          node: rule.type,
          markup: rule.noTrim ? match[0] : match[0].trim(),
        }

        const newItems = [ before, block, after ].filter(Boolean)
        buffer.splice(i, 1, ...newItems)

        delta += index + match[0].length
        item = buffer[i += before ? 2 : 1] as string
      }
    }
  }

  return buffer.filter((e) => typeof e !== 'string') as ParsedNode[]
}

export function parseInline (ruleset: ParserInlineRule[], markdown: string): ParsedNode[] {
  const found: InlineParseMatch[] = []

  for (const rule of ruleset) {
    for (const match of markdown.matchAll(rule.regexp)) {
      if (typeof match.index === 'undefined') continue
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        string: match[rule.extract ?? 0],
        type: rule.type,
        recurse: Boolean(rule.recurse),
      })
    }
  }

  const sorted = found.sort((a, b) => a.start > b.start ? 1 : a.start < b.start ? -1 : 0)
  const res: ParsedNode[] = []
  let cursor = 0
  for (const match of sorted) {
    if (match.start < cursor) continue
    if (match.start - cursor > 0) {
      res.push({
        node: MarkdownType.TEXT,
        markup: markdown.slice(cursor, match.start).replace(/\n/g, ' '),
      })
    }

    res.push({
      node: match.type,
      markup: match.recurse ? parseInline(ruleset, match.string) : match.string,
    })
    cursor = match.end
  }

  if (cursor < markdown.length) {
    res.push({
      node: MarkdownType.TEXT,
      markup: markdown.slice(cursor).replace(/\n/g, ' '),
    })
  }

  return res
}

export function flattenToText (node: MarkdownNode): string | null {
  if (node.type === MarkdownType.TEXT) return node.content
  if ('content' in node && Array.isArray(node.content)) {
    return findTextNodes(node.content)
      .filter(Boolean)
      .join(' ')
  }

  return null
}
