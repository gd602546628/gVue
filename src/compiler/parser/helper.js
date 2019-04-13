export const emptyObject = Object.freeze({})
export function getAndRemoveAttr(el, name, removeFromMap = false) {
    let val
    if ((val = el.attrsMap[name]) !== null) {
        const list = el.attrsList
        for (let i = 0; i < list.length; i++) {
            if (list[i].name === name) {
                list.splice(i, 1)
                break
            }
        }
    }

    if (removeFromMap) {
        delete el.attrsMap[name]
    }
    return val
}

export function getBindingAttr(el, name, getStatic) {
    const dynamicValue =
        getAndRemoveAttr(el, ':' + name) ||
        getAndRemoveAttr(el, 'v-bind:' + name)
    if (dynamicValue != null) {
        /*TODO: 处理filter*/
        return dynamicValue
    } else if (getStatic !== false) {
        const staticValue = getAndRemoveAttr(el, name)
        if (staticValue != null) {
            return JSON.stringify(staticValue)
        }
    }
}

export function addAttr (el, name, value) {
    (el.attrs || (el.attrs = [])).push({ name, value })
    el.plain = false
}
export function addProp (el, name, value) {
    (el.props || (el.props = [])).push({ name, value })
    el.plain = false
}

export function addDirective (
    el,
    name,
    rawName,
    value,
    arg,
    modifiers
) {
    (el.directives || (el.directives = [])).push({ name, rawName, value, arg, modifiers })
    el.plain = false
}

export function addRawAttr (el, name, value) {
    el.attrsMap[name] = value
    el.attrsList.push({ name, value })
}

export function addHandler (
    el,
    name,
    value,
    modifiers,
    important,
) {
    modifiers = modifiers || emptyObject
    if (modifiers.prevent && modifiers.passive) {
        console.warn(
         `passive 修饰符不能和 prevent 修饰符一起使用`
        )
    }

    if (name === 'click') {
        if (modifiers.right) { //规范化click.right
            name = 'contextmenu'
            delete modifiers.right
        } else if (modifiers.middle) {
            name = 'mouseup'
        }
    }

    if (modifiers.capture) {
        delete modifiers.capture
        name = '!' + name
    }
    if (modifiers.once) {
        delete modifiers.once
        name = '~' + name
    }
    if (modifiers.passive) {
        delete modifiers.passive
        name = '&' + name
    }

    let events
    if (modifiers.native) {
        delete modifiers.native
        events = el.nativeEvents || (el.nativeEvents = {})
    } else {
        events = el.events || (el.events = {})
    }

    const newHandler = {
        value: value.trim()
    }
    if (modifiers !== emptyObject) {
        newHandler.modifiers = modifiers
    }

    const handlers = events[name]

    if (Array.isArray(handlers)) {
        important ? handlers.unshift(newHandler) : handlers.push(newHandler)
    } else if (handlers) {
        events[name] = important ? [newHandler, handlers] : [handlers, newHandler]
    } else {
        events[name] = newHandler
    }

    el.plain = false
}