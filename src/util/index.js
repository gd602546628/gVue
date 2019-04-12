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