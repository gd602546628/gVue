const hasOwnProperty = Object.prototype.hasOwnProperty
const _toString = Object.prototype.toString
export const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/
const strats = Object.create(null)

export function hasOwn(obj, key) {
    if (!obj) return false
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

export function looseEqual(a,b) {
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
    const assets = options[type] || {}
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

export function noop() {
}

export function toRawType(value) {
    return _toString.call(value).slice(8, -1)
}

export const capitalize = cached((str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
})

export function remove(arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

export function formatComponentName(vm, includeFile) {
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

export function once(fn) {
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

export function isValidArrayIndex(val) {
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
}

export const hasProto = '__proto__' in {}

export function isReserved(str) {
    const c = (str + '').charCodeAt(0)
    return c === 0x24 || c === 0x5F
}

export function toArray(list, start) {
    start = start || 0
    let i = list.length - start
    const ret = new Array(i)
    while (i--) {
        ret[i] = list[i + start]
    }
    return ret
}

export function invokeWithErrorHandling(
    handler,
    context,
    args,
    vm,
    info
) {
    let res
    try {
        res = args ? handler.apply(context, args) : handler.call(context)
        if (res && !res._isVue && isPromise(res) && !res._handled) {
            res.catch(e => console.error(info))
            res._handled = true
        }
    } catch (e) {
        console.error(info)
    }
    return res
}

export function isRegExp(v) {
    return _toString.call(v) === '[object RegExp]'
}

export const namespaceMap = {
    svg: 'http://www.w3.org/2000/svg',
    math: 'http://www.w3.org/1998/Math/MathML'
}

export const isXlink = (name) => {
    return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
}

export const xlinkNS = 'http://www.w3.org/1999/xlink'

export const getXlinkProp = (name) => {
    return isXlink(name) ? name.slice(6, name.length) : ''
}
export const isBooleanAttr = makeMap(
    'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
    'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
    'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
    'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
    'required,reversed,scoped,seamless,selected,sortable,translate,' +
    'truespeed,typemustmatch,visible'
)


export const isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck')

const isValidContentEditableValue = makeMap('events,caret,typing,plaintext-only')
export const isFalsyAttrValue = (val) => {
    return val == null || val === false
}

export const convertEnumeratedValue = (key, value) => {
    return isFalsyAttrValue(value) || value === 'false'
        ? 'false'
        // allow arbitrary string value for contenteditable
        : key === 'contenteditable' && isValidContentEditableValue(value)
            ? value
            : 'true'
}

export const inBrowser = typeof window !== 'undefined'
export const UA = inBrowser && window.navigator.userAgent.toLowerCase()
export const isIE = UA && /msie|trident/.test(UA)
export const isIE9 = UA && UA.indexOf('msie 9.0') > 0
export const isEdge = UA && UA.indexOf('edge/') > 0

export function concat(a, b) {
    return a ? b ? (a + ' ' + b) : a : (b || '')
}


export function stringifyClass(value) {
    if (Array.isArray(value)) {
        return stringifyArray(value)
    }
    if (isObject(value)) {
        return stringifyObject(value)
    }
    if (typeof value === 'string') {
        return value
    }
    /* istanbul ignore next */
    return ''
}

function stringifyArray(value) {
    let res = ''
    let stringified
    for (let i = 0, l = value.length; i < l; i++) {
        if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
            if (res) res += ' '
            res += stringified
        }
    }
    return res
}

function stringifyObject(value) {
    let res = ''
    for (const key in value) {
        if (value[key]) {
            if (res) res += ' '
            res += key
        }
    }
    return res
}

function mergeClassData(child, parent) {
    return {
        staticClass: concat(child.staticClass, parent.staticClass),
        class: isDef(child.class)
            ? [child.class, parent.class]
            : parent.class
    }
}

export function genClassForVnode(vnode) {
    let data = vnode.data
    let parentNode = vnode
    let childNode = vnode
    while (isDef(childNode.componentInstance)) {
        childNode = childNode.componentInstance._vnode
        if (childNode && childNode.data) {
            data = mergeClassData(childNode.data, data)
        }
    }
    while (isDef(parentNode = parentNode.parent)) {
        if (parentNode && parentNode.data) {
            data = mergeClassData(data, parentNode.data)
        }
    }
    return renderClass(data.staticClass, data.class)
}

export const isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
    'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
)
export const isFF = UA && UA.match(/firefox\/(\d+)/)

export let supportsPassive = false
export let isUsingMicroTask = false

function normalizeStyleData(data) {
    const style = normalizeStyleBinding(data.style)
    // static style is pre-processed into an object during compilation
    // and is always a fresh object, so it's safe to merge into it
    return data.staticStyle
        ? extend(data.staticStyle, style)
        : style
}

// normalize possible array / string values into Object
export function normalizeStyleBinding(bindingStyle) {
    if (Array.isArray(bindingStyle)) {
        return toObject(bindingStyle)
    }
    if (typeof bindingStyle === 'string') {
        return parseStyleText(bindingStyle)
    }
    return bindingStyle
}

export function getStyle(vnode, checkChild) {
    const res = {}
    let styleData

    if (checkChild) {
        let childNode = vnode
        while (childNode.componentInstance) {
            childNode = childNode.componentInstance._vnode
            if (
                childNode && childNode.data &&
                (styleData = normalizeStyleData(childNode.data))
            ) {
                extend(res, styleData)
            }
        }
    }

    if ((styleData = normalizeStyleData(vnode.data))) {
        extend(res, styleData)
    }

    let parentNode = vnode
    while ((parentNode = parentNode.parent)) {
        if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
            extend(res, styleData)
        }
    }
    return res
}

const defaultStrat = function (parentVal, childVal) {
    return childVal === undefined
        ? parentVal
        : childVal
}

function normalizeProps(options, vm) {
    const props = options.props
    if (!props) return
    const res = {}
    let i, val, name
    if (Array.isArray(props)) {
        i = props.length
        while (i--) {
            val = props[i]
            if (typeof val === 'string') {
                name = camelize(val)
                res[name] = {type: null}
            } else if (process.env.NODE_ENV !== 'production') {
                warn('props must be strings when using array syntax.')
            }
        }
    } else if (isPlainObject(props)) {
        for (const key in props) {
            val = props[key]
            name = camelize(key)
            res[name] = isPlainObject(val)
                ? val
                : {type: val}
        }
    } else if (process.env.NODE_ENV !== 'production') {
        warn(
            `Invalid value for option "props": expected an Array or an Object, ` +
            `but got ${toRawType(props)}.`,
            vm
        )
    }
    options.props = res
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject(options, vm) {
    const inject = options.inject
    if (!inject) return
    const normalized = options.inject = {}
    if (Array.isArray(inject)) {
        for (let i = 0; i < inject.length; i++) {
            normalized[inject[i]] = {from: inject[i]}
        }
    } else if (isPlainObject(inject)) {
        for (const key in inject) {
            const val = inject[key]
            normalized[key] = isPlainObject(val)
                ? extend({from: key}, val)
                : {from: val}
        }
    } else if (process.env.NODE_ENV !== 'production') {
        warn(
            `Invalid value for option "inject": expected an Array or an Object, ` +
            `but got ${toRawType(inject)}.`,
            vm
        )
    }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives(options) {
    const dirs = options.directives
    if (dirs) {
        for (const key in dirs) {
            const def = dirs[key]
            if (typeof def === 'function') {
                dirs[key] = {bind: def, update: def}
            }
        }
    }
}

export function mergeOptions(
    parent,
    child,
    vm
) {


    if (typeof child === 'function') {
        child = child.options
    }

    normalizeProps(child, vm)
    normalizeInject(child, vm)
    normalizeDirectives(child)

    // Apply extends and mixins on the child options,
    // but only if it is a raw options object that isn't
    // the result of another mergeOptions call.
    // Only merged options has the _base property.
    if (!child._base) {
        if (child.extends) {
            parent = mergeOptions(parent, child.extends, vm)
        }
        if (child.mixins) {
            for (let i = 0, l = child.mixins.length; i < l; i++) {
                parent = mergeOptions(parent, child.mixins[i], vm)
            }
        }
    }

    const options = {}
    let key
    for (key in parent) {
        mergeField(key)
    }
    for (key in child) {
        if (!hasOwn(parent, key)) {
            mergeField(key)
        }
    }

    function mergeField(key) {
        const strat = strats[key] || defaultStrat
        options[key] = strat(parent[key], child[key], vm, key)
    }

    return options
}

export function validateComponentName(name) {
    if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
        warn(
            'Invalid component name: "' + name + '". Component names ' +
            'should conform to valid custom element name in html5 specification.'
        )
    }
    if (isBuiltInTag(name) || config.isReservedTag(name)) {
        warn(
            'Do not use built-in or reserved HTML elements as component ' +
            'id: ' + name
        )
    }
}
export const isBuiltInTag = makeMap('slot,component', true)

export function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}