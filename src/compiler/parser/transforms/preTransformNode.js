import {
    addRawAttr,
    getBindingAttr,
    getAndRemoveAttr
} from '../helper'

import {
    processFor,
    processElement,
    addIfCondition,
    createASTElement
} from '../parser'

export function preTransformNode (el, options) {
    if (el.tag === 'input') { //将带有v-model指令的input 标签处理成三个input,使用v-if v-else控制
        const map = el.attrsMap
        if (!map['v-model']) {
            return
        }

        let typeBinding
        if (map[':type'] || map['v-bind:type']) {
            typeBinding = getBindingAttr(el, 'type')
        }
        if (!map.type && !typeBinding && map['v-bind']) {
            typeBinding = `(${map['v-bind']}).type`
        }

        if (typeBinding) { // input 的type 是由 :type v-bind:type 绑定的情况
            const ifCondition = getAndRemoveAttr(el, 'v-if', true)
            const ifConditionExtra = ifCondition ? `&&(${ifCondition})` : ``
            const hasElse = getAndRemoveAttr(el, 'v-else', true) != null
            const elseIfCondition = getAndRemoveAttr(el, 'v-else-if', true)
            // 1. checkbox
            const branch0 = cloneASTElement(el)
            // process for on the main node
            processFor(branch0)
            addRawAttr(branch0, 'type', 'checkbox')
            processElement(branch0, options)
            branch0.processed = true // prevent it from double-processed
            branch0.if = `(${typeBinding})==='checkbox'` + ifConditionExtra
            addIfCondition(branch0, {
                exp: branch0.if,
                block: branch0
            })
            // 2. add radio else-if condition
            const branch1 = cloneASTElement(el)
            getAndRemoveAttr(branch1, 'v-for', true)
            addRawAttr(branch1, 'type', 'radio')
            processElement(branch1, options)
            addIfCondition(branch0, {
                exp: `(${typeBinding})==='radio'` + ifConditionExtra,
                block: branch1
            })
            // 3. other
            const branch2 = cloneASTElement(el)
            getAndRemoveAttr(branch2, 'v-for', true)
            addRawAttr(branch2, ':type', typeBinding)
            processElement(branch2, options)
            addIfCondition(branch0, {
                exp: ifCondition,
                block: branch2
            })

            if (hasElse) {
                branch0.else = true
            } else if (elseIfCondition) {
                branch0.elseif = elseIfCondition
            }

            return branch0
        }
    }
}

function cloneASTElement (el) {
    return createASTElement(el.tag, el.attrsList.slice(), el.parent)
}

export default {
    preTransformNode
}