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

import { parseInline } from './util'
import { MarkdownType } from '@t/markdown'
import type { MarkdownNode, ParsedNode, LinkMarkdownNode, DocumentMarkdownNode, ImageMarkdownNode, VideoMarkdownNode } from '@t/markdown'

/* eslint-disable @typescript-eslint/naming-convention -- ESLint config needs fix, see borkenware/eslint-config#1 */
const LINK_PATH = '((\\/[\\+~%\\/\\.\\w\\-_]*)?\\??([\\-\\+=&;%@\\.\\w_]*)#?([\\.\\!\\/\\\\\\w]*))'
const LINK = `((([a-z]{3,9}:(\\/\\/)?)([\\-;:&=\\+\\$,\\w]+@)?[a-z0-9\\.\\-]+|(www\\.|[\\-;:&=\\+\\$,\\w]+@)[a-z0-9\\.\\-]+)${LINK_PATH}?)`
const EMAIL = '(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))'

const YT_RE = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu\.be))(\/(?:[\w-]+\?v=|embed\/|v\/)?)([\w-]+)(\S+)?$/i
/* eslint-enable @typescript-eslint/naming-convention */

const INLINE_RULE_SET = [
  { regexp: /(?:(?<!\\)\*){2}(.+?)(?:(?<!\\)\*){2}(?!\*)/gim, type: MarkdownType.BOLD, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)_){2}(.+?)(?:(?<!\\)_){2}(?!_)/gim, type: MarkdownType.UNDERLINE, recurse: true, extract: 1 },
  { regexp: /(?<!\\)(\*|_)(.+?)(?<!\\)\1(?!\1)/gim, type: MarkdownType.ITALIC, recurse: true, extract: 2 },
  { regexp: /(?:(?<!\\)~){2}(.+?)(?:(?<!\\)~){2}(?!~)/gim, type: MarkdownType.STRIKE_THROUGH, recurse: true, extract: 1 },
  { regexp: /(?<!\\)`(.+?)(?<!\\)`(?!`)/gim, type: MarkdownType.CODE, extract: 1 },
  { regexp: /(?<!\\)<br\/?>/gim, type: MarkdownType.LINE_BREAK },

  { regexp: new RegExp(`!\\[(?:[^\\]]|\\\\])+]\\(${LINK}\\)`, 'img'), type: MarkdownType.IMAGE },
  { regexp: new RegExp(`!\\[(?:[^\\]]|\\\\])+]\\(${LINK_PATH}\\)`, 'img'), type: MarkdownType.IMAGE },
  { regexp: new RegExp(`!!v\\[${LINK}]`, 'img'), type: MarkdownType.VIDEO },
  { regexp: new RegExp(`!!v\\[${LINK_PATH}]`, 'img'), type: MarkdownType.VIDEO },
  { regexp: new RegExp(`\\[(?:[^\\]]|\\\\])+]\\(${LINK}\\)`, 'img'), type: MarkdownType.LINK },
  { regexp: new RegExp(`\\[(?:[^\\]]|\\\\])+]\\(${LINK_PATH}\\)`, 'img'), type: MarkdownType.LINK },
  { regexp: /\[(?:[^\]]|\\])+]\(##[\w!./\\]*(\/[\w!./\\]*)?(#[\w!./\\]*)?\)/gim, type: MarkdownType.DOCUMENT },
  { regexp: /\[(?:[^\]]|\\])+]\(#[\w!./\\]*\)/gim, type: MarkdownType.ANCHOR },
  { regexp: new RegExp(EMAIL, 'img'), type: MarkdownType.EMAIL },
  { regexp: new RegExp(LINK, 'img'), type: MarkdownType.LINK },
]

function parseLink (node: ParsedNode): LinkMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  if (node.markup.startsWith('[')) {
    let exec = /\[(.+?(?<!\\))]\((.+)\)/i.exec(node.markup)
    if (!exec) throw new Error('Invalid link node!')

    if (exec[2].startsWith('#')) {
      return {
        type: MarkdownType.ANCHOR,
        href: exec[2],
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
        label: parseInlineMarkup(exec[1]),
      }
    }

    return {
      type: MarkdownType.LINK,
      href: exec[2],
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
      label: parseInlineMarkup(exec[1]),
    }
  }

  return {
    type: MarkdownType.LINK,
    href: node.markup,
    label: [ { type: MarkdownType.TEXT, content: node.markup } ],
  }
}

function parseDocument (node: ParsedNode): DocumentMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  let exec = /\[((?:[^\]]|\\])+)]\(##([\w!.\\]*)(?:\/([\w!.\\]*))?(#[\w!./\\]*)?\)/i.exec(node.markup)
  if (!exec) throw new Error('Invalid document node!')

  let [ , label, category, document, anchor ] = exec
  return {
    type: MarkdownType.DOCUMENT,
    category: document ? category : null,
    document: document ? document : category,
    anchor: anchor || null,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
    label: parseInlineMarkup(label),
  }
}

function parseImage (node: ParsedNode): ImageMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  let exec = /\[((?:[^\]]|\\])+)]\(##([\w!.\\]*)(?:\/([\w!.\\]*))?(#[\w!./\\]*)?\)/i.exec(node.markup)
  if (!exec) throw new Error('Invalid image node!')

  return {
    type: MarkdownType.IMAGE,
    alt: exec[1],
    src: exec[2],
  }
}

function parseVideo (node: ParsedNode): VideoMarkdownNode {
  if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')

  let content = node.markup.slice(4, -1)
  let ytExec = YT_RE.exec(content)
  if (ytExec) {
    return {
      type: MarkdownType.VIDEO,
      kind: 'youtube',
      src: ytExec[5],
    }
  }

  return {
    type: MarkdownType.VIDEO,
    kind: 'media',
    src: content,
  }
}

function formatNode (node: ParsedNode): MarkdownNode {
  switch (node.node) {
    case MarkdownType.BOLD:
    case MarkdownType.UNDERLINE:
    case MarkdownType.ITALIC:
    case MarkdownType.STRIKE_THROUGH:
      if (typeof node.markup === 'string') throw new Error('Invalid string node!')
      return { type: node.node, content: node.markup.map((n) => formatNode(n)) }
    case MarkdownType.CODE:
    case MarkdownType.HTTP_METHOD:
    case MarkdownType.HTTP_PARAM:
      if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')
      return { type: node.node, content: node.markup }
    case MarkdownType.EMAIL:
      if (typeof node.markup !== 'string') throw new Error('Invalid non-string node!')
      return { type: node.node, email: node.markup }
    case MarkdownType.LINK:
    case MarkdownType.ANCHOR:
      return parseLink(node)
    case MarkdownType.DOCUMENT:
      return parseDocument(node)
    case MarkdownType.IMAGE:
      return parseImage(node)
    case MarkdownType.VIDEO:
      return parseVideo(node)
    case MarkdownType.LINE_BREAK:
      return { type: MarkdownType.LINE_BREAK }
    default:
      throw new Error(`Unknown node ${node.node}!`)
  }
}

export default function parseInlineMarkup (markdown: string): MarkdownNode[] {
  let nodes = parseInline(INLINE_RULE_SET, markdown)
  return nodes.map((n) => formatNode(n))
}
