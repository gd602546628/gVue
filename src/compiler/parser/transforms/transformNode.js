
import { parseText } from '../text-parser'
import { parseStyleText } from '../../../util'
import {
    getAndRemoveAttr,
    getBindingAttr,
} from '../helper'

export function transformNodeStyle (el, options) {
    const staticStyle = getAndRemoveAttr(el, 'style')
    if (staticStyle) {
        const res = parseText(staticStyle, options.delimiters)
        if (res) {
            console.warn(`静态style,不能使用字面量，请使用 :style`)
        }
        el.staticStyle = JSON.stringify(parseStyleText(staticStyle))
    }

    const styleBinding = getBindingAttr(el, 'style', false /* getStatic */)
    if (styleBinding) {
        el.styleBinding = styleBinding
    }
}

export function transformNodeClass (el, options) {
    const staticClass = getAndRemoveAttr(el, 'class')
    const res = parseText(staticClass, options.delimiters)
    if (res) {
        console.warn(`静态class不能使用字面量，请使用:class`)
    }
    if (staticClass) {
        el.staticClass = JSON.stringify(staticClass)
    }
    const classBinding = getBindingAttr(el, 'class', false /* getStatic */)
    if (classBinding) {
        el.classBinding = classBinding
    }
}

export function genDataClass (el){
    let data = ''
    if (el.staticClass) {
        data += `staticClass:${el.staticClass},`
    }
    if (el.classBinding) {
        data += `class:${el.classBinding},`
    }
    return data
}

export function genStyleData (el){
    let data = ''
    if (el.staticStyle) {
        data += `staticStyle:${el.staticStyle},`
    }
    if (el.styleBinding) {
        data += `style:(${el.styleBinding}),`
    }
    return data
}