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

import type { ExtendedType } from '../util'
import { hasOwnProperty, extendedTypeof } from '../util'
import type { Config } from './types'

type Schema = Record<string, SchemaItem>

type SchemaItem = SchemaItemType | SchemaItemTypeArray | SchemaItemValues | SchemaItemNested

interface SchemaItemType {
  required?: boolean | ((cfg: Config | null) => boolean)
  types: ExtendedType | ExtendedType[]
}

interface SchemaItemTypeArray {
  required?: boolean | ((cfg: Config | null) => boolean)
  types: 'array'
  of: SchemaItem[]
}

interface SchemaItemValues {
  required?: boolean | ((cfg: Config | null) => boolean)
  values: string[]
}

interface SchemaItemNested {
  required?: boolean | ((cfg: Config | null) => boolean)
  schema: Schema
}

enum ErrorTypes { TYPE, VALUE, ARRAY }

let schema: Schema = {
  documents: {
    schema: {
      source: { values: [ 'filesystem', 'registry' ] },
      assets: { types: 'string' },
      // Filesystem specific
      path: { types: 'string' },
      // Registry specific
      documents: {
        types: 'array',
        of: [
          { types: 'string' },
          {
            schema: {
              category: { types: 'string' },
              documents: { types: 'array', of: [ { types: 'string' } ] },
            },
          },
        ],
      },
    },
  },
  ui: {
    schema: {
      title: { types: 'string' },
      description: { types: 'string' },
      copyright: { types: [ 'string', 'null' ] },
      logo: { types: [ 'string', 'null' ] },
      favicon: { types: [ 'string', 'null' ] },
      acknowledgements: { types: 'boolean' },
    },
  },
  build: {
    schema: {
      target: { types: 'string' },
      mode: { values: [ 'preact' ] },
      optimizeImg: { types: 'boolean' },
      offline: { types: 'boolean' },
      mangle: { types: 'boolean' },
      split: { types: 'boolean' },
    },
  },
  ssr: {
    schema: {
      generate: { types: 'boolean' },
      redirectInsecure: { types: 'boolean' },
      http2: { types: 'boolean' },
      ssl: {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/prefer-nullish-coalescing -- Intentional untrusted user input
        required: (c): boolean => Boolean(c?.ssr?.http2 || c?.ssr?.redirectInsecure),
        schema: {
          cert: { required: true, types: 'string' },
          key: { required: true, types: 'string' },
        },
      },
    },
  },
}

function validateType (value: unknown, item: SchemaItem, full: Record<string, unknown>, prefix: string, tc: boolean = false): ErrorTypes | void {
  /* istanbul ignore else */
  if (hasOwnProperty(item, 'types')) {
    let types = Array.isArray(item.types) ? item.types : [ item.types ]
    let type = extendedTypeof(value)
    if (!types.includes(type)) return ErrorTypes.TYPE

    if (type === 'array' && hasOwnProperty(item, 'of')) {
      let array = value as unknown[]
      for (let val of array) {
        if (item.of.every((sc) => typeof validateType(val, sc, full, prefix, true) !== 'undefined')) {
          return ErrorTypes.ARRAY
        }
      }
    }
  } else if (hasOwnProperty(item, 'values')) {
    if (!item.values.includes(value as string)) return ErrorTypes.VALUE
  } else if (hasOwnProperty(item, 'schema')) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define -- Recursive call
      validateSchema(item.schema, value as Record<string, unknown>, full, prefix)
    } catch (e) {
      if (tc) return ErrorTypes.ARRAY
      throw e
    }
  }
}

function validateSchema (schem: Schema, object: Record<string, unknown>, full?: Record<string, unknown>, prefix: string = ''): void {
  let rootType = extendedTypeof(object)
  if (rootType !== 'object') {
    throw new TypeError(`Invalid field type: expected object, got ${rootType} for ${prefix || 'root'}`)
  }

  if (!full) full = object
  for (let [ key, item ] of Object.entries(schem)) {
    let required = item.required ?
      typeof item.required === 'function' ? item.required(full as unknown as Config) : item.required :
      false

    if (hasOwnProperty(object, key)) {
      let error = validateType(object[key], item, full, `${prefix}${key}.`)
      switch (error) {
        case ErrorTypes.TYPE: {
          let i = item as SchemaItemType
          let types = Array.isArray(i.types) ? i.types : [ i.types ]
          throw new TypeError(`Invalid field type: expected ${types.join(' or ')}, got ${extendedTypeof(object[key])} for ${prefix}${key}`)
        }
        case ErrorTypes.VALUE: {
          let i = item as SchemaItemValues
          throw new TypeError(`Invalid field value: expected ${i.values.map((s: string) => `"${s}"`).join(' or ')}, got ${object[key] as string} for ${prefix}${key}`)
        }
        case ErrorTypes.ARRAY:
          throw new TypeError(`Invalid array item value for ${prefix}${key}`)
      }
    } else if (required) {
      throw new TypeError(`Missing required field ${prefix}${key}`)
    }
  }
}

export default function validate (config: Record<string, unknown>): void {
  validateSchema(schema, config)
}
