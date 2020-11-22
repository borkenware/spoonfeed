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

let logDebug = false

const Prefixes = {
  DEBUG: '\x1b[47m\x1b[30m DEBUG \x1b[0m',
  INFO: '\x1b[44m\x1b[30m INFO \x1b[0m',
  SUCCESS: '\x1b[42m\x1b[30m SUCCESS \x1b[0m',
  WARNING: '\x1b[43m\x1b[30m WARN \x1b[0m',
  ERROR: '\x1b[41m\x1b[30m ERROR \x1b[0m',
}

function setDebug (d: boolean): void { logDebug = d }

function debug (message: string): void {
  if (logDebug) {
    console.log(`${Prefixes.DEBUG}  ${message}`)
  }
}

function info (message: string): void {
  console.log(`${Prefixes.INFO}  ${message}`)
}

function success (message: string): void {
  console.log(`${Prefixes.SUCCESS}  ${message}`)
}

function warn (message: string): void {
  console.log(`${Prefixes.WARNING}  ${message}`)
}

function error (message: string, err?: Error): void {
  console.log(`${Prefixes.ERROR}  ${message}`)
  if (err) {
    console.log(error) // todo: better
  }
}

export default {
  setDebug: setDebug,
  debug: debug,
  info: info,
  success: success,
  warn: warn,
  error: error,
}
