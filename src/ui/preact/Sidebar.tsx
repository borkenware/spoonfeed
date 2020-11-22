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
import type { VNode } from 'preact'
import { Link } from 'preact-router/match'

/* eslint-disable import/no-unresolved -- Virtual modules handled by Rollup */
import type { DocumentMeta } from '@sf/categories'
import categories from '@sf/categories'
/* eslint-enable import/no-unresolved */

function Item (props: DocumentMeta & { category?: string }): VNode {
  let path = `/${props.category ? `${props.category}/` : ''}${props.slug}`
  return (
    <Link activeClassName='active' className='sidebar-item' href={path}>
      {props.title}
    </Link>
  )
}

function Items (props: { documents: DocumentMeta[], category?: string }): VNode {
  return (
    <>
      {props.documents.map(
        (doc) => <Item key={`${props.category ?? 'null'}--${doc.slug}`} category={props.category} {...doc}/>
      )}
    </>
  )
}

export default function Sidebar (): VNode {
  return (
    <div className='sidebar'>
      <div className='sidebar-logo'>
        <span>Logo here</span> {/* todo */}
      </div>

      <Items documents={categories.uncategorized}/>
      {categories.categories.map((cat) => (
        <Fragment key={cat.slug}>
          <h3 className='sidebar-category'>{cat.title}</h3>
          <Items category={cat.slug} documents={cat.documents}/>
        </Fragment>
      ))}
    </div>
  )
}
