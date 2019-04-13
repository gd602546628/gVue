import {makeMap} from '../../util'


// 匹配属性
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>\/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/

//不带，冒号标签名
const ncname = '[a-zA-Z_][\\w\\-\\.]*'

//带冒号标签名
const qnameCapture = `((?:${ncname}\\:)?${ncname})`

// 匹配开始标签，不包含结束 即 <div  ,捕获组为 标签名
const startTagOpen = new RegExp(`^<${qnameCapture}`)

// 匹配开始标的结束部分 即 >  />，捕获组为 /
const startTagClose = /^\s*(\/?)>/

// 匹配结束标签 ，捕获组为 标签名
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`)

//这个正则用来匹配文档的 DOCTYPE 标签，没有捕获组
const doctype = /^<!DOCTYPE [^>]+>/i


//匹配注释节点，没有捕获组。
const comment = /^<!\--/

//匹配条件注释节点，没有捕获组
const conditionalComment = /^<!\[/

// 是否是纯文本标签
export const isPlainTextElement = makeMap('script,style,textarea', true)
const reCache = {}
const encodedAttr = /&(?:lt|gt|quot|amp);/g
const encodedAttrWithNewLines = /&(?:lt|gt|quot|amp|#10|#9);/g
const decodingMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&amp;': '&',
    '&#10;': '\n',
    '&#9;': '\t'
}

function decodeAttr(value, shouldDecodeNewlines) {
    const re = shouldDecodeNewlines ? encodedAttrWithNewLines : encodedAttr
    return value.replace(re, match => decodingMap[match])
}

const isUnaryTag = makeMap( // 自闭和标签
    'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
    'link,meta,param,source,track,wbr'
);

const canBeLeftOpenTag = makeMap( // 可以省略闭合标签
    'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
);


export function parseHtml(html, options) {
    let index = 0 // 当前处理字符的index
    let last //剩余的字符串
    let lastTag //最后一个标签
    let stack = []
    const expectHTML = options.expectHTML || true
    while (html) {
        last = html
        if (!lastTag || !isPlainTextElement(lastTag)) { //非纯文本标签
            let textEnd = html.indexOf('<')

            if (textEnd === 0) {

                if (comment.test(html)) { //注释文本
                    const commentEnd = html.indexOf('-->')
                    if (commentEnd >= 0) {
                        console.log('编译器暂不处理注释')
                        advance(commentEnd + 3)
                        continue
                    }
                }

                if (conditionalComment.test(html)) { // 判断注释
                    const conditionalEnd = html.indexOf(']>')

                    if (conditionalEnd >= 0) {
                        console.log('编译器暂不处理判断注释')
                        advance(conditionalEnd + 2)
                        continue
                    }
                }

                const doctypeMatch = html.match(doctype)
                if (doctypeMatch) { // Doctype
                    console.log('编译器暂不处理Doctype')
                    advance(doctypeMatch[0].length)
                    continue
                }

                const endTagMatch = html.match(endTag)
                if (endTagMatch) {
                    let currentIndex = index
                    advance(endTagMatch[0].length)
                    parseEndTag(endTagMatch[1], currentIndex, index)
                    continue
                }

                const startTagMatch = parseStartTag()
                if (startTagMatch) {
                    handleStartTag(startTagMatch)
                    continue
                }
            }

            let rest, next, text
            if (textEnd >= 0) {
                /*
                例
                * d<sds<d<div>
                * */
                rest = html.slice(textEnd)
                while ( //知道找到下一个 <是以下四种情况，即d<sds<d 当做纯字符串处理
                !endTag.test(rest) && //不是结束标签
                !startTagOpen.test(rest) && //不是开始标签
                !comment.test(rest) && //不是注释
                !conditionalComment.test(rest) //不是判断注释
                    ) {
                    next = rest.indexOf('<', 1)
                    if (next < 0) break
                    textEnd += next
                    rest = html.slice(textEnd)
                }
                text = html.substring(0, textEnd)
            }

            if (textEnd < 0) {
                text = html
            }

            if (text) {
                advance(text.length)
            }
            if (options.chars && text) {
                options.chars(text, index - text.length, index)
            }
        } else { //纯文本标签
            let endTagLength = 0
            const stackedTag = lastTag.toLowerCase()
            const reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'))
            const rest = html.replace(reStackedTag, function (all, text, endTag) {
                endTagLength = endTag.length
                if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                    text = text
                        .replace(/<!\--([\s\S]*?)-->/g, '$1')
                        .replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1')
                }

                if (options.chars) {
                    options.chars(text)
                }
                return ''
            })
            index += html.length - rest.length
            html = rest
            parseEndTag(stackedTag, index - endTagLength, index)
        }


        if (html === last) {
            options.chars && options.chars(html)
            console.warn(`非法开始标签: "${html}"`, {start: index + html.length})
            break
        }
    }

    parseEndTag()

    function parseEndTag(tagName, start, end) {
        let pos = -1
        let lowerCasedTagName
        start = start || index
        end = end || index

        if (tagName) {

            lowerCasedTagName = tagName.toLowerCase()
            for (pos = stack.length - 1; pos >= 0; pos--) {
                if (stack[pos].tag.toLowerCase() === lowerCasedTagName) {
                    break
                }
            }
        } else {
            pos = 0
        }

        if (pos >= 0) { // 没传入tagName，或者开始标签栈中有和当前关闭标签同类型标签

            for (let i = stack.length - 1; i >= pos; i--) {
                if (i > pos || !tagName) { // 栈中存在比pos大的元素
                    console.warn('标签：' + stack[i].tag + '未闭合', `start:${stack[i].start}`, `end:${stack[i].end}`)
                }
                if (options.end) {
                    options.end(stack[i].tag, stack[i].start, stack[i].end)
                }
            }
            stack.length = pos
            lastTag = pos && stack[pos - 1].tag
        } else if (lowerCasedTagName === 'br') {// stack没有对应开始标签，且该结束标签是</br>，将其当做开始标签处理,处理为<br>
            if (options.start) {
                options.start(tagName, [], true, start, end)
            }
        } else if (lowerCasedTagName === 'p') {// stack没有对应开始标签，且该结束标签是</p>，将其当做开始标签处理,处理为<p></p>
            if (options.start) {
                options.start(tagName, [], false, start, end)
            }
            if (options.end) {
                options.end(tagName, start, end)
            }
        }
    }

    function parseStartTag() {
        let start = html.match(startTagOpen)
        if (start) {
            let match = {
                tagName: start[1],
                attrs: [],
                start: index
            }
            advance(start[0].length)
            let end, attr
            while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                advance(attr[0].length)
                match.attrs.push(attr)
            }
            if (end) {
                console.log(end)
                advance(end[0].length)
                match.end = index
                match.unarySlash = end[1] // 一元标签<br/>，这里有值，二元标签 <div></div>这里没值
                return match
            }
            if (start && !end) {
                console.warn('非法标签：' + start[0] + '  会被编译器忽略')
            }
        }
    }

    function handleStartTag(match) {
        const tagName = match.tagName
        const unarySlash = match.unarySlash

        if (expectHTML) {
            if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
                parseEndTag(lastTag)
            }
            if (canBeLeftOpenTag(tagName) && lastTag === tagName) {
                parseEndTag(tagName)
            }
        }

        const unary = isUnaryTag(tagName) || !!unarySlash

        const l = match.attrs.length
        const attrs = new Array(l)
        for (let i = 0; i < l; i++) {
            const args = match.attrs[i]
            const value = args[3] || args[4] || args[5] || ''
            const shouldDecodeNewlines = tagName === 'a' && args[1] === 'href'
            attrs[i] = {
                name: args[1],
                value: decodeAttr(value, shouldDecodeNewlines)
            }
        }

        if (!unary) {
            stack.push({tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs})
            lastTag = tagName
        }

        if (options.start) {
            options.start(tagName, attrs, unary, match.start, match.end)
        }
    }

    function advance(n) {
        index += n
        html = html.substring(n)
    }

}