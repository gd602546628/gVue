const hasOwnProperty = Object.prototype.hasOwnProperty


export function hasOwn(obj, key) {
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

export function extend (to, _from){
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