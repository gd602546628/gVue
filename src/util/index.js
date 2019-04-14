const hasOwnProperty = Object.prototype.hasOwnProperty
const _toString = Object.prototype.toString

export function hasOwn(obj, key) {
    if(!obj) return false
    return hasOwnProperty.call(obj, key)
}

export function def(obj, key, val, enumerable = false) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: enumerable,
        writable: true,
        configurable: true
    })
}

export function isObject(obj) {
    return obj !== null && typeof obj === 'object'
}


// 将a.b.c,表达试转换为调用函数
const bailRE = /[^\w.$]/

export function parsePath(path) {
    if (bailRE.test(path)) {

        return
    }
    const segments = path.split('.')
    return function (obj) {

        for (let i = 0; i < segments.length; i++) {
            if (!obj) {

                return
            }

            obj = obj[segments[i]]
        }
        return obj
    }
}

export function makeMap(
    str,
    expectsLowerCase
) {
    const map = Object.create(null)
    const list = str.split(',')
    for (let i = 0; i < list.length; i++) {
        map[list[i]] = true
    }
    return expectsLowerCase
        ? val => map[val.toLowerCase()]
        : val => map[val]
}

export function cached(fn) {
    const cache = Object.create(null)
    return (function cachedFn(str) {
        const hit = cache[str]
        return hit || (cache[str] = fn(str))
    })
}

export function no() {
    return false
}

export function extend(to, _from) {
    for (const key in _from) {
        to[key] = _from[key]
    }
    return to
}

const camelizeRE = /-(\w)/g
export const camelize = cached((str) => {
    return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

export const parseStyleText = cached(function (cssText) {
    const res = {}
    const listDelimiter = /;(?![^(]*\))/g
    const propertyDelimiter = /:(.+)/
    cssText.split(listDelimiter).forEach(function (item) {
        if (item) {
            const tmp = item.split(propertyDelimiter)
            tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim())
        }
    })
    return res
})

export function warn(msg) {
    console.warn(msg)
}

export function isPlainObject(obj) {
    return _toString.call(obj) === '[object Object]'
}

export function toObject(arr) {
    const res = {}
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]) {
            extend(res, arr[i])
        }
    }
    return res
}

export const isReservedAttribute = makeMap('key,ref,slot,slot-scope,is')

const hyphenateRE = /\B([A-Z])/g
export const hyphenate = cached((str) => {
    return str.replace(hyphenateRE, '-$1').toLowerCase()
})

export function isDef(v) {
    return v !== undefined && v !== null
}

export function toNumber(val) {
    const n = parseFloat(val)
    return isNaN(n) ? val : n
}

export function toString(val) {
    return val == null
        ? ''
        : typeof val === 'object'
            ? JSON.stringify(val, null, 2)
            : String(val)
}

export function looseEqual(a) {
    if (a === b) return true
    const isObjectA = isObject(a)
    const isObjectB = isObject(b)
    if (isObjectA && isObjectB) {
        try {
            const isArrayA = Array.isArray(a)
            const isArrayB = Array.isArray(b)
            if (isArrayA && isArrayB) {
                return a.length === b.length && a.every((e, i) => {
                    return looseEqual(e, b[i])
                })
            } else if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime()
            } else if (!isArrayA && !isArrayB) {
                const keysA = Object.keys(a)
                const keysB = Object.keys(b)
                return keysA.length === keysB.length && keysA.every(key => {
                    return looseEqual(a[key], b[key])
                })
            } else {
                /* istanbul ignore next */
                return false
            }
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    } else if (!isObjectA && !isObjectB) {
        return String(a) === String(b)
    } else {
        return false
    }
}

export function looseIndexOf(arr, val) {
    for (let i = 0; i < arr.length; i++) {
        if (looseEqual(arr[i], val)) return i
    }
    return -1
}

export const identity = (_) => _

export function resolveAsset(
    options,
    type,
    id,
    warnMissing
) {
    /* istanbul ignore if */
    if (typeof id !== 'string') {
        return
    }
    const assets = options[type]||{}
    // check local registration variations first
    if (hasOwn(assets, id)) return assets[id]
    const camelizedId = camelize(id)
    if (hasOwn(assets, camelizedId)) return assets[camelizedId]
    const PascalCaseId = capitalize(camelizedId)
    if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
    // fallback to prototype chain
    const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
    if (warnMissing && !res) {
        warn(
            'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
            options
        )
    }
    return res
}

export function isUndef(v) {
    return v === undefined || v === null
}

export const emptyObject = Object.freeze({})
export function isTrue(v) {
    return v === true
}

export function isFalse(v) {
    return v === false
}

export function isPrimitive(value) {
    return (
        typeof value === 'string' ||
        typeof value === 'number' ||
        // $flow-disable-line
        typeof value === 'symbol' ||
        typeof value === 'boolean'
    )
}

export class _Set {
    constructor() {
        this.set = Object.create(null)
    }

    has(key) {
        return this.set[key] === true
    }

    add(key) {
        this.set[key] = true
    }

    clear() {
        this.set = Object.create(null)
    }
}

export function noop () {}

export function toRawType (value){
    return _toString.call(value).slice(8, -1)
}

export const capitalize = cached((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
})

export function remove (arr, item){
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

export function formatComponentName (vm, includeFile) {
    if (vm.$root === vm) {
        return '<Root>'
    }
    const options = typeof vm === 'function' && vm.cid != null
        ? vm.options
        : vm._isVue
            ? vm.$options || vm.constructor.options
            : vm || {}
    let name = options.name || options._componentTag
    const file = options.__file
    if (!name && file) {
        const match = file.match(/([^/\\]+)\.vue$/)
        name = match && match[1]
    }

    return (
        (name ? `<${classify(name)}>` : `<Anonymous>`) +
        (file && includeFile !== false ? ` at ${file}` : '')
    )
}

export function once (fn){
    let called = false
    return function () {
        if (!called) {
            called = true
            fn.apply(this, arguments)
        }
    }
}

export const hasSymbol =
    typeof Symbol !== 'undefined' &&
    typeof Reflect !== 'undefined'