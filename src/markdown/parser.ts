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

import { parseBlocks } from './util.js'
import parseInlineMarkup from './inline.js'

import { MarkdownType } from '../types/markdown.js'
import type {
  ParsedNode, MarkdownNode, SimpleMarkdownNode, ComposedMarkdownNode, HeadingMarkdownNode,
  NoteMarkdownNode, ListMarkdownNode, CodeBlockMarkdownNode, HttpItemMarkdownNode,
  HttpMarkdownNode, ListItemMarkdownNode, TableMarkdownNode,
} from '../types/markdown.js'

function findTables (markdown: string): RegExpMatchArray[] {
  const matches = markdown.matchAll(/^(?:\|[^\n|]+)+\|\n(?:\|(?::-{2,}:| ?-{2,} ?))+\|\n(?:(?:\|[^\n|]+)+\|(?:\n|$))+/gim)
  const filtered = []
  for (const match of matches) {
    const pipes = match[0].split('\n').filter(Boolean)
      .map((l) => l.match(/(?<!\\)\|/g)?.length ?? 0)

    if (pipes.every((p) => pipes[0] === p)) filtered.push(match)
  }
  return filtered
}

const BLOCK_RULE_SET = [
  { regexp: /<!--(?:.|\n)*?-->/img, type: MarkdownType.COMMENT },
  { regexp: /^#{1,6} [^\n]+/gim, type: MarkdownType.HEADING },
  { regexp: /^[^\n]+\n[=-]{2,}/gim, type: MarkdownType.HEADING },
  { regexp: /^> ?(?:info|warn|danger)\n(?:(?<!\\)> ?[^\n]*(?:\n|$))+/gim, type: MarkdownType.NOTE },
  { regexp: /^(?:> ?[^\n]*(?:\n|$))+/gim, type: MarkdownType.QUOTE },
  { regexp: /^```[^\n]*\n(?:\n|.)+?\n```/gim, type: MarkdownType.CODE_BLOCK },
  { regexp: /(?:^ *(?<!\\)(?:[*+-]|\d\.) [^\n]+(?:\n|$))+/gim, type: MarkdownType.LIST, noTrim: true },
  { regexp: findTables, type: MarkdownType.TABLE },
  { regexp: /^%% (?:get|post|put|patch|delete|head) [^\n]+$/gim, type: MarkdownType.HTTP },
  { regexp: /^(?:\*{3,}|-{3,}|_{3,})$/gim, type: MarkdownType.RULER },
  { regexp: /^(?:[^\n]+(?:\n|$))+/gim, type: MarkdownType.PARAGRAPH },
]

function parseComment (node: ParsedNode): SimpleMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  return {
    type: MarkdownType.COMMENT,
    content: node.markup.replace(/(<!--|-->)/g, '')
      .split('\n')
      .map((s) => s.trim())
      .join('\n'),
  }
}

function parseHeader (node: ParsedNode): HeadingMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  if (node.markup.startsWith('#')) {
    const [ h, ...title ] = node.markup.split(' ')
    return {
      type: MarkdownType.HEADING,
      level: h.length as 1 | 2 | 3 | 4 | 5 | 6,
      content: parseInlineMarkup(title.join(' ')),
    }
  }

  return {
    type: MarkdownType.HEADING,
    level: node.markup.endsWith('=') ? 1 : 2,
    content: parseInlineMarkup(node.markup.split('\n')[0]),
  }
}

function parseParagraph (node: ParsedNode): ComposedMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  return {
    type: MarkdownType.PARAGRAPH,
    content: parseInlineMarkup(node.markup),
  }
}

function parseNote (node: ParsedNode): NoteMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  const [ kind, ...inner ] = node.markup.split('\n')
  return {
    type: MarkdownType.NOTE,
    kind: kind.slice(1) as 'info' | 'warn' | 'danger',
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
    content: parseMarkup(inner.map((l) => l.slice(2)).join('\n')),
  }
}

function parseQuote (node: ParsedNode): ComposedMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  return {
    type: MarkdownType.QUOTE,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
    content: parseMarkup(
      node.markup.split('\n')
        .map((l) => l.slice(2))
        .join('\n')
    ),
  }
}

function doParseList (list: string): ListMarkdownNode {
  const rawItems = list.split('\n').filter(Boolean)
  const content: Array<ListMarkdownNode | ListItemMarkdownNode> = []
  const baseTab = /^ */.exec(rawItems[0])?.[0]?.length ?? 0
  let accumulating = false
  let buffer: string[] = []

  for (const item of rawItems) {
    const tab = /^ */.exec(item)?.[0]?.length ?? 0
    if (accumulating && tab === baseTab) {
      content.push(doParseList(buffer.join('\n')))
      accumulating = false
      buffer = []
    } else if (!accumulating && tab > baseTab) {
      accumulating = true
    }

    if (accumulating) buffer.push(item)
    else content.push({
      type: MarkdownType.LIST_ITEM,
      content: parseInlineMarkup(
        item.trim()
          .slice(2)
          .trim()
      ),
    })
  }

  if (buffer.length) {
    content.push(doParseList(buffer.join('\n')))
  }

  return {
    type: MarkdownType.LIST,
    ordered: Boolean(/^ *\d/.exec(list)),
    content: content,
  }
}

function parseList (node: ParsedNode): ListMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  return doParseList(node.markup)
}

function parseHttp (node: ParsedNode): HttpMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  const route: HttpItemMarkdownNode[] = []
  const exec = /^%% (?:get|post|put|patch|delete|head) ([^\n]+)/i.exec(node.markup)
  if (!exec) throw new Error('Invalid http node!')

  route.push({ type: MarkdownType.HTTP_METHOD, content: exec[1] })
  for (const match of exec[2].matchAll(/([^{]+)({[^}]+})?/g)) {
    route.push({ type: MarkdownType.TEXT, content: match[1] })
    if (match[2]) route.push({ type: MarkdownType.HTTP_PARAM, content: match[2] })
  }

  return {
    type: MarkdownType.HTTP,
    content: route,
  }
}

function parseCode (node: ParsedNode): CodeBlockMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  const exec = /^```([^\n]*)\n((?:.|\n)*)\n```$/i.exec(node.markup)
  if (!exec) throw new Error('Invalid code block node!')

  return {
    type: MarkdownType.CODE_BLOCK,
    language: exec[1] || null,
    code: exec[2],
  }
}

function parseTable (node: ParsedNode): TableMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  const [ head, align, ...rows ] = node.markup.split('\n').filter(Boolean)
  return {
    type: MarkdownType.TABLE,
    centered: align.split('|').slice(1, -1)
      .map((s) => s.includes(':')),
    thead: head.split('|').slice(1, -1)
      .map((s) => parseInlineMarkup(s.trim())),
    tbody: rows.map((row) => row.split('|').slice(1, -1)
      .map((s) => parseInlineMarkup(s.trim()))),
  }
}

function formatBlock (node: ParsedNode): MarkdownNode {
  switch (node.node) {
    case MarkdownType.COMMENT:
      return parseComment(node)
    case MarkdownType.HEADING:
      return parseHeader(node)
    case MarkdownType.PARAGRAPH:
      return parseParagraph(node)
    case MarkdownType.NOTE:
      return parseNote(node)
    case MarkdownType.QUOTE:
      return parseQuote(node)
    case MarkdownType.LIST:
      return parseList(node)
    case MarkdownType.HTTP:
      return parseHttp(node)
    case MarkdownType.CODE_BLOCK:
      return parseCode(node)
    case MarkdownType.TABLE:
      return parseTable(node)
    case MarkdownType.RULER:
      return { type: MarkdownType.RULER }
    /* istanbul ignore next */
    default:
      throw new Error(`Illegal node type encountered: ${node.node}`)
  }
}

export default function parseMarkup (markdown: string): MarkdownNode[] {
  const blocks = parseBlocks(BLOCK_RULE_SET, markdown)
  return blocks.map((b) => formatBlock(b))
}
