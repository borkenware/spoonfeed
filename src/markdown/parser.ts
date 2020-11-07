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

import {
  MarkdownType, RawMarkdownNode, MarkdownNode,
  MarkdownCommentNode, MarkdownHeadingNode,
  MarkdownSimpleNode, MarkdownNoteNode, MarkdownAstTree,
  MarkdownListNode, MarkdownHttpNode, MarkdownHttpItemNode,
  MarkdownCodeNode, MarkdownTableNode, DocumentResource
} from './types'

import { parseBlocks } from './util'
import { parseInlineMarkup } from './inline'

function findTables (markdown: string) {
  const matches = markdown.matchAll(/^(?:\|[^|\n]+)+\|\n(?:\|(?::-{2,}:|-{2,}))+\|\n(?:(?:\|[^|\n]+)+\|(?:\n|$))+/img)
  const filtered = []
  for (const match of matches) {
    const pipes = match[0].split('\n').filter(Boolean).map(l => l.match(/(?<!\\)\|/g)!!.length)
    if (pipes.every(p => pipes[0] === p)) filtered.push(match)
  }
  return filtered
}

const BlockRuleSet = [
  { regexp: /<!--(?:.|\n)*?-->/img, type: MarkdownType.Comment },
  { regexp: /^#{1,6} [^\n]+/img, type: MarkdownType.Heading },
  { regexp: /^[^\n]+\n[=-]{2,}/img, type: MarkdownType.Heading },
  { regexp: /^(?:>(?:info|warn|danger))\n(?:(?<!\\)> [^\n]*(?:\n|$))+/img, type: MarkdownType.Note },
  { regexp: /^(?:> [^\n]*(?:\n|$))+/img, type: MarkdownType.Quote },
  { regexp: /^```[^\n]*\n(?:.|\n)+?\n```/img, type: MarkdownType.CodeBlock },
  { regexp: /(?:^ *(?<!\\)(?:[-+*]|\d\.) [^\n]+(?:\n|$))+/img, type: MarkdownType.List, noTrim: true },
  { regexp: findTables, type: MarkdownType.Table },
  { regexp: /^(?:%% (?:GET|POST|PUT|PATCH|DELETE|HEAD) [^\n]+$)/img, type: MarkdownType.Http },
  { regexp: /^(?:\*{3,}|-{3,}|_{3,})$/img, type: MarkdownType.Ruler },
  { regexp: /^(?:[^\n]+(?:\n|$))+/img, type: MarkdownType.Paragraph }
]

function parseComment (node: RawMarkdownNode): MarkdownCommentNode {
  const content = node.content as string
  return {
    type: MarkdownType.Comment,
    content: content.replace(/(<!--|-->)/g, '').split('\n').map(s => s.trim()).join('\n')
  }
}

function parseHeader (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownHeadingNode {
  const content = node.content as string
  if (content.startsWith('#')) {
    const [ h, ...title ] = content.split(' ')
    return {
      type: MarkdownType.Heading,
      level: h.length,
      content: parseInlineMarkup(title.join(' '), resources)
    }
  }

  return {
    type: MarkdownType.Heading,
    level: content.endsWith('=') ? 1 : 2,
    content: parseInlineMarkup(content.split('\n')[0], resources)
  }
}

function parseParagraph (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownSimpleNode {
  const content = node.content as string
  return {
    type: MarkdownType.Paragraph,
    content: parseInlineMarkup(content, resources)
  }
}

function parseNote (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownNoteNode {
  const content = node.content as string
  let [ kind, ...inner ] = content.split('\n')
  return {
    type: MarkdownType.Note,
    kind: kind.slice(1) as 'info' | 'warn' | 'danger',
    content: parseMarkup(inner.map(l => l.slice(2)).join('\n'), resources)
  }
}

function parseQuote (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownSimpleNode {
  const content = node.content as string
  return {
    type: MarkdownType.Quote,
    content: parseMarkup(content.split('\n').map(l => l.slice(2)).join('\n'), resources)
  }
}

function parseList (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownListNode {
  return doParseList(node.content as string, resources)
}

function doParseList (list: string, resources: DocumentResource[]): MarkdownListNode {
  const rawItems = list.split('\n').filter(Boolean)
  const content: (MarkdownListNode | MarkdownSimpleNode)[] = []
  const baseTab = rawItems[0].match(/^ */)!![0].length
  let accumulating = false
  let buffer: string[] = []

  for (const item of rawItems) {
    const tab = item.match(/^ */)!![0].length
    if (accumulating && tab === baseTab) {
      content.push(doParseList(buffer.join('\n'), resources))
      accumulating = false
      buffer = []
    } else if (!accumulating && tab > baseTab) {
      accumulating = true
    }

    if (accumulating) buffer.push(item)
    else content.push({ type: MarkdownType.ListItem, content: parseInlineMarkup(item.trim().slice(2).trim(), resources) })
  }

  return {
    type: MarkdownType.List,
    ordered: !!list.match(/^ *\d/),
    content
  }
}

function parseHttp (node: RawMarkdownNode): MarkdownHttpNode {
  const content = node.content as string
  const route: MarkdownHttpItemNode[] = []
  const [ , method, rawPath ] = content.match(/^%% (GET|POST|PUT|PATCH|DELETE|HEAD) ([^\n]+)/)!!
  route.push({ type: MarkdownType.HttpMethod, content: method })
  for (const match of rawPath.matchAll(/([^{]+)({[^}]+})?/g)) {
    route.push({ type: MarkdownType.Text, content: match[1] })
    if (match[2]) route.push({ type: MarkdownType.HttpParam, content: match[2] })
  }

  return {
    type: MarkdownType.Http,
    content: route
  }
}

function parseCode (node: RawMarkdownNode): MarkdownCodeNode {
  const content = node.content as string
  const [ , lang, code ] = content.match(/^```([^\n]*)\n((?:.|\n)*)\n```$/i)!!
  return {
    type: MarkdownType.CodeBlock,
    language: lang || null,
    content: code
  }
}

function parseTable (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownTableNode {
  const content = node.content as string
  const [ head, align, ...rows ] = content.split('\n').filter(Boolean)
  return {
    type: MarkdownType.Table,
    centered: align.split('|').slice(1, -1).map(s => s.includes(':')),
    thead: head.split('|').slice(1, -1).map(s => parseInlineMarkup(s.trim(), resources)),
    tbody: rows.map(row => row.split('|').slice(1, -1).map(s => parseInlineMarkup(s.trim(), resources)))
  }
}

function formatBlock (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownNode {
  switch (node.type) {
    case MarkdownType.Comment:
      return parseComment(node)
    case MarkdownType.Heading:
      return parseHeader(node, resources)
    case MarkdownType.Paragraph:
      return parseParagraph(node, resources)
    case MarkdownType.Note:
      return parseNote(node, resources)
    case MarkdownType.Quote:
      return parseQuote(node, resources)
    case MarkdownType.List:
      return parseList(node, resources)
    case MarkdownType.Http:
      return parseHttp(node)
    case MarkdownType.CodeBlock:
      return parseCode(node)
    case MarkdownType.Table:
      return parseTable(node, resources)
    case MarkdownType.Ruler:
      return { type: MarkdownType.Ruler }
    /* istanbul ignore next */
    default:
      throw new Error('Illegal node type encountered: ' + node.type)
  }
}

export function parseMarkup (markdown: string, resources: DocumentResource[] = []): MarkdownNode[] {
  const blocks = parseBlocks(BlockRuleSet, markdown)
  return blocks.map(b => formatBlock(b, resources))
}

export default function parse (markdown: string): MarkdownAstTree {
  const resources: DocumentResource[] = []
  const tree = parseMarkup(markdown, resources)
  return { resources, tree }
}
