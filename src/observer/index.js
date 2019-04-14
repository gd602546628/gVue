import {hasOwn, def, isObject} from '../util'
import {Dep} from './dep'

export function observe(value) {
    if (!isObject(value)) {
        return
    }
    if (hasOwn(value, '_ob_')) {
        return
    }
    return new Observer(value)
}

export class Observer {
    constructor(value) {
        this.value = value
        this.dep = new Dep()
        def(value, '_ob_', this)
        if (Array.isArray(value)) {

        } else {
            this.walk(value)
        }
    }

    walk(value) {
        Object.keys(value).forEach(key => {
            defineReactive(value, key)
        })
    }
}

export function defineReactive(obj, key, shallow = false) {
    let dep = new Dep()
    const property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) { // 当前对象是不可配置的，则直接返回
        return
    }
    const getter = property && property.get
    const setter = property && property.set
    let val = obj[key]


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

export let shouldObserve= true

export function toggleObserving (value) {
    shouldObserve = value
}