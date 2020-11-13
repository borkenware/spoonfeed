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

import { RenderedCategory, RenderedDocument } from '../..'

export default function (categories: RenderedCategory[], documents: RenderedDocument[], lazy: boolean) {
  const knownSlugs = documents.map(d => d.slug)

  return {
    name: 'spoonfeed-virtual',
    resolveId (src: string) {
      const known = [ '@sf/categories', '@sf/documents' ].includes(src) ||
        (src.startsWith('@sf/doc/') && knownSlugs.includes(src.slice(8, -3)))

      if (known) return src
      return null
    },
    load: (id: string) => {
      if (id === '@sf/categories') {
        return `export default ${JSON.stringify(categories)}`
      }

      if (id === '@sf/documents') {
        let imports = ''
        let mdl = `export default { lazy: ${String(lazy)}, documents: {`
        for (const doc of documents) {
          const path = `@sf/doc/${doc.slug}.js`
          if (lazy) {
            mdl += `['${doc.slug}']: () => import('${path}'),`
          } else {
            const id = `_${Math.random().toString(36).slice(2)}`
            imports += `import ${id} from '${path}'\n`
            mdl += `['${doc.slug}']: ${id},`
          }
        }
        mdl += '} }'
        return imports + mdl
      }

      if (id.startsWith('@sf/doc/')) {
        const slug = id.slice(8, -3)
        const doc = documents.find(d => d.slug === slug)!!
        return doc.code
      }

      return null
    }
  }
}
