/* @flow */


import {
    warn,
    isObject,
    toObject,
    isReservedAttribute,
    no
} from '../../util'

const config = {
    mustUseProp: no
}

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
export function bindObjectProps(
    data,
    tag,
    value,
    asProp,
    isSync
) {
    if (value) {
        if (!isObject(value)) {
            warn('v-bind without argument expects an Object or Array value')
        } else {
            if (Array.isArray(value)) {
                value = toObject(value)
            }
            let hash
            for (const key in value) {
                if (
                    key === 'class' ||
                    key === 'style' ||
                    isReservedAttribute(key)
                ) {
                    hash = data
                } else {
                    const type = data.attrs && data.attrs.type
                    hash = asProp || config.mustUseProp(tag, type, key)
                        ? data.domProps || (data.domProps = {})
                        : data.attrs || (data.attrs = {})
                }
                if (!(key in hash)) {
                    hash[key] = value[key]

                    if (isSync) {
                        const on = data.on || (data.on = {})
                        on[`update:${key}`] = function ($event) {
                            value[key] = $event
                        }
                    }
                }
            }
        }
    }
    return data
}