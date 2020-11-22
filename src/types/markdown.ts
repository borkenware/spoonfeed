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

export enum MarkdownType {
  // Blocks
  COMMENT = 'comment',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  QUOTE = 'quote',
  NOTE = 'note',
  LIST = 'list',
  TABLE = 'table',
  HTTP = 'http',
  CODE_BLOCK = 'code-block',

  // Inline
  TEXT = 'text',
  BOLD = 'bold',
  ITALIC = 'italic',
  UNDERLINE = 'underline',
  STRIKE_THROUGH = 'strike-through',
  CODE = 'code',
  LINK = 'link',
  EMAIL = 'email',
  ANCHOR = 'anchor',
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  LIST_ITEM = 'list-item',

  // Specifics
  RULER = 'ruler',
  LINE_BREAK = 'line-break',
  HTTP_METHOD = 'http-method',
  HTTP_PARAM = 'http-param',
}

// Generic types
export type MarkdownNode = EmptyMarkdownNode | SimpleMarkdownNode | ComposedMarkdownNode | HeadingMarkdownNode |
  NoteMarkdownNode | ListItemMarkdownNode | ListMarkdownNode | TableMarkdownNode | HttpItemMarkdownNode |
  HttpMarkdownNode | CodeBlockMarkdownNode | LinkMarkdownNode | EmailMarkdownNode | DocumentMarkdownNode |
  ImageMarkdownNode | VideoMarkdownNode

export interface EmptyMarkdownNode {
  type: MarkdownType.RULER | MarkdownType.LINE_BREAK
}

export interface SimpleMarkdownNode {
  type: MarkdownType.COMMENT | MarkdownType.TEXT | MarkdownType.CODE
  content: string
}

export interface ComposedMarkdownNode {
  type: MarkdownType.PARAGRAPH | MarkdownType.QUOTE | MarkdownType.BOLD |
    MarkdownType.ITALIC | MarkdownType.UNDERLINE | MarkdownType.STRIKE_THROUGH
  content: MarkdownNode[]
}

// Block types
export interface HeadingMarkdownNode {
  type: MarkdownType.HEADING
  level: 1 | 2 | 3 | 4 | 5 | 6
  content: MarkdownNode[]
}

export interface NoteMarkdownNode {
  type: MarkdownType.NOTE
  kind: 'info' | 'warn' | 'danger'
  content: MarkdownNode[]
}

export interface ListItemMarkdownNode {
  type: MarkdownType.LIST_ITEM
  content: MarkdownNode[]
}

export interface ListMarkdownNode {
  type: MarkdownType.LIST
  ordered: boolean
  content: Array<ListItemMarkdownNode | ListMarkdownNode>
}

export interface TableMarkdownNode {
  type: MarkdownType.TABLE
  centered: boolean[]
  thead: MarkdownNode[][]
  tbody: MarkdownNode[][][]
}

export interface HttpItemMarkdownNode {
  type: MarkdownType.TEXT | MarkdownType.HTTP_METHOD | MarkdownType.HTTP_PARAM
  content: string
}

export interface HttpMarkdownNode {
  type: MarkdownType.HTTP
  content: HttpItemMarkdownNode[]
}

export interface CodeBlockMarkdownNode {
  type: MarkdownType.CODE_BLOCK
  language: string | null
  code: string
}

// Inline types
export interface LinkMarkdownNode {
  type: MarkdownType.LINK | MarkdownType.ANCHOR
  href: string
  label: MarkdownNode[]
}

export interface EmailMarkdownNode {
  type: MarkdownType.EMAIL
  email: string
}

export interface DocumentMarkdownNode {
  type: MarkdownType.DOCUMENT
  category: string | null
  document: string
  anchor: string | null
  label: MarkdownNode[]
}

export interface ImageMarkdownNode {
  type: MarkdownType.IMAGE
  alt: string
  src: string
}

export interface VideoMarkdownNode {
  type: MarkdownType.VIDEO
  kind: 'media' | 'youtube'
  src: string
}

// Parser
export interface ParserBlockRule {
  regexp: RegExp | ((markdown: string) => RegExpMatchArray[])
  type: MarkdownType
  noTrim?: boolean
}

export interface ParserInlineRule {
  regexp: RegExp
  type: MarkdownType
  noTrim?: boolean
  recurse?: boolean
  extract?: number
}

// Parser output, using different props on purpose to prevent confusion
export interface ParsedNode {
  node: MarkdownType
  markup: string | ParsedNode[]
}
