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
import babel, { getBabelOutputPlugin } from '@rollup/plugin-babel'
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
        <script src="${main}"></script>
        <!-- Generated with love by Spoonfeed v${version} -->
    </html>
  `.split('\n').map(s => s.slice(4).trimEnd()).filter(Boolean).join('\n')
}

async function generateAssets (categories: RenderedCategory[], documents: RenderedDocument[], config: Config): Promise<Asset[]> {
  const bundle = await rollup({
    input: join(__dirname, '../../..', 'ui/preact/main.ts'),
    preserveEntrySignatures: false,
    plugins: [
      // todo: img
      // todo: svg sprites (iconify)
      resolve({ extensions: [ '.js', '.ts', '.tsx' ] }),
      virtual(categories, documents, config.build.split),
      babel({
        configFile: false,
        exclude: [ 'node_modules/**' ],
        babelHelpers: 'runtime',
        extensions: [ '.js', '.ts', '.tsx' ],
        presets: [
          [ '@babel/preset-react', { pragma: 'h', pragmaFrag: 'Fragment' } ],
          [ '@babel/preset-typescript', { isTSX: true, allExtensions: true, jsxPragma: 'h' } ]
        ],
        plugins: [
          [ '@babel/transform-runtime', { useESModules: true } ],
          '@babel/proposal-class-properties',
          '@babel/transform-react-display-name'
        ]
      })
    ]
  })

  const { output } = await bundle.generate({
    entryFileNames: '[hash].js',
    chunkFileNames: '[hash].chk.js',
    plugins: [
      getBabelOutputPlugin({ presets: [ [ '@babel/env', { modules: 'amd' } ] ] }),
      terser({ mangle: config.build.mangle })
    ]
  })

  return output.map<Asset>(o => ({
    filename: `dist/${o.fileName}`,
    src: o.type === 'chunk' ? o.code.replace(/^define\(/g, `d("./${o.fileName.slice(0, -3)}",`) : o.source
  }))
}

async function generateRuntime (config: Config): Promise<string> {
  const bundle = await rollup({
    input: join(__dirname, '../../..', 'ui/preact/runtime.ts'),
    plugins: [
      babel({
        configFile: false,
        babelHelpers: 'inline',
        extensions: [ '.js', '.ts' ],
        presets: [ '@babel/preset-typescript' ],
        plugins: [ '@babel/proposal-class-properties' ]
      })
    ]
  })

  const { output: [ { code } ] } = await bundle.generate({
    plugins: [
      getBabelOutputPlugin({allowAllFormats: true, presets: [ [ '@babel/env', { modules: 'cjs' } ] ] }),
      terser({ mangle: config.build.mangle })
    ]
  })

  return `!function(){${code.trim()}}()`
}

export default async function bundle (categories: RenderedCategory[], documents: RenderedDocument[], config: Config): Promise<Asset[]> {
  const assets = await generateAssets(categories, documents, config);

  if (config.build.split) {
    const runtime = await generateRuntime(config)
    assets.push({ filename: 'index.html', src: generateHtml(assets[0].filename, runtime) })
  } else {
    assets.push({ filename: 'index.html', src: generateHtml(assets[0].filename) })
  }

  return assets
}
