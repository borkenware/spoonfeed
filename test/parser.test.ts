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

import parse from '../src/markdown/parser'
import inlineParse from '../src/markdown/inline'
import {
  MarkdownHeadingNode, MarkdownNoteNode, MarkdownCodeNode,
  MarkdownHttpNode, MarkdownListNode, MarkdownTableNode,
  MarkdownImageNode, MarkdownLinkNode, MarkdownAnchorNode,
  MarkdownDocumentNode, MarkdownVideoNode
} from '../src/markdown/types'

describe('markdown document sections', function () {
  test('heading blocks (classic syntax)', function () {
    const res = parse('# Title\nThis is some text\n\n## Subtitle')
    expect(res.length).toBe(3)
    expect(res[0].type).toBe('heading')
    expect(res[1].type).toBe('paragraph')
    expect(res[2].type).toBe('heading')
    expect((res[0] as MarkdownHeadingNode).level).toBe(1)
    expect((res[2] as MarkdownHeadingNode).level).toBe(2)
  })

  test('heading blocks (underline syntax)', function () {
    const res = parse('Title\n===This is some text\n\nSubtitle\n---')
    expect(res.length).toBe(3)
    expect(res[0].type).toBe('heading')
    expect(res[1].type).toBe('paragraph')
    expect(res[2].type).toBe('heading')
    expect((res[0] as MarkdownHeadingNode).level).toBe(1)
    expect((res[2] as MarkdownHeadingNode).level).toBe(2)
  })

  test('quotes', function () {
    const res = parse('> this is\n> a test quote\n\n> and this is a second quote')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('quote')
    expect(res[1].type).toBe('quote')
    expect((res[0] as any).content[0].content[0].content).toBe('this is a test quote')
  })

  test('note blocks', function () {
    const res = parse('>info\n> this is\n> an informative note\n\n>warn\n> and this is warning')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('note')
    expect((res[0] as MarkdownNoteNode).kind).toBe('info')
    expect(res[1].type).toBe('note')
    expect((res[1] as MarkdownNoteNode).kind).toBe('warn')
    expect((res[0] as any).content[0].content[0].content).toBe('this is an informative note')
  })

  test('code blocks', function () {
    const res = parse('```\nthis is a plain code block\n```\n```js\nconsole.log("this is a js code block")\n```')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('code-block')
    expect(res[1].type).toBe('code-block')
    expect((res[0] as MarkdownCodeNode).content).toBe('this is a plain code block')
  })

  test('http blocks', function () {
    const res = parse('%% GET /users/{id}/cuteness')
    expect(res.length).toBe(1)
    expect(res[0].type).toBe('http')
    const http = res[0] as MarkdownHttpNode
    expect(http.content[0].type).toBe('http-method')
    expect(http.content[0].content).toBe('GET')
    expect(http.content[1].type).toBe('text')
    expect(http.content[1].content).toBe('/users/')
    expect(http.content[2].type).toBe('http-param')
    expect(http.content[2].content).toBe('{id}')
    expect(http.content[3].type).toBe('text')
    expect(http.content[3].content).toBe('/cuteness')
  })

  test('rulers', function () {
    const res = parse('First paragraph\n\n-----\n\nSecond paragraph')
    expect(res.length).toBe(3)
    expect(res[0].type).toBe('paragraph')
    expect(res[1].type).toBe('ruler')
    expect(res[2].type).toBe('paragraph')
  })

  describe('lists', function () {
    test('simple (unordered)', function () {
      const res = parse(' - Item 1\n - Item 2\n - Item 3')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('list')
      const list = res[0] as MarkdownListNode
      expect(list.ordered).toBe(false)
      expect(list.content.length).toBe(3)
      list.content.forEach(c => expect(c.type).toBe('list-item'))
    })

    test('simple (ordered)', function () {
      const res = parse(' 1. Item 1\n 2. Item 2\n 3. Item 3')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('list')
      expect((res[0] as MarkdownListNode).ordered).toBe(true)
    })

    test('stacked', function () {
      const res = parse(' - Item 1\n - Item 2\n   - Item 2.1\n   - Item 2.2\n - Item 3')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('list')
      const list = res[0] as MarkdownListNode
      expect(list.content.length).toBe(4)
      expect(list.content[2].type).toBe('list')
    })

    test('stacked (mixed)', function () {
      const res = parse(' - Item 1\n - Item 2\n   1. Item 2.1\n   2. Item 2.2\n - Item 3')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('list')
      const list = res[0] as MarkdownListNode
      expect(list.ordered).toBe(false)
      expect(list.content.length).toBe(4)
      expect(list.content[2].type).toBe('list')
      expect((list.content[2] as MarkdownListNode).ordered).toBe(true)
    })
  })

  describe('tables', function () {
    test('simple', function () {
      const res = parse('| a | b | c |\n|--|--|--|\n| d | e | f |')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('table')
    })

    test('invalid', function () {
      const res = parse('| a | b | c |\n|--|--|\n| d | e | f |')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('paragraph')
    })

    test('alignments', function () {
      const res = parse('| a | b | c |\n|--|:--:|--|\n| d | e | f |')
      expect(res.length).toBe(1)
      expect(res[0].type).toBe('table')
      const table = res[0] as MarkdownTableNode
      expect(table.centered[0]).toBe(false)
      expect(table.centered[1]).toBe(true)
      expect(table.centered[2]).toBe(false)
    })
  })
})

describe('markdown inline markup', function () {
  test('bold', function () {
    const res = inlineParse('this should be **bold**')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('bold')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content[0].content).toBe('bold')
  })

  test('italic', function () {
    const res = inlineParse('this should be *italic* and _that too_')
    expect(res.length).toBe(4)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('italic')
    expect(res[3].type).toBe('italic')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content[0].content).toBe('italic')
  })

  test('underline', function () {
    const res = inlineParse('this should be __underlined__')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('underline')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content[0].content).toBe('underlined')
  })

  test('strike-through', function () {
    const res = inlineParse('this should be ~~striked~~')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('strike-through')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content[0].content).toBe('striked')
  })

  test('code', function () {
    const res = inlineParse('this should be `inline code`')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('code')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content).toBe('inline code')
  })

  test('stacked markup', function () {
    const res = inlineParse('this should be ~~striked **and bold**~~')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('strike-through')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content.length).toBe(2)
    expect((res[1] as any).content[0].type).toBe('text')
    expect((res[1] as any).content[1].type).toBe('bold')
    expect((res[1] as any).content[1].content[0].content).toBe('and bold')
  })

  test('stacked markup (ambiguous)', function () {
    const res = inlineParse('this should be ***bold and italic***')
    expect(res.length).toBe(2)
    expect(res[0].type).toBe('text')
    expect(res[1].type).toBe('bold')
    expect((res[0] as any).content).toBe('this should be ')
    expect((res[1] as any).content.length).toBe(1)
    expect((res[1] as any).content[0].type).toBe('italic')
    expect((res[1] as any).content[0].content[0].content).toBe('bold and italic')
  })

  test('line breaks', function () {
    const res = inlineParse('there should be<br>a line break')
    expect(res.length).toBe(3)
    expect(res[1].type).toBe('line-break')
  })

  test('email', function () {
    const res = inlineParse('contact nobody at nobody@example.com and get no answer')
    expect(res.length).toBe(3)
    expect(res[1].type).toBe('email')
  })

  test('images', function () {
    const res = inlineParse('Here is a cute cat pic: ![cat](https://borkenware.com/cat.png)')

    expect(res.length).toBe(2)
    expect(res[1].type).toBe('image')
    const img = res[1] as MarkdownImageNode
    expect(img.alt).toBe('cat')
    expect(img.src).toBe('https://borkenware.com/cat.png')
  })

  describe('links', function () {
    test('plain (http)', function () {
      const res = inlineParse('go to https://borkenware.com for more')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('link')
    })

    test('plain (www)', function () {
      const res = inlineParse('go to www.borkenware.com for more')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('link')
    })

    test('labelled (full)', function () {
      const res = inlineParse('go to [our website](https://borkenware.com) for more')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('link')
      const link = res[1] as MarkdownLinkNode
      expect(link.href).toBe('https://borkenware.com')
      expect((link.label as any)[0].content).toBe('our website')
    })

    test('labelled (partial)', function () {
      const res = inlineParse('go [here](/path/to/info) for more info')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('link')
      const link = res[1] as MarkdownLinkNode
      expect(link.href).toBe('/path/to/info')
      expect((link.label as any)[0].content).toBe('here')
    })

    test('label with markup', function () {
      const res = inlineParse('go to [our **awesome** website](https://borkenware.com) for more')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('link')
      const link = res[1] as MarkdownLinkNode
      expect((link.label as any).length).toBe(3)
    })

    test('anchor', function () {
      const res = inlineParse('See the [important stuff](#important) for more important info')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('anchor')
      const link = res[1] as MarkdownAnchorNode
      expect(link.anchor).toBe('#important')
    })

    test('uncategorized document', function () {
      const res = inlineParse('See the [important stuff](##important) for more important info')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('document')
      const document = res[1] as MarkdownDocumentNode
      expect(document.category).toBeNull()
      expect(document.document).toBe('important')
      expect(document.anchor).toBeNull()
    })

    test('categorized document', function () {
      const res = inlineParse('See the [important stuff](##main/important) for more important info')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('document')
      const document = res[1] as MarkdownDocumentNode
      expect(document.category).toBe('main')
      expect(document.document).toBe('important')
      expect(document.anchor).toBeNull()
    })

    test('document with anchor', function () {
      const res = inlineParse('See the [important stuff](##main/important#anchor) for more important info')
      expect(res.length).toBe(3)
      expect(res[1].type).toBe('document')
      const document = res[1] as MarkdownDocumentNode
      expect(document.category).toBe('main')
      expect(document.document).toBe('important')
      expect(document.anchor).toBe('#anchor')
    })
  })

  describe('videos', function () {
    test('media', function () {
      const res = inlineParse('Here\'s the introduction video: !!v[/video/intro.mp4]')
      expect(res.length).toBe(2)
      expect(res[1].type).toBe('video')
      const video = res[1] as MarkdownVideoNode
      expect(video.kind).toBe('media')
      expect(video.src).toBe('/video/intro.mp4')
    })

    test('youtube', function () {
      const res = inlineParse('Here\'s the introduction video: !!v[https://youtube.com/watch?v=Tt7bzxurJ1I]')
      expect(res.length).toBe(2)
      expect(res[1].type).toBe('video')
      const video = res[1] as MarkdownVideoNode
      expect(video.kind).toBe('youtube')
      expect(video.src).toBe('Tt7bzxurJ1I')
    })
  })
})
