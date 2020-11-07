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
  MarkdownType, RawMarkdownNode, MarkdownNode, MarkdownLinkNode, MarkdownAnchorNode,
  MarkdownDocumentNode, MarkdownImageNode, MarkdownVideoNode, DocumentResource
} from './types'

import { parseInline } from './util'

const LINK_PATH = '((\\/[\\+~%\\/\\.\\w\\-_]*)?\\??([\\-\\+=&;%@\\.\\w_]*)#?([\\.\\!\\/\\\\\\w]*))'
const LINK = `((([a-z]{3,9}:(\\/\\/)?)([\\-;:&=\\+\\$,\\w]+@)?[a-z0-9\\.\\-]+|(www\\.|[\\-;:&=\\+\\$,\\w]+@)[a-z0-9\\.\\-]+)${LINK_PATH}?)`
const EMAIL = '(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))'

const YT_RE = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/i
const ABS_RE = /^(https?:\/\/|www\.)/

const InlineRuleSet = [
  { regexp: /(?:(?<!\\)\*){2}(.+?)(?:(?<!\\)\*){2}(?!\*)/img, type: MarkdownType.Bold, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)_){2}(.+?)(?:(?<!\\)_){2}(?!_)/img, type: MarkdownType.Underline, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)(\*|_))(.+?)(?:(?<!\\)\1)(?!\1)/img, type: MarkdownType.Italic, recurse: true, extract: 2 },
  { regexp: /(?:(?<!\\)~){2}(.+?)(?:(?<!\\)~){2}(?!~)/img, type: MarkdownType.StrikeThrough, recurse: true, extract: 1 },
  { regexp: /(?:(?<!\\)\`)(.+?)(?:(?<!\\)`)(?!`)/img, type: MarkdownType.Code, extract: 1 },
  { regexp: /(?<!\\)<br\/?>/img, type: MarkdownType.LineBreak },

  { regexp: new RegExp(`!\\[(?:[^\\]]|\\\\])+]\\(${LINK}\\)`, 'img'), type: MarkdownType.Image },
  { regexp: new RegExp(`!\\[(?:[^\\]]|\\\\])+]\\(${LINK_PATH}\\)`, 'img'), type: MarkdownType.Image },
  { regexp: new RegExp(`!!v\\[${LINK}]`, 'img'), type: MarkdownType.Video },
  { regexp: new RegExp(`!!v\\[${LINK_PATH}]`, 'img'), type: MarkdownType.Video },
  { regexp: new RegExp(`\\[(?:[^\\]]|\\\\])+]\\(${LINK}\\)`, 'img'), type: MarkdownType.Link },
  { regexp: new RegExp(`\\[(?:[^\\]]|\\\\])+]\\(${LINK_PATH}\\)`, 'img'), type: MarkdownType.Link },
  { regexp: /\[(?:[^\]]|\\])+]\(##[\.\!\/\\\w]*(\/[\.\!\/\\\w]*)?(#[\.\!\/\\\w]*)?\)/img, type: MarkdownType.Document },
  { regexp: /\[(?:[^\]]|\\])+]\(#[\.\!\/\\\w]*\)/img, type: MarkdownType.Anchor },
  { regexp: new RegExp(EMAIL, 'img'), type: MarkdownType.Email },
  { regexp: new RegExp(LINK, 'img'), type: MarkdownType.Link }
]

function parseLink (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownLinkNode | MarkdownAnchorNode {
  const content = node.content as string
  if (content.startsWith('[')) {
    const [ , label, href ] = content.match(/\[(.+?(?<!\\))]\((.+)\)/i)!!
    if (href.startsWith('#')) {
      return {
        type: MarkdownType.Anchor,
        anchor: href,
        label: parseInlineMarkup(label, resources)
      }
    }

    return {
      type: MarkdownType.Link,
      href: href,
      label: parseInlineMarkup(label, resources)
    }
  }

  return {
    type: MarkdownType.Link,
    href: content,
    label: content
  }
}

function parseDocument (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownDocumentNode {
  const content = node.content as string
  const [ , label, category, document, anchor ] = content.match(/\[((?:[^\]]|\\])+)]\(##([\.\!\\\w]*)(?:\/([\.\!\\\w]*))?(#[\.\!\/\\\w]*)?\)/i)!!
  return {
    type: MarkdownType.Document,
    category: document ? category : null,
    document: document ? document : category,
    anchor: anchor || null,
    label: parseInlineMarkup(label, resources)
  }
}

function parseImage (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownImageNode {
  const content = node.content as string
  const [ , label, src ] = content.match(/\[(.+?(?<!\\))]\((.+)\)/i)!!

  if (!ABS_RE.test(src)) {
    resources.push({ type: 'image', path: src })
  }

  return {
    type: MarkdownType.Image,
    alt: label,
    src
  }
}

function parseVideo (node: RawMarkdownNode, resources: DocumentResource[]): MarkdownVideoNode {
  const content = (node.content as string).slice(4, -1)
  if (YT_RE.test(content)) {
    const [ ,,,,, id ] = content.match(YT_RE)!!
    return {
      type: MarkdownType.Video,
      kind: 'youtube',
      src: id
    }
  }

  if (!ABS_RE.test(content)) {
    resources.push({ type: 'video', path: content })
  }

  return {
    type: MarkdownType.Video,
    kind: 'media',
    src: content
  }
}

function formatBlock (block: RawMarkdownNode, resources: DocumentResource[]): MarkdownNode {
  switch (block.type) {
    case MarkdownType.Link:
    case MarkdownType.Anchor:
      return parseLink(block, resources)
    case MarkdownType.Document:
      return parseDocument(block, resources)
    case MarkdownType.Image:
      return parseImage(block, resources)
    case MarkdownType.Video:
      return parseVideo(block, resources)
  }

  return block as MarkdownNode
}

export function parseInlineMarkup (markdown: string, resources: DocumentResource[]): MarkdownNode[] {
  const blocks = parseInline(InlineRuleSet, markdown)
  return blocks.map((b) => formatBlock(b, resources))
}
