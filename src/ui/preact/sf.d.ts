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

declare module '@sf/categories' {
  export interface DocumentMeta {
    title: string
    slug: string
    parts: Array<{ id: string, name: string }>
  }

  export interface Category {
    title: string
    slug: string
    documents: DocumentMeta[]
  }

  let categories: {
    uncategorized: DocumentMeta[]
    categories: Category[]
  }

  export default categories
}

declare module '@sf/documents' {
  import type { ComponentType } from 'preact'

  export type LazyDocumentModule = () => Promise<{ default: ComponentType }>
  export type DocumentModule<TBool extends boolean> = TBool extends true ? LazyDocumentModule : ComponentType

  export interface Document<TBool extends boolean> {
    doc: DocumentModule<TBool>
    path: string
  }

  export interface Documents<TBool extends boolean> {
    documents: Array<Document<TBool>>
    lazy: TBool
  }

  let documents: Documents<boolean>
  export default documents
}
