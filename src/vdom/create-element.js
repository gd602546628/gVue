/* @flow */


import VNode, {createEmptyVNode} from './vnode'
import {createComponent} from './create-component'
import {traverse} from '../observer/traverse'

import {
    warn,
    isDef,
    isUndef,
    isTrue,
    isObject,
    isPrimitive,
    resolveAsset,
    no
} from '../util/index'

import {
    normalizeChildren,
    simpleNormalizeChildren
} from './helpers/index'

const config = {
    getTagNamespace: no,
    isReservedTag: no,
    parsePlatformTagName: no
}
const SIMPLE_NORMALIZE = 1
const ALWAYS_NORMALIZE = 2

/**
 *  createElement阶段 ，创建vnode,对于component,会生成特殊vnode，添加componentInstance:VueComponent[vue子类],componentOptions:{Ctor, propsData, listeners, tag, children}
 *
 * */
export function createElement(
    context,
    tag,
    data,
    children,
    normalizationType,
    alwaysNormalize
) {
    if (Array.isArray(data) || isPrimitive(data)) {
        normalizationType = children
        children = data
        data = undefined
    }
    if (isTrue(alwaysNormalize)) {
        normalizationType = ALWAYS_NORMALIZE
    }
    return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement(
    context,
    tag,
    data,
    children,
    normalizationType
) {
    if (isDef(data) && isDef(data.__ob__)) {
        warn(
            `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
            'Always create fresh vnode data objects in each render!',
            context
        )
        return createEmptyVNode()
    }
    // object syntax in v-bind
    if (isDef(data) && isDef(data.is)) {
        tag = data.is
    }
    if (!tag) {
        // in case of component :is set to falsy value
        return createEmptyVNode()
    }

    // support single function children as default scoped slot
    if (Array.isArray(children) &&
        typeof children[0] === 'function'
    ) {
        data = data || {}
        data.scopedSlots = {default: children[0]}
        children.length = 0
    }
    if (normalizationType === ALWAYS_NORMALIZE) {
        children = normalizeChildren(children)
    } else if (normalizationType === SIMPLE_NORMALIZE) {
        children = simpleNormalizeChildren(children)
    }
    let vnode, ns
    if (typeof tag === 'string') {
        let Ctor
        ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
        if (config.isReservedTag(tag)) {
            // platform built-in elements
            vnode = new VNode(
                config.parsePlatformTagName(tag), data, children,
                undefined, undefined, context
            )
        } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
            // component
            vnode = createComponent(Ctor, data, context, children, tag)
        } else {
            // unknown or unlisted namespaced elements
            // check at runtime because it may get assigned a namespace when its
            // parent normalizes children
            vnode = new VNode(
                tag, data, children,
                undefined, undefined, context
            )
        }
    } else {
        // direct component options / constructor
        vnode = createComponent(tag, data, context, children)
    }
    if (Array.isArray(vnode)) {
        return vnode
    } else if (isDef(vnode)) {
        if (isDef(ns)) applyNS(vnode, ns)
        if (isDef(data)) registerDeepBindings(data)
        return vnode
    } else {
        return createEmptyVNode()
    }
}

function applyNS(vnode, ns, force) {
    vnode.ns = ns
    if (vnode.tag === 'foreignObject') {
        // use default namespace inside foreignObject
        ns = undefined
        force = true
    }
    if (isDef(vnode.children)) {
        for (let i = 0, l = vnode.children.length; i < l; i++) {
            const child = vnode.children[i]
            if (isDef(child.tag) && (
                isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
                applyNS(child, ns, force)
            }
        }
    }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings(data) {
    if (isObject(data.style)) {
        traverse(data.style)
    }
    if (isObject(data.class)) {
        traverse(data.class)
    }
}
