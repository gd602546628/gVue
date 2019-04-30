import {hasOwn, noop, warn, isReserved} from '../util'
import {observe, toggleObserving, defineReactive,del,set} from '../observer'
import {validateProp} from '../util/props'
import {Watcher} from '../observer/watcher'
import {Dep} from '../observer/dep'

const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
}

const computedWatcherOptions = {lazy: true}

export function stateMixin(GVue) {
    const dataDef = {}
    dataDef.get = function () {
        return this._data
    }
    const propsDef = {}
    propsDef.get = function () {
        return this._props
    }
    dataDef.set = function () {
        warn('$data是只读的')
    }
    propsDef.set = function () {
        warn('$props是只读的')
    }
    Object.defineProperty(GVue.prototype, '$data', dataDef)
    Object.defineProperty(GVue.prototype, '$props', propsDef)

    GVue.prototype.$set = set
    GVue.prototype.$delete = del
}

export function proxy(target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key]
    }
    sharedPropertyDefinition.set = function proxySetter(val) {
        this[sourceKey][key] = val
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
}

export function initState(vm, options) {
    let opt = vm.$options
    if (opt.data) {
        initData(vm, options.data)
    } else {
        observe(vm._data = {})
    }

    if (opt.props) {
        initProps(vm, options.props)
    }

    if (opt.methods) {
        initMethods(vm, options.methods)
    }

    if (opt.computed) {
        initComputed(vm, options.computed)
    }
}

function initData(vm, data) {
    if (typeof data === 'function') {
        data = vm._data = data.call(vm)
        let props = vm.$options
        Object.keys(data).forEach(key => {
            if (hasOwn(props, key)) {
                console.warn(`data上的${key},已经在props上定义过了`)
            } else {
                proxy(vm, '_data', key)
            }
        })
        observe(data)
    } else {
        console.warn('data必须是函数，且返回一个{}')
    }
}

function initProps(vm, propsOptions) {
    const propsData = vm.$options.propsData || {}
    const props = vm._props = {}
    const keys = vm.$options._propKeys = []
    const isRoot = !vm.$parent
    if (!isRoot) { //非根组件的话，props的值就不需要响应式了，因为已经在父组件设置过，或者是静态量
        toggleObserving(false)
    }
    for (const key in propsOptions) {
        keys.push(key)
        const value = validateProp(key, propsOptions, propsData, vm)
        defineReactive(props, key, value)
        if (!(key in vm)) {
            proxy(vm, `_props`, key)
        }
    }

    toggleObserving(true)
}

function initMethods(vm, methods) {
    const props = vm.$options.props
    for (const key in methods) {
        if (typeof methods[key] !== 'function') {
            warn(`methods上属性${key}需定义成function`)
        }
        if (props && hasOwn(props, key)) {
            warn(`methods上属性名${key}和props上重复`)
        }
        if ((key in vm) && isReserved(key)) {
            warn(`方法上属性${key}，不能以_或$开头`)
        }
        vm[key] = typeof methods[key] !== 'function' ? noop : methods[key].bind(vm)
    }
}

function initComputed(vm, computed) {
    const watchers = vm._computedWatchers = Object.create(null)
    for (const key in computed) {
        const getter = computed[key]
        if (typeof getter === 'function') {
            watchers[key] = new Watcher(
                vm,
                getter,
                noop,
                computedWatcherOptions
            )
        } else {
            console.warn(`computed上属性${key}不是function`)
            continue
        }
        if (!(key in vm)) {
            defineComputed(vm, key, getter)
        } else {
            if (key in vm.$data) {
                warn(`computed 属性 "${key}" 已经在data上定义过了.`)
            } else if (vm.$options.props && key in vm.$options.props) {
                warn(`computed 属性 "${key}" 已经在props上定义过了.`)
            }
        }
    }
}

export function defineComputed(target, key, userDef) {
    sharedPropertyDefinition.get = createComputedGetter(key)
    sharedPropertyDefinition.set = function () {
        warn(`computed属性不允许修改`)
    }
    Object.defineProperty(target, key, sharedPropertyDefinition)
}

function createComputedGetter(key) {
    return function computedGetter() {
        const watcher = this._computedWatchers && this._computedWatchers[key]
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate()
            }
            if (Dep.target) {
                watcher.depend()
            }
            return watcher.value
        }
    }
}

