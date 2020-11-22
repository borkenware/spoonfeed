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

interface Window { // eslint-disable-line @typescript-eslint/no-unused-vars -- This is used to allow assigning d
  d: (id: string, deps: string[], mdl?: (...modules: unknown[]) => unknown) => void
}

let cache: Record<string, unknown> = {}

function r (query: string | string[], res?: (...modules: unknown[]) => void): unknown | Promise<unknown> {
  if (Array.isArray(query)) {
    let promise = Promise.all(
      query.map(
        async (q) =>
          new Promise((resolve) => {
            let script = document.createElement('script')
            script.src = `/dist/${q.slice(2)}`
            script.onload = (): void => { resolve(cache[q]) }
            document.head.appendChild(script)
          })
      )
    )

    promise
      .then((m) => res?.(...m))
      .catch((e) => console.error('Failed to load module', e))
    return
  }

  if (!cache[query]) throw new Error('Module not found')
  return cache[query]
}

window.d = function d (id: string, deps: string[], mdl?: (...modules: unknown[]) => unknown): void {
  if (!mdl) {
    mdl = deps as unknown as (...modules: unknown[]) => unknown
    deps = []
  }

  let e = {}
  let args = []
  for (let dep of deps) {
    if (dep === 'require') args.push(r)
    else if (dep === 'exports') args.push(e)
    else args.push(r(dep))
  }

  mdl.apply(null, args)
  cache[id] = e
}
