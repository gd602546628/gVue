import {initMixin} from './init'
import {eventsMixin} from './event'
import {stateMixin} from './state'
import {lifecycleMixin, mountComponent} from './lifecycle'
import {renderMixin} from './render'
import compiler from '../compiler/index'
import {createPatchFunction} from '../vdom/patch'
import modules from './modules'
import * as nodeOps from './node-ops'

function GVue(options) {
    if (!(this instanceof GVue)) {
        console.warn('GVue 是一个构造函数，请使用new关键字实例化')
    }
    options._base = GVue
    this._init(options)
}

initMixin(GVue)
stateMixin(GVue)
eventsMixin(GVue)
lifecycleMixin(GVue)
renderMixin(GVue)


GVue.prototype.__patch__ = createPatchFunction({modules, nodeOps})

GVue.prototype.$mount = function (el, hydrating) {
    const options = this.$options

    el = document.querySelector(el)
    if (!options.render) {
        let template = el ? el.outerHTML : options.template
        if (!template) {
            console.warn('缺少el选项或template')
            return
        }
        const {ast, render, staticRenderFns} = compiler(template, options)
        options.render = new Function(render)
        options.staticRenderFns = staticRenderFns
        console.log(ast)
        console.log(render)
        console.log(options.render.call(this))
    }
    mountComponent(this, el, hydrating)

}
export default GVue