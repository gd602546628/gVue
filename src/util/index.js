const hasOwnProperty = Object.prototype.hasOwnProperty

export function hasOwn(obj, key) {
    return hasOwnProperty.call(obj, key)
}

export function def (obj, key, val, enumerable=false) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: enumerable,
        writable: true,
        configurable: true
    })
}

export function isObject (obj) {
    return obj !== null && typeof obj === 'object'
}