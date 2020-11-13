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

import { join } from 'path'
import { rollup, RollupOptions, OutputOptions } from 'rollup'
import resolve from '@rollup/plugin-node-resolve'
import sucrase from '@rollup/plugin-sucrase'
import { terser } from 'rollup-plugin-terser'
import virtual from './rollup/virtual'

import { Config } from '../../config/types'
import { RenderedCategory, RenderedDocument } from '..'
import { Asset } from '.'

const { version } = require('../../../package.json')

// todo: css
function generateHtml (main: string, runtime?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf8"/>
      </head>
      <body>
        <div id="react-root"><!-- #reactroot# --></div>
        ${runtime ? `<script>${runtime}</script>` : ''}
        <script src="/dist/${main}"></script>
        <!-- Generated with love by Spoonfeed v${version} -->
    </html>
  `.split('\n').map(s => s.slice(4).trimEnd()).filter(Boolean).join('\n')
}

export default async function bundle (categories: RenderedCategory[], documents: RenderedDocument[], config: Config): Promise<Asset[]> {
  const entryMain = join(__dirname, '../../..', 'ui/preact/main.ts')
  const entryRjs = join(__dirname, '../../..', 'ui/preact/runtime.ts')
  const rollupOpts: RollupOptions = {
    preserveEntrySignatures: false,
    plugins: [
      // todo: img
      // todo: svg sprites (iconify)
      resolve({ extensions: [ '.js', '.ts', '.tsx' ] }),
      sucrase({ exclude: [ 'node_modules/**' ], jsxPragma: 'h', transforms: [ 'typescript', 'jsx' ] }),
      virtual(categories, documents, config.build.split)
    ]
  }

  const outOpts: OutputOptions = {
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].chk.js',
    sourcemap: false,
    plugins: [ terser({ mangle: config.build.mangle }) ],
    amd: { id: '[__amd_id__]', define: 'd' }
  }

  const bundle = await rollup({ input: entryMain, ...rollupOpts })
  const { output } = await bundle.generate({ format: 'amd', ...outOpts })

  const assets = output.map<Asset>(o => ({
    filename: `dist/${o.fileName}`,
    src: o.type === 'chunk' ? o.code.replace(/\[__amd_id__]/g, `./${o.fileName.slice(0, -3)}`) : o.source
  }))

  if (config.build.split) {
    const runtimeBundle = await rollup({ input: entryRjs, ...rollupOpts })
    const { output: [ { code: runtime } ] } = await runtimeBundle.generate({ format: 'iife', ...outOpts })
    assets.push({ filename: 'index.html', src: generateHtml(output[0].fileName, runtime.trim()) })
  } else {
    assets.push({ filename: 'index.html', src: generateHtml(output[0].fileName) })
  }

  return assets
}
