import {hasOwn, def, isObject, isPrimitive, isUndef, warn, isValidArrayIndex, hasProto, isPlainObject} from '../util'
import {Dep} from './dep'
import {arrayMethods} from './array'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
export let shouldObserve = true

export function observe(value) {
    if (!isObject(value)) {
        return
    }
    if (hasOwn(value, '__ob__')) {
        return value.__ob__
    }
    if (shouldObserve && Object.isExtensible(value) && (Array.isArray(value) || isPlainObject(value))) {
        return new Observer(value)
    }
    return
}

export class Observer {
    constructor(value) {
        this.value = value
        this.dep = new Dep()
        def(value, '__ob__', this)
        if (Array.isArray(value)) {
            if (hasProto) { // 如果浏览器支持__proto__ ,则将当前value的__proto__ 指向数组方法代理对象，从而达到代理作用
                protoAugment(value, arrayMethods)
            } else { // 不支持__proto__，将代理对象方法添加到当前value上
                copyAugment(value, arrayMethods, arrayKeys)
            }
            this.observeArray(value) //将数组元素设置为响应式
        } else {
            this.walk(value)
        }
    }

    walk(value) {
        Object.keys(value).forEach(key => {
            defineReactive(value, key)
        })
    }

    observeArray(items) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(items[i])
        }
    }
}

function dependArray(value) { // 收集依赖时，如果是当前值是数组，则将数组子元素依赖也收集
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i]
        e && e.__ob__ && e.__ob__.dep.depend()
        if (Array.isArray(e)) {
            dependArray(e)
        }
    }
}

export function defineReactive(obj, key, val, shallow = false) {
    let dep = new Dep()
    const property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) { // 当前对象是不可配置的，则直接返回
        return
    }
    const getter = property && property.get
    const setter = property && property.set

    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key]
    }

    let childOb = !shallow && observe(val) //如果val是对象的话，进行深度观测

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
            let value = getter ? getter.call(obj) : val
            if (Dep.target) {
                dep.depend()
                if (childOb) {
                    childOb.dep.depend()
                    if (Array.isArray(value)) {// 收集依赖时，如果是当前值是数组，则将数组子元素依赖也收集,因为对于数组而言，子元素改变也代表该数组改变
                        dependArray(value)
                    }
                }
            }
            return value
        },
        set(newVal) {
            let value = getter ? getter.call(obj) : val
            if (newVal === value || (newVal !== newVal && value !== value)) { //新旧值相等，或新旧值 为NaN
                return
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()
        }
    })
}


export function toggleObserving(value) {
    shouldObserve = value
}

export function set(target, key, val) {
    if ((isUndef(target) || isPrimitive(target))) {
        warn(`target必须是对象`)
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
    }
    if (key in target && !(key in Object.prototype)) {
        target[key] = val
        return val
    }
    const ob = target.__ob__
    if (target._isVue || (ob && ob.vmCount)) {
        warn(`避免在gVue实例上调用set方法`)
        return val
    }
    if (!ob) {
        target[key] = val
        return val
    }
    defineReactive(ob.value, key, val) //给对象的新属性 进行观测，并且收集依赖，属性本身收集依赖的同时，依赖也会收集到  target._ob_
    ob.dep.notify() //子属性收集依赖的同时，本身也会收集和子属性同样的依赖，所以这里会触发子属性的依赖
    return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del(target, key) {
    if ((isUndef(target) || isPrimitive(target))) {
        warn(`target必须是对象`)
    }
    if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.splice(key, 1)
        return
    }
    const ob = target.__ob__
    if (target._isVue || (ob && ob.vmCount)) {
        warn(`避免在gVue实例上调用del方法`)
        return
    }
    if (!hasOwn(target, key)) {
        return
    }
    delete target[key]
    if (!ob) { //当前target未被观测过
        return
    }
    ob.dep.notify() //子属性和当前有同样依赖，所以这里直接触发当前的依赖
}

function protoAugment(target, src) {

    target.__proto__ = src

}

function copyAugment(target, src, keys) {
    for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i]
        def(target, key, src[key])
    }
}