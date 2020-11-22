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

import { h, Fragment } from 'preact'
import Router from 'preact-router'
import type { VNode } from 'preact'
import type { RoutableProps } from 'preact-router'

/* eslint-disable import/no-unresolved -- Virtual modules handled by Rollup */
import documents from '@sf/documents'
import type { DocumentModule, LazyDocumentModule } from '@sf/documents'
/* eslint-enable import/no-unresolved */

import Sidebar from './Sidebar'
import LazyRoute from './LazyRoute'

function Route<TBool extends boolean> (props: { doc: DocumentModule<TBool>, lazy: TBool } & RoutableProps): VNode | null {
  if (props.lazy) {
    return <LazyRoute component={props.doc as LazyDocumentModule}/>
  }

  return null
}

export default function Layout (): VNode {
  return (
    <>
      <Sidebar/>
      <main>
        <div className='container'>
          <Router>
            {documents.documents.map((doc) => <Route key={doc.path} path={doc.path} doc={doc.doc} lazy={documents.lazy}/>)}
          </Router>
        </div>
      </main>
    </>
  )
}
