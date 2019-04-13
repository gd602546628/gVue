import he from 'he'
import {cached, no, extend, camelize} from '../../util'
import {parseHtml} from './html-parser'
import {getAndRemoveAttr, getBindingAttr, addAttr, addHandler, addProp, addDirective} from './helper'
import {parseFilters} from './filter-parser'
import {genAssignmentCode} from './directives/model'
import {preTransformNode} from './transforms/preTransformNode'
import {transformNodeClass, transformNodeStyle} from './transforms/transformNode'
import {parseText} from "./text-parser";
// 匹配 @ 或 v-on: 开头的字符串
export const onRE = /^@|^v-on:/
// 匹配 v- 或 @ 或 : 开头的字符串，
export const dirRE = /^v-|^@|^:/
//  匹配v-for,v-in ,并捕获 属性值
export const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
// 匹配  forAliasRE  捕获的字符串
export const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/

// 匹配左右括号
const stripParensRE = /^\(|\)$/g
//  匹配指令中的参数
const argRE = /:(.*)$/

// 匹配 : 或字符串 v-bind: 开头的字符串
export const bindRE = /^:|^v-bind:/

// 匹配修饰符
const modifierRE = /\.[^.]+/g

// 具有缓存功能的html解码器
const decodeHTMLCached = cached(he.decode)

let delimiters
let transforms
let preTransforms
let postTransforms
let platformIsPreTag
let platformMustUseProp
let platformGetTagNamespace

export function createASTElement(tag, attrs, parent) {
    return {
        type: 1,
        tag: tag,
        attrsList: attrs,
        attrsMap: makeAttrsMap(attrs),
        parent: parent,
        children: []
    }
}

export function parse(template, options) {
    const stack = [] // 开始标签栈
    let root //根元素
    let currentParent //当前父元素
    let inVPre = false
    let inPre = false

    transforms = options.transformNode || [transformNodeClass, transformNodeStyle] //中置处理
    preTransforms = options.preTransformNode || [preTransformNode] //前置处理
    postTransforms = options.postTransformNode || [] //后置处理

    platformIsPreTag = options.isPreTag || no
    platformMustUseProp = options.mustUseProp || no
    platformGetTagNamespace = options.getTagNamespace || no

    delimiters=options.delimiters

    const preserveWhitespace = options.preserveWhitespace !== false
    parseHtml(template, {
        start(tag, attrs, unary) {
            let element = createASTElement(tag, attrs, currentParent)


            if (isForbiddenTag(element)) {
                element.forbidden = true
                console.warn('你的模板中不应该包含该标签：' + tag)
            }

            for (let i = 0; i < preTransforms.length; i++) {//前置处理
                element = preTransforms[i](element, options) || element
            }

            if (!inVPre) {
                if (getAndRemoveAttr(element, 'v-pre') != null) { //当前元素有 v-pre指令
                    element.pre = true
                }
                if (element.pre) {
                    inVPre = true
                }
            }

            if (platformIsPreTag(element.tag)) { // 当前标签是否是 <pre>
                inPre = true
            }

            if (inVPre) {
                processRawAttrs(element)
            } else if (!element.processed) { // 没有使用 v-pre 且在前置处理中没被处理过
                // 结构化 指令处理
                processFor(element)
                processIf(element)

                processElement(element,options)
            }


            if (!root) { //没有根元素
                root = element
                checkRootConstraints(element)
            } else if (!stack.length) { //开始标签栈空
                if (root.if && (element.elseif || element.else)) { //非一个根元素，判断是否相应使用，v-if v-else v-else-if
                    checkRootConstraints(element)
                    addIfCondition(root, {
                        exp: element.elseif,
                        block: element
                    })

                } else {// 开始标签栈空了 并且根元素没有v-if,或者当前标签没有 v-elseif或者 没有v-else
                    console.warn('template应该只有一个根元素')
                }
            }

            if (currentParent && !element.forbidden) {
                if (element.elseif || element.else) { // 使用v-else  v-else-if的元素不会被当成父元素的子元素，而是入到相应使用v-if元素的 ifConditions中
                    processIfConditions(element, currentParent)
                } else if (element.slotScope) {
                    currentParent.plain = false
                    const name = element.slotTarget || '"default"'
                    currentParent.scopedSlots = currentParent.scopedSlots || {}
                    currentParent.scopedSlots[name] = element
                } else {
                    currentParent.children.push(element)
                    element.parent = currentParent
                }
            }

            if (!unary) {
                currentParent = element
                stack.push(element)
            } else {
                closeElement(element)
            }

        },
        end() {
            const element = stack[stack.length - 1]
            const lastNode = element.children[element.children.length - 1]
            if (lastNode && lastNode.type === 3 && lastNode.text === ' ' && !inPre) { //清除结束标签前的空白
                element.children.pop()
            }
            // 出栈
            stack.length -= 1
            currentParent = stack[stack.length - 1]
            closeElement(element)
        },
        chars(text) {
            if (!currentParent) {
                if (text === template) {
                    console.warn(`template需要一个根元素，而不是纯字符串`)
                } else if (text = text.trim()) {
                    console.warn(`根元素外部字符串将被忽略`)
                }
            }

            const children = currentParent.children
            text = inPre || text.trim()
                // 非纯文本标签 则进行解码
                ? isTextTag(currentParent) ? text : decodeHTMLCached(text)
               // text是空格  则根据选项处理 是否保留不存在于开始标签之后的空格
                : preserveWhitespace && children.length ? ' ' : ''

            if (text) {
                let res
                if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
                    children.push({
                        type: 2,
                        expression: res.expression,
                        tokens: res.tokens,
                        text
                    })
                } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
                    children.push({
                        type: 3,
                        text
                    })
                }
            }

        }
    })

    return root

    function checkRootConstraints(el) {
        if (el.tag === 'slot' || el.tag === 'template') {
            console.warn(`不能使用${el.tag}作为根元素`)
        }
        if (el.attrsMap.hasOwnProperty('v-for')) {
            console.warn(`不能在${el.tag}上使用v-for指令`)
        }
    }

    function closeElement(element) {
        // check pre state
        if (element.pre) {
            inVPre = false
        }
        if (platformIsPreTag(element.tag)) {
            inPre = false
        }
        // apply post-transforms
        for (let i = 0; i < postTransforms.length; i++) {
            postTransforms[i](element, options)
        }
    }
}

function isTextTag (el) {
    return el.tag === 'script' || el.tag === 'style'
}

export function addIfCondition(el, condition) {
    if (!el.ifConditions) {
        el.ifConditions = []
    }
    el.ifConditions.push(condition)
}

function makeAttrsMap(attrs) {
    const map = {}
    for (let i = 0, l = attrs.length; i < l; i++) {
        if (map[attrs[i].name]) {
            console.warn('重复设置了属性：' + map[attrs[i].name])
        }
        map[attrs[i].name] = attrs[i].value
    }
    return map
}

function isForbiddenTag(el) {
    return (
        el.tag === 'style' ||
        (el.tag === 'script' && (
            !el.attrsMap.type ||
            el.attrsMap.type === 'text/javascript'
        ))
    )
}

function processIfConditions(el, parent) {
    const prev = findPrevElement(parent.children)
    if (prev && prev.if) {
        addIfCondition(prev, {
            exp: el.elseif,
            block: el
        })
    } else {
        console.warn(`非法使用${el.elseif ? 'v-else-if' : 'v-else'}`)
    }
}

function findPrevElement(children) {
    let i = children.length
    while (i--) {
        if (children[i].type === 1) {
            return children[i]
        } else {
            if (children[i].text !== ' ') {
                console.log(`v-if and v-else(-if)中间的文本会被忽略`)
            }
            children.pop()
        }
    }
}

function processRawAttrs(el) { // 使用 v-pre 的元素，会被添加attrs属性
    const l = el.attrsList.length
    if (l) {
        const attrs = el.attrs = new Array(l)
        for (let i = 0; i < l; i++) {
            attrs[i] = {
                name: el.attrsList[i].name,
                value: JSON.stringify(el.attrsList[i].value)
            }
        }
    } else if (!el.pre) {
        // non root node in pre blocks with no attributes
        el.plain = true
    }
}

export function processFor(el) {
    let exp
    if ((exp = getAndRemoveAttr(el, 'v-for'))) {
        const res = parseFor(exp)
        if (res) {
            extend(el, res)
        } else {
            console.warn(`非法的v-for表达式：${exp}`)
        }
    }
}


function parseFor(exp) {
    // 例 ：exp= '(item,index) in list'
    const inMatch = exp.match(forAliasRE) // 匹配 exp
    if (!inMatch) return
    const res = {}
    res.for = inMatch[2].trim() // 遍历目标名 ，list
    const alias = inMatch[1].trim().replace(stripParensRE, '')
    const iteratorMatch = alias.match(forIteratorRE)
    if (iteratorMatch) {
        res.alias = alias.replace(forIteratorRE, '').trim() // 别名，item
        res.iterator1 = iteratorMatch[1].trim() // index 或者 key
        if (iteratorMatch[2]) { //  index
            res.iterator2 = iteratorMatch[2].trim()
        }
    } else {
        res.alias = alias
    }
    return res
}


function processIf(el) {
    const exp = getAndRemoveAttr(el, 'v-if')
    if (exp) {
        el.if = exp
        addIfCondition(el, {
            exp: exp,
            block: el
        })
    } else {
        if (getAndRemoveAttr(el, 'v-else') != null) {
            el.else = true
        }
        const elseif = getAndRemoveAttr(el, 'v-else-if')
        if (elseif) {
            el.elseif = elseif
        }
    }
}

function processKey(el) {
    const exp = getBindingAttr(el, 'key')
    if (exp) {
        if (el.tag === 'template') {
            console.warn('<template>标签上使用key,无效')
        }
        el.key = exp
    }
}

function checkInFor(el) {
    let parent = el
    while (parent) {
        if (parent.for !== undefined) {
            return true
        }
        parent = parent.parent
    }
    return false
}

function processRef(el) {
    const ref = getBindingAttr(el, 'ref')
    if (ref) {
        el.ref = ref
        el.refInfor = checkInFor(el)
    }
}

function processSlot(el) {
    if (el.tag === 'slot') {
        el.slotName = getBindingAttr(el, 'name')
    } else {
        let slotScope
        if (el.tag === 'template') {
            slotScope = getAndRemoveAttr(el, 'scope')
            el.slotScope = slotScope || getAndRemoveAttr(el, 'slot-scope')
        } else if ((slotScope = getAndRemoveAttr(el, 'slot-scope'))) {
            if (el.attrsMap['v-for']) {
                console.warn(`${el.tag}上同时存在 slot-scope和 v-for, 由于v-for 有更高的优先级，请使用<template>包裹作用域插槽，避免歧义`)
            }
            el.slotScope = slotScope
        }
        const slotTarget = getBindingAttr(el, 'slot')
        if (slotTarget) {
            el.slotTarget = slotTarget === '""' ? '"default"' : slotTarget
            if (el.tag !== 'template' && !el.slotScope) {
                addAttr(el, 'slot', slotTarget)
            }
        }
    }
}

function processComponent(el) {
    let binding
    if ((binding = getBindingAttr(el, 'is'))) {
        el.component = binding
    }
    if (getAndRemoveAttr(el, 'inline-template') != null) {
        el.inlineTemplate = true
    }
}

function parseModifiers(name) {
    const match = name.match(modifierRE)
    if (match) {
        const ret = {}
        match.forEach(m => {
            ret[m.slice(1)] = true
        })
        return ret
    }
}

function processAttrs(el) {
    const list = el.attrsList
    let i, l, name, rawName, value, modifiers, isProp
    for (i = 0, l = list.length; i < l; i++) {
        name = rawName = list[i].name
        value = list[i].value
        if (dirRE.test(name)) {

            el.hasBindings = true

            modifiers = parseModifiers(name) //修饰符
            if (modifiers) {
                name = name.replace(modifierRE, '')
            }
            if (bindRE.test(name)) { // v-bind
                name = name.replace(bindRE, '')
                value = parseFilters(value)
                isProp = false
                if (value.trim().length === 0) {
                    console.warn(`v-bind:${name} 值为空`)
                }
                if (modifiers) {
                    if (modifiers.prop) {
                        isProp = true
                        name = camelize(name)
                        if (name === 'innerHtml') name = 'innerHTML'
                    }
                    if (modifiers.camel) {
                        name = camelize(name)
                    }
                    if (modifiers.sync) {
                        addHandler(
                            el,
                            `update:${camelize(name)}`,
                            genAssignmentCode(value, `$event`)
                        )
                    }
                }
                if (isProp || (!el.component && platformMustUseProp(el.tag, el.attrsMap.type, name))) {
                    addProp(el, name, value)
                } else {
                    addAttr(el, name, value)
                }
            } else if (onRE.test(name)) { // v-on
                name = name.replace(onRE, '')
                addHandler(el, name, value, modifiers, false, warn)
            } else { // 其他指令和自定义指令
                name = name.replace(dirRE, '')
                // parse arg
                const argMatch = name.match(argRE)
                const arg = argMatch && argMatch[1]
                if (arg) { //处理指令参数
                    name = name.slice(0, -(arg.length + 1))
                }
                addDirective(el, name, rawName, value, arg, modifiers)
                if (name === 'model') { // 检查v-model是否在 v-for环境中并且是否满足规范
                    checkForAliasModel(el, value)
                }
            }
        } else {

            addAttr(el, name, JSON.stringify(value)) //静态属性处理

            if (!el.component && name === 'muted' && platformMustUseProp(el.tag, el.attrsMap.type, name)) { //DOM原生属性处理
                addProp(el, name, 'true')
            }
        }
    }
}

function checkForAliasModel(el, value) {
    let _el = el
    while (_el) {
        if (_el.for && _el.alias === value) {
            console.warn(`<${el.tag} v-model="${value}">: v-model绑定了上级v-for中的别名，这种行为是无效的，建议v-model绑定一个对象的属性`)
        }
        _el = _el.parent
    }
}

export function processElement(el, options) {
    processKey(el)
    el.plain = !el.key && !el.attrsList.length

    processRef(el)
    processSlot(el)
    processComponent(el)

    for (let i = 0; i < transforms.length; i++) {
        el = transforms[i](el, options) || el
    }

    processAttrs(el)
}