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
  InlineType, MarkdownAstTree, RawMarkdownNode,
  MarkdownNode, MarkdownLinkNode, MarkdownAnchorNode,
  MarkdownDocumentNode, MarkdownImageNode
} from './types'

import { parseInline } from './util'

const LINK_PATH = '((\\/[\\+~%\\/\\.\\w\\-_]*)?\\??([\\-\\+=&;%@\\.\\w_]*)#?([\\.\\!\\/\\\\\\w]*))'
const LINK = `((([A-Za-z]{3,9}:(\\/\\/)?)([\\-;:&=\\+\\$,\\w]+@)?[A-Za-z0-9\\.\\-]+|(www\\.|[\\-;:&=\\+\\$,\\w]+@)[A-Za-z0-9\\.\\-]+)${LINK_PATH}?)`
const EMAIL = '(?:(?:[^<>()[]\\.,;:s@"]+(?:.[^<>()[]\\.,;:s@"]+)*)|(?:".+"))@(?:(?:[[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(?:(?:[a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))'

const InlineRuleSet = [
  { regexp: /(?:(?<!\\)\*){2}(.+?)(?:(?<!\\)\*){2}(?!\*)/img, type: InlineType.Bold, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)_){2}(.+?)(?:(?<!\\)_){2}(?!_)/img, type: InlineType.Underline, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)(\*|_))(.+?)(?:(?<!\\)\1)(?!\1)/img, type: InlineType.Italic, recurse: true, extract: 2 },
  { regexp: /(?:(?<!\\)~){2}(.+?)(?:(?<!\\)~){2}(?!~)/img, type: InlineType.StrikeThrough, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)\`)(.+?)(?:(?<!\\)`)(?!`)/img, type: InlineType.Code, extract: 1 },
  { regexp: /(?<!\\)<br\/?>/img, type: InlineType.LineBreak },

  { regexp: new RegExp(`!\\[([^\\]]+(?:\\\\])?)+]\\(${LINK}\\)`, 'img'), type: InlineType.Image },
  { regexp: new RegExp(`!\\[([^\\]]+(?:\\\\])?)+]\\(${LINK_PATH}\\)`, 'img'), type: InlineType.Image },
  { regexp: new RegExp(`\\[([^\\]]+(?:\\\\])?)+]\\(${LINK}\\)`, 'img'), type: InlineType.Link },
  { regexp: new RegExp(`\\[([^\\]]+(?:\\\\])?)+]\\(${LINK_PATH}\\)`, 'img'), type: InlineType.Link },
  { regexp: /\[([^\]]+(?:\\])?)+]\(##[a-z-/]+\)/img, type: InlineType.Document },
  { regexp: /\[([^\]]+(?:\\])?)+]\(#[a-z-]+\)/img, type: InlineType.Anchor },
  { regexp: new RegExp(LINK, 'img'), type: InlineType.Link },
  { regexp: new RegExp(EMAIL, 'img'), type: InlineType.Email }
]

function parseLink (node: RawMarkdownNode): MarkdownLinkNode | MarkdownAnchorNode {
  const content = node.content as string
  if (content.startsWith('[')) {
    const [ , label, href ] = content.match(/\[(.+?(?<!\\))]\((.+)\)/i)!!
    if (href.startsWith('#')) {
      return {
        type: InlineType.Anchor,
        anchor: href,
        content: label
      }
    }
    return {
      type: InlineType.Link,
      href: href,
      content: label
    }
  }

  return {
    type: InlineType.Link,
    href: content,
    content
  }
}

function parseDocument (node: RawMarkdownNode): MarkdownDocumentNode {
  const content = node.content as string
  const [ , label, category, document ] = content.match(/\[(.+?(?<!\\))]\(##([^\/]+)(?:\/(.+))?\)/i)!!
  return {
    type: InlineType.Document,
    category: document ? category : null,
    document: document ? document : category,
    content: label
  }
}

function parseImage (node: RawMarkdownNode): MarkdownImageNode {
  const content = node.content as string
  const [ , label, src ] = content.match(/\[(.+?(?<!\\))]\((.+)\)/i)!!
  return {
    type: InlineType.Image,
    alt: label,
    content: src
  }
}

function formatBlock (block: RawMarkdownNode): MarkdownNode {
  switch (block.type) {
    case InlineType.Link:
    case InlineType.Anchor:
      return parseLink(block)
    case InlineType.Document:
      return parseDocument(block)
    case InlineType.Image:
      return parseImage(block)
  }

  return block as MarkdownNode
}

function formatBlocks (blocks: RawMarkdownNode[]): MarkdownNode[] {
  return blocks.map(formatBlock) as MarkdownNode[]
}

export default function parse (markdown: string): MarkdownAstTree {
  return formatBlocks(parseInline(InlineRuleSet, markdown))
}
