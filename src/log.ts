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
  DEBUG: `\x1b[47m\x1b[30m DEBUG \x1b[0m`,
  INFO: `\x1b[44m\x1b[30m INFO \x1b[0m`,
  SUCCESS: `\x1b[42m\x1b[30m SUCCESS \x1b[0m`,
  WARNING: `\x1b[43m\x1b[30m WARN \x1b[0m`,
  ERROR: `\x1b[41m\x1b[30m ERROR \x1b[0m`
}

export function setDebug (d: boolean) { logDebug = d }

export function debug (message: string) {
  if (logDebug) {
    console.log(`${Prefixes.DEBUG}  ${message}`)
  }
}

export function info (message: string) {
  console.log(`${Prefixes.INFO}  ${message}`)
}

export function success (message: string) {
  console.log(`${Prefixes.SUCCESS}  ${message}`)
}

export function warn (message: string) {
  console.log(`${Prefixes.WARNING}  ${message}`)
}

export function error (message: string, error?: Error) {
  console.log(`${Prefixes.ERROR}  ${message}`)
}
