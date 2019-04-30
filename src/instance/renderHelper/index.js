/* @flow */

import {toNumber, toString, looseEqual, looseIndexOf} from '../../util'
import {createTextVNode, createEmptyVNode} from '../../vdom/vnode'
import {renderList} from './render-list'
import {renderSlot} from './render-slot'
import {resolveFilter} from './resolve-filter'
import {checkKeyCodes} from './check-keycodes'
import {bindObjectProps} from './bind-object-props'
import {renderStatic, markOnce} from './render-static'
import {bindObjectListeners} from './bind-object-listeners'
import {resolveScopedSlots} from './resolve-slots'
import {createElement} from '../../vdom/create-element'

export function installRenderHelpers(target) {
    target._o = markOnce // 处理v-once,使用v-once的标签，后续跟新会被视为静态节点处理，不会动态渲染
    target._n = toNumber // 处理num
    target._s = toString // 转换成字符串
    target._l = renderList // 处理v-for
    target._t = renderSlot // 处理<slot>
    target._q = looseEqual // 判断两个值是否相等，如果是object则遍历Key,判断value是否相同，如果是array,则对比每个元素是否相等
    target._i = looseIndexOf // 找到传入值在array的位置，类似就是indexOf的功能，但内部使用looseEqual判断相等
    target._m = renderStatic //处理静态
    target._f = resolveFilter //解析filter
    target._k = checkKeyCodes
    target._b = bindObjectProps //处理props,
    target._v = createTextVNode //创建文本vnode
    target._e = createEmptyVNode //创建空vnode
    target._u = resolveScopedSlots //解析作用域插槽
    target._g = bindObjectListeners //处理event
}
