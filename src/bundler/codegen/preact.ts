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

import { MarkdownHeadingNode, MarkdownNode, MarkdownType } from '../../markdown/types'

interface PreactNode {
  tag: string
  component: boolean
  props?: object
  children?: Array<PreactNode | string>
}

type Imports = Record<string, string>

/*
special cases:
case MarkdownType.ListItem:
case MarkdownType.HttpMethod:
case MarkdownType.HttpParam:
*/

const BasicTags: Record<string, string> = {
  [MarkdownType.Paragraph]: 'p',
  [MarkdownType.Quote]: 'blockquote',
  [MarkdownType.Bold]: 'b',
  [MarkdownType.Italic]: 'i',
  [MarkdownType.Underline]: 'u',
  [MarkdownType.StrikeThrough]: 's',
  [MarkdownType.Code]: 'code',
  [MarkdownType.Ruler]: 'hr',
  [MarkdownType.LineBreak]: 'br'
}

function toCode (nodes: Array<PreactNode | string>): string {
  const components: string[] = []
  for (const node of nodes) {
    if (typeof node === 'string') {
      components.push(`'${node.replace(/'/g, '\\\'')}'`)
      continue
    }
    let code = 'h('
    code += `${node.component ? node.tag : `'${node.tag}'`},`
    code += `${node.props ? JSON.stringify(node.props) : 'null'}`
    if (node.children) code += `,${toCode(node.children)}`
    code += ')'
    components.push(code)
  }
  return components.join(',')
}

function parseBasicNode (node: MarkdownNode, imports: Imports): PreactNode | string {
  if (node.type === MarkdownType.Text) return node.content as string
  const tag = node.type === MarkdownType.Heading ? `h${node.level}` : BasicTags[node.type]
  if (node.type === MarkdownType.Ruler || node.type === MarkdownType.LineBreak) {
    return { tag, component: false }
  }

  const content = (node as any).content
  return { tag, component: false, children: typeof content === 'string' ? [ content ] : parseTree(content, imports) }
}

function parseHeading (node: MarkdownHeadingNode, imports: Imports): PreactNode {
  // import Heading from ???
  return { tag: 'mark', component: false, children: [ '--heading--' ] }
}

function parseTree (markdown: MarkdownNode[], imports: Imports): Array<PreactNode | string> {
  const res: Array<PreactNode | string> = []
  for (const node of markdown) {
    switch (node.type) {
      case MarkdownType.Paragraph:
      case MarkdownType.Quote:
      case MarkdownType.Text:
      case MarkdownType.Bold:
      case MarkdownType.Italic:
      case MarkdownType.Underline:
      case MarkdownType.StrikeThrough:
      case MarkdownType.Code:
      case MarkdownType.Ruler:
      case MarkdownType.LineBreak:
        res.push(parseBasicNode(node, imports))
        break
      case MarkdownType.Heading:
        res.push(parseHeading(node as MarkdownHeadingNode, imports))
        break
      case MarkdownType.Link:
      case MarkdownType.Email:
      case MarkdownType.Anchor:
      case MarkdownType.Document:
        res.push({ tag: 'mark', component: false, children: [ '--anchor--' ] })
        // Link node
        break
      case MarkdownType.Note:
        res.push({ tag: 'mark', component: false, children: [ '--note--' ] })
        break
      case MarkdownType.CodeBlock:
        res.push({ tag: 'mark', component: false, children: [ '--codeblock--' ] })
        break
      case MarkdownType.List:
        res.push({ tag: 'mark', component: false, children: [ '--list--' ] })
        break
      case MarkdownType.Http:
        res.push({ tag: 'mark', component: false, children: [ '--http--' ] })
        break
      case MarkdownType.Table:
        res.push({ tag: 'mark', component: false, children: [ '--table--' ] })
        break
      case MarkdownType.Image:
      case MarkdownType.Video:
        res.push({ tag: 'mark', component: false, children: [ '--media--' ] })
        break
    }
  }

  return res
}

export default function render (markdown: MarkdownNode[]): string {
  const imports = { preact: '{ h, Fragment }' }

  const parsed = parseTree(markdown, imports)
  const lol = JSON.stringify({ markdown, imports, parsed })
  return `
    ${Object.entries(imports).map(([ from, i ]) => `import ${i} from '${from}'`).join('\n')}

    export default function () {
      console.log(${lol})
      return h(Fragment, null, ${toCode(parsed)})
    }
  `
}
