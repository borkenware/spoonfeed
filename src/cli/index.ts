#!/usr/bin/env node

/*
 * Copyright (c) 2020-2021 Borkenware, All rights reserved.
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

import log from '../log.js'

// eslint-disable-next-line @typescript-eslint/no-var-requires -- We use require here so it doesn't get bundled by TS
const { version: VERSION } = require('../../package.json') as { version: string }

function bundle (serve: boolean): void {
  if (serve) {
    console.log('Not implemented yet!')
    process.exit(0)
  }

  console.log('Henlo')
}

function about (): void {
  console.log('Proudly built by Borkenware.')
  // some day -- console.log('Proudly built by Borkenware, and ##{CONTRIBUTORS} contributors.')
  console.log(`Spoonfeed is Honest Open ${Math.random().toFixed(3) === '0.420' ? 'Sauce' : 'Source'} Software, licensed under BSD-3-Clause.`)
  console.log('https://github.com/borkenware/spoonfeed')
}

function displayHelp (): void {
  console.log('spoonfeed [arguments] <command>\n')

  console.log(' - spoonfeed bundle')
  console.log('   Bundles the documentation')
  console.log('   Enable debug logging with --debug')
  console.log()
  /*
   * console.log(' - spoonfeed serve')
   * console.log('   Starts the dev server')
   * console.log('   Enable debug logging with --debug')
   * console.log()
   */
  console.log(' - spoonfeed about')
  console.log('   Prints information about Spoonfeed')
  console.log()
  console.log(' - spoonfeed help')
  console.log('   Shows this help message')
}

if (require.main?.filename === __filename) {
  console.log(`Spoonfeed v${VERSION}`, '\n')

  if (process.argv.includes('--debug')) log.setDebug(true)
  const command = process.argv.length > 2 ? process.argv[process.argv.length - 1] : ''
  switch (command) {
    case 'bundle':
      bundle(false)
      break
    case 'serve':
      bundle(true)
      break
    case 'about':
      about()
      break
    default:
      if (command && command !== 'help') {
        console.log(`Invalid usage! Unknown command "${command}".`)
        console.log('Valid usages are:\n')
      }

      displayHelp()
      break
  }
}
