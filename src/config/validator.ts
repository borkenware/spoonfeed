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

import { Config } from './types'
import { hasOwnProperty, extendedTypeof, ExtendedType } from '../util'

interface Schema {
  [k: string]: SchemaItem
}

type SchemaItem = SchemaItemType | SchemaItemValues | SchemaItemNested

interface SchemaItemType {
  required?: boolean | ((cfg: Config | null) => boolean)
  types: ExtendedType | ExtendedType[]
}

interface SchemaItemValues {
  required?: boolean | ((cfg: Config | null) => boolean)
  values: any[]
}

interface SchemaItemNested {
  required?: boolean | ((cfg: Config | null) => boolean)
  schema: Schema
}

const schema: Schema = {
  documents: {
    schema: {
      source: { values: [ 'filesystem', 'registry' ] },
      assets: { types: 'string' },
      // Filesystem specific
      path: { types: 'string' }
      // Registry specific
    }
  },
  ui: {
    schema: {
      title: { types: 'string' },
      description: { types: 'string' },
      copyright: { types: [ 'string', 'null' ] },
      logo: { types: [ 'string', 'null' ] },
      favicon: { types: [ 'string', 'null' ] },
      acknowledgements: { types: 'boolean' }
    }
  },
  build: {
    schema: {
      target: { types: 'string' },
      mode: { values: [ 'preact' ] },
      sourcemaps: { types: 'boolean' },
      optimizeImg: { types: 'boolean' },
      offline: { types: 'boolean' },
      mangle: { types: 'boolean' }
    }
  },
  ssr: {
    schema: {
      generate: { types: 'boolean' },
      redirectInsecure: { types: 'boolean' },
      http2: { types: 'boolean' },
      ssl: {
        required: c => !!(c?.ssr?.http2 || c?.ssr?.redirectInsecure),
        schema: {
          cert: { required: true, types: 'string' },
          key: { required: true, types: 'string' }
        }
      }
    }
  }
}

function validateSchema (schema: Schema, object: object, full?: object, prefix: string = '') {
  const rootType = extendedTypeof(object)
  if (rootType !== 'object') {
    throw new TypeError(`Invalid field type: expected object, got ${rootType} for ${prefix || 'root'}`)
  }

  if (!full) full = object
  for (const [ key, item ] of Object.entries(schema)) {
    const required = item.required
      ? typeof item.required === 'function' ? item.required(full as Config) : item.required
      : false

    if (hasOwnProperty(object, key)) {
      /* istanbul ignore else */
      if (hasOwnProperty(item, 'types')) {
        const types = Array.isArray(item.types) ? item.types : [ item.types ]
        const type = extendedTypeof(object[key])
        if (!types.includes(type)) {
          throw new TypeError(`Invalid field type: expected ${types.join(' or ')}, got ${type} for ${prefix}${key}`)
        }
      } else if (hasOwnProperty(item, 'values')) {
        if (!item.values.includes(object[key])) {
          throw new TypeError(`Invalid field value: expected ${item.values.map(s => `"${s}"`).join(' or ')}, got ${object[key]} for ${prefix}${key}`)
        }
      } else if (hasOwnProperty(item, 'schema')) {
        validateSchema(item.schema, object[key], full, `${prefix}${key}.`)
      }
    } else if (required) {
      throw new TypeError(`Missing required field ${prefix}${key}`)
    }
  }
}

export default function validate (config: object) {
  validateSchema(schema, config)
}