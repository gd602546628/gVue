/* @flow */

import { warn, extend, isPlainObject } from '../../util'

export function bindObjectListeners (data, value){
  if (value) {
    if (!isPlainObject(value)) {
        warn('v-on without argument expects an Object value')
    } else {
      const on = data.on = data.on ? extend({}, data.on) : {}
      for (const key in value) {
        const existing = on[key]
        const ours = value[key]
        on[key] = existing ? [].concat(existing, ours) : ours
      }
    }
  }
  return data
}
