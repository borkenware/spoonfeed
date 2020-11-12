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
  Comment = 'comment',
  Heading = 'heading',
  Paragraph = 'paragraph',
  Quote = 'quote',
  Note = 'note',
  CodeBlock = 'code-block',
  List = 'list',
  ListItem = 'list-item',
  Http = 'http',
  Table = 'table',
  Ruler = 'ruler',

  // Inline
  Text = 'text',
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  StrikeThrough = 'strike-through',
  Code = 'code',
  Link = 'link',
  Email = 'email',
  Anchor = 'anchor',
  Document = 'document',
  Image = 'image',
  Video = 'video',

  // Specifics
  LineBreak = 'line-break',
  HttpMethod = 'http-method',
  HttpParam = 'http-param'
}

export type MarkdownRawItem = RawMarkdownNode[] | RawMarkdownNode | string
export type MarkdownItem = MarkdownNode[] | MarkdownNode | string

export interface RawMarkdownNode {
  type: MarkdownType
  content: MarkdownRawItem
}

export interface MarkdownSimpleNode {
  type: MarkdownType.Paragraph | MarkdownType.Quote | MarkdownType.ListItem | MarkdownType.Text |
    MarkdownType.Bold | MarkdownType.Italic | MarkdownType.Underline | MarkdownType.StrikeThrough |
    MarkdownType.Code | MarkdownType.Email | MarkdownType.HttpMethod | MarkdownType.HttpParam
  content: MarkdownItem
}

export interface MarkdownEmptyNode { type: MarkdownType.Ruler | MarkdownType.LineBreak }

export interface MarkdownCommentNode {
  type: MarkdownType.Comment
  content: string
}

export interface MarkdownHeadingNode {
  type: MarkdownType.Heading
  level: number
  content: MarkdownItem
}

export interface MarkdownNoteNode {
  type: MarkdownType.Note
  kind: 'info' | 'warn' | 'danger'
  content: MarkdownItem
}

export interface MarkdownCodeNode {
  type: MarkdownType.CodeBlock
  language: string | null
  content: string
}

export interface MarkdownListNode {
  type: MarkdownType.List
  ordered: boolean
  content: (MarkdownListNode | MarkdownSimpleNode)[]
}

export interface MarkdownHttpNode {
  type: MarkdownType.Http
  content: MarkdownHttpItemNode[]
}

export interface MarkdownHttpItemNode {
  type: MarkdownType.HttpMethod | MarkdownType.HttpParam | MarkdownType.Text
  content: string
}

export interface MarkdownTableNode {
  type: MarkdownType.Table
  centered: boolean[]
  thead: MarkdownItem[]
  tbody: MarkdownItem[][]
}

export interface MarkdownLinkNode {
  type: MarkdownType.Link
  href: string
  label: MarkdownItem
}

export interface MarkdownAnchorNode {
  type: MarkdownType.Anchor
  anchor: string
  label: MarkdownItem
}

export interface MarkdownDocumentNode {
  type: MarkdownType.Document
  category: string | null
  document: string
  anchor: string | null
  label: MarkdownItem
}

export interface MarkdownImageNode {
  type: MarkdownType.Image
  alt: string
  src: string
}

export interface MarkdownVideoNode {
  type: MarkdownType.Video
  kind: 'media' | 'youtube'
  src: string
}

export type MarkdownNode = MarkdownSimpleNode | MarkdownEmptyNode | MarkdownCommentNode | MarkdownHeadingNode |
  MarkdownNoteNode | MarkdownCodeNode | MarkdownListNode | MarkdownHttpNode | MarkdownHttpItemNode |
  MarkdownTableNode | MarkdownLinkNode | MarkdownAnchorNode | MarkdownDocumentNode |
  MarkdownImageNode | MarkdownVideoNode

export type MarkdownAstTree = { tree: MarkdownNode[] }
