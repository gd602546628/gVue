/* @flow */

import { addProp } from '../../parser/helper'

export default function html (el, dir) {
  if (dir.value) {
    addProp(el, 'innerHTML', `_s(${dir.value})`)
  }
}
