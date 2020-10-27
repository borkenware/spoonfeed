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

import { MarkdownType, RawMarkdownNode } from './types';

export interface ParserRule {
  regexp: RegExp | ((markdown: string) => Record<string | number, any>[])
  type: MarkdownType
  noTrim?: boolean
  recurse?: boolean
  extract?: number
}

export function parseBlocks (ruleset: ParserRule[], markdown: string): RawMarkdownNode[] {
  const buffer: any[] = [ markdown ]

  for (const rule of ruleset) {
    for (let i = 0; i < buffer.length; i++) {
      if (typeof buffer[i] !== 'string') continue

      let delta = 0
      const matches = typeof rule.regexp === 'function' ? rule.regexp(buffer[i]) : buffer[i].matchAll(rule.regexp)
      for (const match of matches) {
        const index = match.index - delta

        const before = buffer[i].slice(0, index)
        const after = buffer[i].slice(index + match[0].length)
        const str = match[rule.extract || 0]
        const block = {
          type: rule.type,
          content: rule.noTrim ? str : str.trim()
        }

        const newItems = [ before, block, after ].filter(Boolean)
        buffer.splice(i, 1, ...newItems)

        delta += index + match[0].length
        i += before ? 2 : 1
      }
    }
  }

  return buffer.filter(e => typeof e !== 'string') as RawMarkdownNode[]
}

export function parseInline (ruleset: ParserRule[], markdown: string): RawMarkdownNode[] {
  const found: any[] = []

  for (const rule of ruleset) {
    const matches = typeof rule.regexp === 'function' ? rule.regexp(markdown) : markdown.matchAll(rule.regexp)
    for (const match of matches) {
      found.push({
        start: match.index,
        end: match.index + match[0].length,
        string: match[rule.extract || 0],
        type: rule.type,
        recurse: rule.recurse
      })
    }
  }

  const sorted = found.sort((a, b) => a.start > b.start ? 1 : a.start < b.start ? -1 : 0)
  const res: RawMarkdownNode[] = []
  let cursor = 0
  for (const match of sorted) {
    if (match.start < cursor) continue
    if (match.start - cursor > 0) {
      res.push({
        type: MarkdownType.Text,
        content: markdown.slice(cursor, match.start).replace(/\n/g, ' ')
      })
    }

    res.push({
      type: match.type,
      content: match.recurse ? parseInline(ruleset, match.string) : match.string
    })
    cursor = match.end
  }

  if (cursor < markdown.length) {
    res.push({
      type: MarkdownType.Text,
      content: markdown.slice(cursor).replace(/\n/g, ' ')
    })
  }

  return res
}
