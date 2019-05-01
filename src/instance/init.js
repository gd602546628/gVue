import {initState} from './state'
import {initLifecycle} from './lifecycle'
import {initEvents} from './event'
import {initRender} from './render'
import {mergeOptions} from './options'
import {extend} from '../util'
let uid = 0

export function initMixin(GVue) {

    GVue.prototype._init = function (options) {
        const vm = this
        vm.$options = options
        vm._isVue = true
        vm._uid = uid++
        vm._renderProxy = vm
        vm._self = vm
        if (options && options._isComponent) {
            initInternalComponent(vm, options)
        }else{
            vm.$options = mergeOptions(
                resolveConstructorOptions(vm.constructor),
                options || {},
                vm
            )
        }
        initLifecycle(vm)
        initEvents(vm)
        initState(vm, options)
        initRender(vm)

        if (options.el) {
            this.$mount(options.el)
        }

    }
}

export function initInternalComponent (vm, options) {
    const opts = vm.$options = Object.create(vm.constructor.options)
    // doing this because it's faster than dynamic enumeration.
    const parentVnode = options._parentVnode
    opts.parent = options.parent
    opts._parentVnode = parentVnode

    const vnodeComponentOptions = parentVnode.componentOptions
    opts.propsData = vnodeComponentOptions.propsData
    opts._parentListeners = vnodeComponentOptions.listeners
    opts._renderChildren = vnodeComponentOptions.children
    opts._componentTag = vnodeComponentOptions.tag

    if (options.render) {
        opts.render = options.render
        opts.staticRenderFns = options.staticRenderFns
    }
}

export function resolveConstructorOptions (Ctor) {
    let options = Ctor.options
    if (Ctor.super) { //子组件
        const superOptions = resolveConstructorOptions(Ctor.super)
        const cachedSuperOptions = Ctor.superOptions
        if (superOptions !== cachedSuperOptions) {
            // super option changed,
            // need to resolve new options.
            Ctor.superOptions = superOptions
            // check if there are any late-modified/attached options (#4976)
            const modifiedOptions = resolveModifiedOptions(Ctor)
            // update base extend options
            if (modifiedOptions) {
                extend(Ctor.extendOptions, modifiedOptions)
            }
            options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
            if (options.name) {
                options.components[options.name] = Ctor
            }
        }
    }
    return options
}
