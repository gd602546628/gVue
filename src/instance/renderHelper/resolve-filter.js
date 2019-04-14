/* @flow */

import { identity, resolveAsset } from '../../util'

/**
 * Runtime helper for resolving filters
 */
export function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}
