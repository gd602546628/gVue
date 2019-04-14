import {generate} from './codegen'
import {parse} from './parser'

export default function (template, options) {
    let ast = parse(template, options)
    let code = generate(ast, options)

    return{
        ast,
        render:code.render,
        staticRenderFns: code.staticRenderFns
    }
}