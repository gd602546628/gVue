;(function defineVu(global, factory) {
    //初始化Vu
    var Vu = factory(global);
    if (typeof exports === 'object' && exports && typeof exports.nodeName !== 'string') {
        global.$Vu = Vu;
        module.exports = Vu; // CommonJS
    } else {
        global.$Vu = Vu;
    }
})(window, function (global, undefined) {
    'use strict';
    // 创建一个不可添加属性的对象
    var emptyObject = Object.freeze({});

    // 匹配出dom字串中的所有属性 class="test"
    var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
    var ncname = '[a-zA-Z_][\\w\\-\\.]*';
    var qnameCapture = "((?:" + ncname + "\\:)?" + ncname + ")";
    // 匹配出dom字串中开头的标签名 <div></div>中的<div
    var startTagOpen = new RegExp(("^<" + qnameCapture));
    // 匹配出dom字符串的结尾 <img/>中的/>
    var startTagClose = /^\s*(\/?)>/;
    // 匹配结束标签 <div></div>中的</div>
    var endTag = new RegExp(("^<\\/" + qnameCapture + "[^>]*>"));
    // 匹配DOCTYPE标签 <!DOCTYPE html>
    var doctype = /^<!DOCTYPE [^>]+>/i;
    // 匹配注释注释开头 <!--
    var comment = /^<!--/;
    // 匹配<![
    var conditionalComment = /^<!\[/;

    // 段落元素
    var isNonPhrasingTag = makeMap(
        'address,article,aside,base,blockquote,body,caption,col,colgroup,dd,' +
        'details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,' +
        'h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,legend,li,menuitem,meta,' +
        'optgroup,option,param,rp,rt,source,style,summary,tbody,td,tfoot,th,thead,' +
        'title,tr,track'
    );

    // 自闭合的元素，结尾不需要斜线
    // 如<link rel="stylesheet" href="a.css">
    var isUnaryTag = makeMap(
        'area,base,br,col,embed,frame,hr,img,input,isindex,keygen,' +
        'link,meta,param,source,track,wbr'
    );

    // 可忽略的自闭合元素
    var canBeLeftOpenTag = makeMap(
        'colgroup,dd,dt,li,options,p,td,tfoot,th,thead,tr,source'
    );

    // script,style,textarea标签
    var isPlainTextElement = makeMap('script,style,textarea', true);

    // 处理pre,textarea标签下有\n导致pre,textarea内容换号的bug
    var isIgnoreNewlineTag = makeMap('pre,textarea', true);
    var shouldIgnoreFirstNewline = function (tag, html) {
        return tag && isIgnoreNewlineTag(tag) && html[0] === '\n';
    };

    // 解决正则表达式bug
    var IS_REGEX_CAPTURING_BROKEN = false;
    'x'.replace(/x(.)?/g, function (m, g) {
        IS_REGEX_CAPTURING_BROKEN = g === '';
    });

    // 判断是不是html标签
    var isHTMLTag = makeMap(
        'html,body,base,head,link,meta,style,title,' +
        'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
        'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
        'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
        's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
        'embed,object,param,source,canvas,script,noscript,del,ins,' +
        'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
        'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
        'output,progress,select,textarea,' +
        'details,dialog,menu,menuitem,summary,' +
        'content,element,shadow,template,blockquote,iframe,tfoot'
    );

    // 是不是矢量标签
    var isSVG = makeMap(
        'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
        'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
        'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
        true
    );

    // 判断是否在浏览器中
    var inBrowser = typeof window !== 'undefined';
    // 获取浏浏览器userAgent
    var UA = inBrowser && window.navigator.userAgent.toLowerCase();
    // 通过userAgent判断是不是IE
    var isIE = UA && /msie|trident/.test(UA);
    // 通过userAgent判断是不是edge浏览器
    var isEdge = UA && UA.indexOf('edge/') > 0;
    // 是否是在Weex环境下
    var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
    // 获取weexPlatform信息
    var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
    // 通过userAgent判断是不是ios操作系统
    var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');

    var reCache = {};

    //解码器
    var decoder;
    var he = {
        //解码方法
        decode: function decode(html) {
            decoder = decoder || document.createElement('div');
            decoder.innerHTML = html;
            return decoder.textContent
        }
    };

    /**
     * 无操作方法：当将字符串当做代码执行时发生错误返回该无操作方法
     */
    function noop(a, b, c) {
    }

    /**
     * 非undefined或null
     * @param v
     * @return {boolean}
     */
    function isDef(v) {
        return v !== undefined && v !== null
    }

    /**
     * 还是trye
     * @param v
     * @return {boolean}
     */
    function isTrue(v) {
        return v === true
    }


    var _toString = Object.prototype.toString;

    /**
     * 校验是不是一个[object Object]类型
     */
    function isPlainObject(obj) {
        return _toString.call(obj) === '[object Object]';
    }

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    /**
     * 校验key是不是obj的属性名（不包含原型链）
     */
    function hasOwn(obj, key) {
        return hasOwnProperty.call(obj, key);
    }

    /**
     * 校验Ctor是不是一个native code
     */
    function isNative(Ctor) {
        return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
    }

    /**
     * 给obj添加key属性值位val
     * @param obj
     * @param key
     * @param val
     * @param enumerable
     */
    function def(obj, key, val, enumerable) {
        Object.defineProperty(obj, key, {
            value: val,//值
            enumerable: !!enumerable, //可枚举属性
            writable: true,//可写
            configurable: true//可被删除
        });
    }

    // 是否有__proto__原型实例属性
    var hasProto = '__proto__' in {};

    //缓存器将fn入参的执行结果缓存起来如
    // var cachefn = cached(function (add) {
    //     return add*2;
    // });
    // cachefn(2); //4  调用fn计算结果
    // cachefn(2); //4  因为fn入参在闭包缓存变量中有直接从缓存中去不需要重复计算
    function cached(fn) {
        var cache = Object.create(null);
        var cachedFn = function (str) {
            var hit = cache[str];
            return hit || (cache[str] = fn(str))
        };
        return cachedFn;
    }

    /**
     * 报错方法
     * @param msg
     */
    function baseWarn(msg) {
        console.error(("错误:" + msg));
    }


    /**
     * 将用逗号分开的自创装换为集合，返回用来判断传入字串是否属于该集合的方法
     * @param str               生成集合的字串
     * @param exceptsLowerCase  是否忽略大小写
     * @returns {Function}
     */
    function makeMap(str, exceptsLowerCase) {
        var map = Object.create(null);//创建原始对象
        var list = str.split(',');
        for (var i = 0, l = list.length; i < l; i++) {
            map[list[i]] = true;
        }
        return exceptsLowerCase
            ? function (val) {
                return map[val.toLowerCase()];
            }
            : function (val) {
                return map[val];
            }
    }

    /**
     * 通过数组创建属性集合(把元素的属性数组转为对象)
     * 将[{naem:'class',value:'test'}{id:'id',value:'id1'}]  ===>   {class:'test',id:'id1'}
     * @param attrs 属性数组
     * @returns {{}}
     */
    function makeAttrsMap(attrs) {
        var map = {};
        for (var i = 0, l = attrs.length; i < l; i++) {
            //是否是重复属性（IE和Edge忽略此判断）
            if (map[attrs[i].name] && !isIE && !isEdge) {
                console.log('重复的属性：' + attrs[i].name);
            }
            map[attrs[i].name] = attrs[i].value;
        }
        return map
    }

    /**
     * 给属性中的以下字符进行解码
     * @param value
     * @param shouldDecodeNewlines
     * @returns {void|*|string|XML}
     */
    var decodingMap = {
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&amp;': '&',
        '&#10;': '\n',
        '&#9;': '\t'
    };
    var encodedAttr = /&(?:lt|gt|quot|amp|#10|#9);/g;

    function decodeAttr(value) {
        return value.replace(encodedAttr, function (match) {
            return decodingMap[match];
        })
    }

    //========================================解决bug专区（开始）======================================

    /**
     * 解决IE下svg标签bug
     * @param tag
     * @returns {*}
     */
    var ieNSBug = /^xmlns:NS\d+/;
    var ieNSPrefix = /^NS\d+:/;

    function guardIESVGBug(attrs) {
        var res = [];
        for (var i = 0; i < attrs.length; i++) {
            var attr = attrs[i];
            if (!ieNSBug.test(attr.name)) {
                attr.name = attr.name.replace(ieNSPrefix, '');
                res.push(attr);
            }
        }
        return res
    }

    //========================================解决bug专区（结束）======================================


    /**
     * 创建抽象语法树AST对象的方法（虚拟dom）
     * @param tag       //标签名
     * @param attrs     //属性名
     * @param parent    //父节点
     * @param ns        //命名空间
     * @returns {{type: number, tag: *, attrsList: *, attrsMap: *, parent: *, children: Array}}
     */
    function createASTElement(tag, attrs, parent) {
        return {
            type: 1,                        //标签类型（1是element节点）
            tag: tag,                       //标签名
            attrsList: attrs,               //标签属性数组
            attrsMap: makeAttrsMap(attrs),  //标签属性集合
            parent: parent,                 //父AST对象（父节点）
            children: []                   //子AST对象数组（子节点集合）
        }
    }

    /**
     * 判断虚拟dom对象是不是style标签,或是没有type属性的script或时type='text/javascript'的script标签
     * <style></style>
     * <script></script>
     * <script type='text/javascript'></script>
     * @param el
     * @returns {boolean}
     */
    function isForbiddenTag(el) {
        return (el.tag === 'style' || (el.tag === 'script' && (!el.attrsMap.type || el.attrsMap.type === 'text/javascript')))
    }

    /**
     * 特殊处理svg标签和MathML标签的命名空间
     * @param tag
     * @returns {*}
     */
    var platformGetTagNamespace = function getTagNamespace(tag) {
        // 如果是矢量标签放回svg
        if (isSVG(tag)) {
            return 'svg'
        }
        // MathML只支持math作为root element
        if (tag === 'math') {
            return 'math'
        }
    };

    /**
     * 移除并返回虚拟dom中的指定属性
     * @param el                 虚拟dom
     * @param name               属性名
     * @param removeFromMap      是否从map中移除（虚拟属性中的dom有两个属性集合一个是attrsMap,一个是数组attrsList）
     * @returns {*}
     */
    function getAndRemoveAttr(el, name, removeFromMap) {
        var val;
        if ((val = el.attrsMap[name]) != null) {
            var list = el.attrsList;
            for (var i = 0, l = list.length; i < l; i++) {
                if (list[i].name === name) {
                    list.splice(i, 1);
                    break;
                }
            }
        }
        if (removeFromMap) {
            delete el.attrsMap[name];
        }
        return val
    }

    /**
     * 将_from中的属性（非原型链上）浅拷贝到to中
     * @param to
     * @param _from
     * @returns {*}
     */
    function extend(to, _from) {
        for (var key in _from) {
            to[key] = _from[key];
        }
        return to
    }

    //===========================for指令解析（开始）===========================
    // 匹配for指令中的in of关键字
    var forAliasRE = /(.*?)\s+(?:in|of)\s+(.*)/;
    // 用于替换开头的（和结尾的）
    var stripParensRE = /^\(|\)$/g;
    // 检测-for中的索引值
    var forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;

    /**
     * 解析for指令到虚拟dom对象中（增加for指令相关的属性）
     * @param el
     */
    function processFor(el) {
        var exp;
        if ((exp = getAndRemoveAttr(el, '-for'))) {
            var res = parseFor(exp);
            if (res) {
                // 将for指令解析出来的属性挂载到虚拟dom对象上
                // for:被循环对象（data）
                // alias：从被循环对象循环出来的（item，有该属性无iterator1，iterator2）
                // iterator1属性对应有索引的value（有该属性无alias）
                // iterator2属性对应有索引的key（有该属性无alias）
                extend(el, res);
            } else {
                baseWarn("无效的-for指令" + exp);
            }
        }
    }

    /**
     * 解析for指令详细方法
     * @param exp
     * @returns {{}}
     */
    function parseFor(exp) {
        // 匹配for指令中的in of关键字
        var inMatch = exp.match(forAliasRE);
        if (!inMatch) {
            return
        }
        // 结果对象
        var res = {};
        // -for='item in data'
        // for属性是被循环对象名（data）
        res.for = inMatch[2].trim();
        // alias是从被循环对象循环出来的（item）
        var alias = inMatch[1].trim().replace(stripParensRE, '');

        // -for="(value, key) in object"
        // 检索出索引值
        var iteratorMatch = alias.match(forIteratorRE);
        if (iteratorMatch) {
            // 存在索引值
            res.alias = alias.replace(forIteratorRE, '');
            // iterator1属性对应上面的value
            res.iterator1 = iteratorMatch[1].trim();
            if (iteratorMatch[2]) {
                // iterator2属性对应上面的key也就是索引值
                res.iterator2 = iteratorMatch[2].trim();
            }
        } else {
            // 如果没有索引值alias属性就对应item
            res.alias = alias;
        }
        return res
    }

    //===========================for指令解析（结束）===========================

    //===========================if指令解析（开始）============================
    /**
     * 解析if指令到虚拟dom对象中（增加if指令相关的属性）
     * if：-if指令中的内容
     * else：是否有-else指令
     * elseif：-else-if指令中的内容
     * @param el
     */
    function processIf(el) {
        // 获取虚拟dom是否有-if属性
        var exp = getAndRemoveAttr(el, '-if');
        if (exp) {
            el.if = exp;
            addIfCondition(el, {
                exp: exp,
                block: el
            });
        } else {
            // 获取虚拟dom是否有-else属性
            if (getAndRemoveAttr(el, '-else') != null) {
                el.else = true;
            }
            // 获取虚拟dom是否有-else-if属性
            var elseif = getAndRemoveAttr(el, '-else-if');
            if (elseif) {
                el.elseif = elseif;
            }
        }
    }

    /**
     * 在虚拟dom中添加if指令栈ifConditions属性
     * @param el
     * @param condition
     */
    function addIfCondition(el, condition) {
        if (!el.ifConditions) {
            el.ifConditions = [];
        }
        //将{exp:if指令中的内容,block:对应的虚拟dom}压栈
        el.ifConditions.push(condition);
    }

    /**
     * 查找el元素同级前一个元素是否有-if指令
     * @param el                含有else或elseif的元素
     * @param parent            含有else或elseif的元素的父元素
     */
    function processIfConditions(el, parent) {
        // 查找同级前一个vdom.type == 1的兄弟元素
        var prev = findPrevElement(parent.children);
        if (prev && prev.if) {
            //将当前元素的else或elseif表达式加入含-if指令的ifConditions栈中
            addIfCondition(prev, {
                exp: el.elseif,//如果是else指令该值为undefined
                block: el
            });
        } else {
            baseWarn("v-" + (el.elseif ? ('else-if="' + el.elseif + '"') : 'else') + "之前<" + (el.tag) + ">元素上没有 -if 指令");
        }
    }

    /**
     * 查找并返回children数组中从右向左第一个type===1的元素(忽略if和else或elseif之间的内容为空的text元素)
     * @param children
     * @return {*}
     */
    function findPrevElement(children) {
        var i = children.length;
        while (i--) {
            if (children[i].type === 1) {
                return children[i]
            } else {
                if (children[i].text !== ' ') {
                    // -if 和 else或elseif之间夹着一个有内容的非element元素
                    baseWarn("文本 \"" + (children[i].text.trim()) + "\" 出现在 -if 和 -else(-if)之间。");
                }
                //出栈
                children.pop();
            }
        }
    }

    //===========================if指令解析（结束）============================


    //===========================解析:或v-bind:指令中的表达式（开始）===========
    /**
     * 获取绑定的属性（如:key指令或bind:key指令）
     * @param el                虚拟dom
     * @param name              绑定的属性
     * @param getStatic         是否去属性中取（当属性!false时去属性中直接取name）
     * @return {*}
     */
    function getBindingAttr(el, name, getStatic) {
        // 获取虚拟dom中有没有:[name]之类的指令或是v-bind:[name]之类的指令
        var dynamicValue = getAndRemoveAttr(el, ':' + name) || getAndRemoveAttr(el, 'v-bind:' + name);
        if (dynamicValue != null) {
            return parseFilters(dynamicValue)
        } else if (getStatic !== false) {
            var staticValue = getAndRemoveAttr(el, name);
            if (staticValue != null) {
                //将静态属性值返回如"{"key":"zhangsan"}"
                return JSON.stringify(staticValue)
            }
        }
    }

    /**
     * 过滤器
     * @param exp 属性字符串（:key='test'中的test）
     * @return {*}
     */
    var validDivisionCharRE = /[\w).+\-_$\]]/;//匹配 A-Z a-z 0-9 _ ) . + - $ ]
    function parseFilters(exp) {
        // 是否有未闭合的单引号
        var inSingle = false;
        // 是否有未闭合的双引号
        var inDouble = false;
        // 是不是es6模板语法
        var inTemplateString = false;
        // 是否有未闭合的正则表达式
        var inRegex = false;
        // 未闭合的左大括号出现次数
        var curly = 0;
        // 未闭合的左中括号出现次数
        var square = 0;
        // 未闭合的左小括号出现次数
        var paren = 0;
        // |连接符右侧索引值（|连接符连接多个表达式）
        var lastFilterIndex = 0;
        var c,//当前字符
            prev,//上一个字符
            i,//当前字符索引值
            expression,//第一个表达式
            filters;//表达式栈

        for (i = 0; i < exp.length; i++) {
            prev = c;
            // 获取字符的 Unicode 编码
            c = exp.charCodeAt(i);
            if (inSingle) {
                //当前字符是'且上一个字符不是\转义符
                if (c === 0x27 && prev !== 0x5C) {
                    // 和上一个单引号形成闭合关系
                    inSingle = false;
                }
            } else if (inDouble) {
                //当前字符是"且上一个字符不是\转义符
                if (c === 0x22 && prev !== 0x5C) {
                    // 和上一个双引号形成闭合关系
                    inDouble = false;
                }
            } else if (inTemplateString) {
                //当前字符是`且上一个字符不是\转义符
                if (c === 0x60 && prev !== 0x5C) {
                    //es6模板语法形成闭合关系
                    inTemplateString = false;
                }
            } else if (inRegex) {
                //当前字符是/且上一个字符不是\转义符
                if (c === 0x2f && prev !== 0x5C) {
                    // 匹配正则表达式形成闭合关系
                    inRegex = false;
                }
            } else if (c === 0x7C && exp.charCodeAt(i + 1) !== 0x7C && exp.charCodeAt(i - 1) !== 0x7C && !curly && !square && !paren) {
                //当前字符是|且前后一个字符都不是| 并且不处于非闭合的([{中
                if (expression === undefined) {
                    // 下一个表达式的开始位置
                    lastFilterIndex = i + 1;
                    // 第一个表达式
                    expression = exp.slice(0, i).trim();
                } else {
                    // 将后续表达式入栈
                    pushFilter();
                }
            } else {
                switch (c) {
                    // " 匹配双引号
                    case 0x22:
                        inDouble = true;
                        break
                    // ' 匹配当引号
                    case 0x27:
                        inSingle = true;
                        break
                    // ` 匹配es6模板符号
                    case 0x60:
                        inTemplateString = true;
                        break
                    // ( 匹配左括号
                    case 0x28:
                        paren++;
                        break
                    // ) 匹配右括号
                    case 0x29:
                        paren--;
                        break
                    // [ 匹配左中括号
                    case 0x5B:
                        square++;
                        break
                    // ] 匹配右中括号
                    case 0x5D:
                        square--;
                        break
                    // { 匹配左花括号
                    case 0x7B:
                        curly++;
                        break
                    // } 匹配右花括号
                    case 0x7D:
                        curly--;
                        break
                }
                // 匹配正则表达式
                if (c === 0x2f) {
                    // 当前字符是/
                    var j = i - 1;//前一个字符索引
                    var p = (void 0);
                    // 查找字符/前第一个不是空格的字符
                    for (; j >= 0; j--) {
                        p = exp.charAt(j);
                        if (p !== ' ') {
                            // 字符/前第一个不是' '的字符
                            break
                        }
                    }
                    // 如果/前全是空格或者不是A-Z a-z 0-9 _ ) . + - $ ]字符
                    if (!p || !validDivisionCharRE.test(p)) {
                        inRegex = true;
                    }
                }
            }
        }

        if (expression === undefined) {
            // 就一个表达式
            expression = exp.slice(0, i).trim();
        } else if (lastFilterIndex !== 0) {
            // 多个表达式入栈最后一个表达式
            pushFilter();
        }

        // 将用|分割的表达式压入filters栈中
        function pushFilter() {
            // 将表达式压入filters栈中
            (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim());
            lastFilterIndex = i + 1;
        }

        // |分割的表达式栈
        if (filters) {
            // 如果有多个表达式
            for (i = 0; i < filters.length; i++) {
                expression = wrapFilter(expression, filters[i]);
            }
        }
        return expression
    }

    /**
     * 包装多个表达式（没看懂！！！）
     * @param exp
     * @param filter
     * @return {string}
     */
    function wrapFilter(exp, filter) {
        var i = filter.indexOf('(');
        if (i < 0) {
            return ("_f(\"" + filter + "\")(" + exp + ")")
        } else {
            var name = filter.slice(0, i);
            var args = filter.slice(i + 1);
            return ("_f(\"" + name + "\")(" + exp + "," + args)
        }
    }

    //===========================解析:表达式（结束）===========

    // mustache模板引擎的占位符
    var defaultTagRE = /\{\{((?:.|\n)+?)\}\}/g;

    // 带缓存的html解码器
    var decodeHTMLCached = cached(he.decode);

    /**
     * 处理文本中的mustache占位符
     * @param text
     * @return {{expression: string, tokens: Array}}
     */
    function parseText(text) {
        var tagRE = defaultTagRE;
        // 匹配是否出现{{}} mustache模板引擎的占位符
        if (!tagRE.test(text)) {
            return
        }
        // 解析出字串中占位符的值和静态值生成数组。如：
        // "{{test1}} staticTest {{test2}}" 解析后是 ["_s(test1)",""staticTest"","_s(test2)"]
        var tokens = [];
        // 解析出字串中占位符的值和静态值生成数组。如：
        // "{{test1}} staticTest {{test2}}" 解析后是 [{@binding: "message"},"staticTest",{@binding: "test2"}]
        var rawTokens = [];
        var lastIndex = tagRE.lastIndex = 0;
        var match, index, tokenValue;
        while ((match = tagRE.exec(text))) {
            // 循环匹配文本中的胡子占位符
            index = match.index;
            if (index > lastIndex) {
                // 两个mustache占位符之间的静态值
                rawTokens.push(tokenValue = text.slice(lastIndex, index));
                tokens.push(JSON.stringify(tokenValue));
            }
            // 解析mustache占位符中的表达式
            var exp = parseFilters(match[1].trim());
            tokens.push(("_s(" + exp + ")"));
            rawTokens.push({'@binding': exp});
            lastIndex = index + match[0].length;
        }
        if (lastIndex < text.length) {
            // mustache占位符之后的静态值
            rawTokens.push(tokenValue = text.slice(lastIndex));
            tokens.push(JSON.stringify(tokenValue));
        }
        return {
            expression: tokens.join('+'),
            tokens: rawTokens
        }
    }

    // 在解析ast时处理特殊指令数组transformNode处理class，transformNode$1处理style。如有其他可以增加
    var transforms = [transformNode, transformNode$1];
    // 处理静态的样式和类名
    var staticKeys = "staticClass,staticStyle";
    // 处理render方法字符串的时候transformNode处理:class和staticClass，genData$1处理:style和staticStyle。如有其他可以增加
    var dataGenFns = [genData, genData$1];

    /**
     * 拼接staticStyle和:style的字串（没看懂）
     * @param el
     * @return {string}
     */
    function genData$1(el) {
        var data = '';
        if (el.staticStyle) {
            data += "staticStyle:" + (el.staticStyle) + ",";
        }
        if (el.styleBinding) {
            data += "style:(" + (el.styleBinding) + "),";
        }
        return data
    }

    /**
     * 拼接staticClass和:class的字串
     * @param el            ast对象
     * @return {string}
     */
    function genData(el) {
        var data = '';
        if (el.staticClass) {
            //静态类的处理
            data += "staticClass:" + (el.staticClass) + ",";
        }
        if (el.classBinding) {
            //:class 处理绑定的class
            data += "class:" + (el.classBinding) + ",";
        }
        return data
    }

    /**
     * 处理静态类名和绑定类名。静态类名是不可变的bind类名是通过表达式生成的
     * @param el            vdom
     */
    function transformNode(el) {
        // 获取vdom的class属性
        var staticClass = getAndRemoveAttr(el, 'class');
        if (staticClass) {
            // 匹配静态类中占位符
            var res = parseText(staticClass);
            if (res) {
                baseWarn("class=\"" + staticClass + "\":请使用v-bind:或:来代替。例如：<div class=\"{{ val }}\">, 使用<div :class=\"val\">");
            }
        }
        if (staticClass) {
            // 设置vdom中的staticClass属性
            el.staticClass = JSON.stringify(staticClass);
        }
        // 获取vdom上的v-bind:class 或 :class
        var classBinding = getBindingAttr(el, 'class', false);
        if (classBinding) {
            // 解析v-bind:class 或者 :class 指令 添加classBinding属性
            el.classBinding = classBinding;
        }
    }

    /**
     * 处理静态style和v-bind:style或者:style。静态是不可变的bind是通过表达式生成的
     * @param el            vdom
     */
    function transformNode$1(el) {
        // 获取vdom的style属性
        var staticStyle = getAndRemoveAttr(el, 'style');
        if (staticStyle) {
            // 匹配静态样式中的占位符
            var res = parseText(staticStyle);
            if (res) {
                baseWarn("style=\"" + staticStyle + "\":请使用v-bind:或:来代替。例如：<div style=\"{{ val }}\">, 使用<div :style=\"val\">");
            }
            el.staticStyle = JSON.stringify(parseStyleText(staticStyle));
        }
        // 获取vdom上的v-bind:style 或 :style
        var styleBinding = getBindingAttr(el, 'style', false);
        if (styleBinding) {
            // 解析v-bind:style 或者 :style 指令 添加styleBinding属性
            el.styleBinding = styleBinding;
        }
    }

    function processKey(el) {
        var exp = getBindingAttr(el, 'key');
        if (exp) {
            if (el.tag === 'template') {
                baseWarn('<template>不能够添加keye');
            }
            el.key = exp;
        }
    }

    function addAttr(el, name, value) {
        (el.attrs || (el.attrs = [])).push({name: name, value: value});
        el.plain = false;
    }

    // 匹配属性名开头是否是v-或@或:
    var dirRE = /^v-|^@|^:/;
    // 匹配属性名开头是否是v-bind:或:
    var bindRE = /^:|^v-bind:/;

    /**
     * 处理属性
     * @param el            vdom
     */
    function processAttrs(el) {
        var list = el.attrsList;
        var i, l, name, rawName, value, modifiers, isProp;
        for (i = 0, l = list.length; i < l; i++) {
            // 属性名
            name = rawName = list[i].name;
            // 对应的值
            value = list[i].value;
            if (dirRE.test(name)) {
                // 属性名开头是否以v-或@或:开头
                el.hasBindings = true;
                if (bindRE.test(name)) {
                    // 处理v-bind或: 将 v-bind:goods => goods 或 :goods => goods
                    name = name.replace(bindRE, '');
                    value = parseFilters(value);
                    addAttr(el, name, value);
                }
            } else {
                // 其他属性直接添加到ast的attrs属性中
                addAttr(el, name, JSON.stringify(value));
            }
        }
    }

    /**
     * 处理vdom
     * @param element
     * @param options
     */
    function processElement(element) {
        processKey(element);
        for (var i = 0; i < transforms.length; i++) {
            // 调用transforms来处理style和class
            element = transforms[i](element) || element;
        }
        processAttrs(element);
    }

    /**
     * 判断是不是script标签或者style标签
     * @param el
     * @return {boolean}
     */
    function isTextTag(el) {
        return el.tag === 'script' || el.tag === 'style'
    }

    /**
     * 将html字符串解析为AST （将html解析为虚拟dom）
     */
    function praseHtml(html, options) {

        var stack = [];//保存还未找到闭合的元素的栈
        var expectHTML = options.expectHTML;
        var isUnaryTag$$1 = options.isUnaryTag || false;
        var canBeLeftOpenTag$$1 = options.canBeLeftOpenTag || false;
        var last;// 截取前剩余html字符串
        var index = 0;// 字符切割游标（当前字符是原字符串切割到了第几位留下的）
        var lastTag;// 上一个匹配到的标签,处理stack后会被重写复制lastTag永远指向栈顶元素
        while (html) {
            last = html;
            // 没有父标签 或 父标签不是script,style,textare特殊标签
            if (!lastTag || !isPlainTextElement(lastTag)) {
                var textEnd = html.indexOf('<');
                // 检查元素标签开始符前是否有其他文本
                if (textEnd === 0) {
                    // 匹配注释
                    if (comment.test(html)) {
                        var commentEnd = html.indexOf('-->');
                        if (commentEnd >= 0 && options.comment) {
                            //截取注释部分
                            // options.comment(html.substring(4, commentEnd));
                        }
                        // 将注释从html中剔除
                        advance(commentEnd + 3);
                        continue;
                    }

                    // 处理比如说<![CDATA["，结束于 "]]>这类标签
                    if (conditionalComment.test(html)) {
                        var conditionalEnd = html.indexOf(']>');
                        if (conditionalEnd >= 0) {
                            advance(conditionalEnd + 2);
                            continue;
                        }
                    }

                    // 处理DOCTYPE标签如 <!DOCTYPE html>
                    var doctypeMatch = html.match(doctype);
                    if (doctypeMatch) {
                        advance(doctypeMatch[0].length);
                        continue;
                    }

                    // 匹配结束标签 <div></div>中的</div>
                    var endTagMatch = html.match(endTag);
                    if (endTagMatch) {
                        var startIndex = index;
                        advance(endTagMatch[0].length);
                        parseEndTag(endTagMatch[1], startIndex, index);
                        continue;
                    }

                    // 标签开头
                    var startTagMatch = parseStartTag();
                    if (startTagMatch) {
                        // 根据匹配结果生成匹配节点的AST对象
                        handleStartTag(startTagMatch);
                        if (shouldIgnoreFirstNewline(lastTag, html)) {
                            // pre,textarea元素内第一个\n换行符,将换行符替换掉,
                            // 解决textarea,pre多空行bug
                            advance(1);
                        }
                        continue;
                    }
                }

                var text,//标签中的文本
                    rest,//切除除标签外的文本剩余
                    next;//文本中下一个<的索引用于检查<是否有用

                //处理html字串text标签中含有<的
                if (textEnd >= 0) {
                    rest = html.slice(textEnd);
                    while (!endTag.test(rest) && !startTagOpen.test(rest) && !comment.test(rest) && !conditionalComment.test(rest)) {
                        // <后没有任何标签 <得当做text标签处理
                        next = rest.indexOf('<', 1);
                        if (next < 0) {
                            // <之后没有<
                            break;
                        }
                        textEnd += next;
                        rest = html.slice(textEnd);
                    }
                    text = html.substring(0, textEnd);
                    advance(textEnd);
                }

                // 剩余文本中没找到<全部当做text标签处理
                if (textEnd < 0) {
                    text = html;
                    html = '';
                }

                //调用处理text标签的方法
                if (options.chars && text) {
                    options.chars(text);
                }
            } else {
                // 父标签是script,style,textare特殊标签
                var endTagLength = 0;
                var stackedTag = lastTag.toLowerCase();
                var reStackedTag = reCache[stackedTag] || (reCache[stackedTag] = new RegExp('([\\s\\S]*?)(</' + stackedTag + '[^>]*>)', 'i'));
                var rest$1 = html.replace(reStackedTag, function (all, text, endTag) {
                    endTagLength = endTag.length;
                    if (!isPlainTextElement(stackedTag) && stackedTag !== 'noscript') {
                        text = text.replace(/<!--([\s\S]*?)-->/g, '$1').replace(/<!\[CDATA\[([\s\S]*?)]]>/g, '$1');
                    }
                    if (shouldIgnoreFirstNewline(stackedTag, text)) {
                        text = text.slice(1);
                    }
                    if (options.chars) {
                        options.chars(text);
                    }
                    return ''
                });
                index += html.length - rest$1.length;
                html = rest$1;
                parseEndTag(stackedTag, index - endTagLength, index);
            }

            if (html === last) {
                // html是匹配后的 last是匹配前的 匹配前后数据没发生改变（死循环） 就当做text标签处理
                options.chars && options.chars(html);
                if (!stack.length && options.warn) {
                    baseWarn('格式化标签模板错误,匹配前后文本未变会造成死循环:' + html);
                }
                break;
            }
        }

        // 匹配结束调用一次清除stack中剩余的标签
        parseEndTag();

        //将匹配成功的html字串剔除
        function advance(n) {
            index += n;
            html = html.substring(n);
        }

        /**
         * 解析出元素标识(完整的标签开头)
         */
        function parseStartTag() {
            // 匹配节点的tag如<div></div>匹配开头的<div中的div
            var start = html.match(startTagOpen);
            if (start) {
                // 匹配结果对象
                var match = {
                    tagName: start[1], //标签名
                    attrs: [], // 属性数组
                    start: index // 标签字符串开始位置
                };
                // 截取匹配后的字符串
                advance(start[0].length);
                var end, attr;
                // startTagClose查询tag的关闭符号如<div></div>查找出<div>中的>
                // attribute查询所有属性如<div class='test'></div>查找出class='test'
                // 当匹配到标签的>时终止
                while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                    // 从html中剔除掉匹配到的属性
                    advance(attr[0].length);
                    match.attrs.push(attr);
                }
                if (end) {
                    // unarySlash为标签结束符>之前，属性之后的值如<div class='test' jiji></div> unarySlash就为jiji
                    match.unarySlash = end[1];
                    advance(end[0].length);
                    // end为标签的长度
                    match.end = index; //标签长度
                    return match
                }
            }
        }

        /**
         * 标签字串开头的生成AXT的方法
         * @param match 匹配结果
         */
        function handleStartTag(match) {
            var tagName = match.tagName;
            var unarySlash = match.unarySlash;
            if (expectHTML) {
                // 如果是段落元素
                if (lastTag === 'p' && isNonPhrasingTag(tagName)) {
                    //如果父元素是p元素并且子元素是一个段落元素
                    //用来处理以p父元素中包含段落元素如：
                    //<p><h1></h1><h2><h2></p> 会被解析为4个并列的元素(p,h1,h2,p)
                    parseEndTag(lastTag);
                }
                // 判断是不是可省略的闭合标签
                if (canBeLeftOpenTag$$1(tagName) && lastTag === tagName) {
                    // 用来处理连续出现的两个可忽略闭合元素如：
                    // <li><li>
                    parseEndTag(tagName);
                }
            }
            // 自闭合标签如img，link 判断如果是自闭合标签或者存在unarySlash返回true
            var unary = isUnaryTag$$1(tagName) || !!unarySlash;
            // 处理属性
            var l = match.attrs.length;
            var attrs = new Array(l);
            for (var i = 0; i < l; i++) {
                var args = match.attrs[i];
                // 处理正则表达式bug
                if (IS_REGEX_CAPTURING_BROKEN && args[0].indexOf('""') === -1) {
                    if (args[3] === '') {
                        delete args[3];
                    }
                    if (args[4] === '') {
                        delete args[4];
                    }
                    if (args[5] === '') {
                        delete args[5];
                    }
                }
                // 属性的值
                var value = args[3] || args[4] || args[5] || '';
                attrs[i] = {
                    name: args[1],//属性名
                    value: decodeAttr(value)//解码属性
                };
            }
            if (!unary) {
                //如果不是自闭合的标签往stack中压入已经检索完的AST对象
                //包含标签名，小写标签名，属性数组里面是{属性名，值}的对象
                stack.push({tag: tagName, lowerCasedTag: tagName.toLowerCase(), attrs: attrs});
                //设置上衣个标签名为该标签名
                lastTag = tagName;
            }
            if (options.start) {
                //解析出一个AST对象 调用start回调方法 入参（节点名，属性数组，是否自闭合，开始位置，标签长度）
                options.start(tagName, attrs, unary, match.start, match.end);
            }
        }

        /**
         * 解析标签结束
         * @param tagName
         * @param start
         * @param end
         */
        function parseEndTag(tagName, start, end) {

            // 从后向前查找stack中第一个能和结束标签tagName匹配的索引值
            var pos;
            // tagName转为全小写用于和stack中元素的lowerCasedTag属性比对
            var lowerCaseTagName;
            if (start == null) {
                start = index;
            }
            if (end == null) {
                end = index;
            }
            if (tagName) {
                lowerCaseTagName = tagName.toLowerCase();
                // 查找结束标签对应的stack中索引值
                for (pos = stack.length - 1; pos >= 0; pos--) {
                    if (stack[pos].lowerCasedTag === lowerCaseTagName) {
                        break;
                    }
                }
            } else {
                // 如果未传入结束标签名
                pos = 0;
            }

            if (pos >= 0) {
                // 在栈中找到了对应的闭合元素
                for (var i = stack.length - 1; i >= pos; i--) {
                    if (i > pos || !tagName) {
                        //没有匹配到结束标签
                        baseWarn("标签 <" + (stack[i].tag) + "> 没有结束标签。");
                    }
                    if (options.end) {
                        //执行查找到闭合元素的回调
                        options.end(stack[i].tag, start, end);
                    }
                }

                // 把保存还未闭合节点的栈中出栈已闭合的
                stack.length = pos;
                // 设置当前最后
                lastTag = pos && stack[pos - 1].tag;
            } else if (lowerCaseTagName === 'br') {
                // 没在如果匹配到的是</br> 特殊处理
                if (options.start) {
                    options.start(tagName, [], true, start, end);
                }
            } else if (lowerCaseTagName === 'p') {
                // 如果匹配到的是</p> 特殊处理
                if (options.start) {
                    options.start(tagName, [], false, start, end);
                }
                if (options.end) {
                    options.end(tagName, start, end);
                }
            }

        }
    }

    /**
     * 将html字串解析成AST也就是vdom
     * @param template                  html字符串
     * @return {*}                      根vdom对象
     */
    function parse(template) {
        // 未闭合元素栈
        var stack = [];
        // 文本是否保留空格
        var preserveWhitespace = true;
        // 根vdom
        var root;
        // 父AST对象（父虚拟节点）
        var currentParent;

        //转换AST的设置
        var options = {
            expectHTML: true,
            isUnaryTag: isUnaryTag,
            canBeLeftOpenTag: canBeLeftOpenTag,
            start: function start(tag, attrs, unary, start, end) {
                // console.log("匹配到标签开始 " + tag);
                // 参数：节点名，属性数组，是否自闭合，开始位置，标签长度
                // 校验命名空间 如果有父标签则将命名空间设置为父标签的命名空间如果
                // 没有父标签且标签是svg标签则将命名空间设置位svg,如果标签是MathML标签设置命名空间为math
                var ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag);

                // 特殊处理在IE下svg标签属性名的兼容bug
                if (isIE && ns === 'svg') {
                    attrs = guardIESVGBug(attrs);
                }

                // 创建AST对象(虚拟dom）
                var element = createASTElement(tag, attrs, currentParent);
                if (ns) {
                    element.ns = ns;
                }

                // 过滤模板中的script和style标签
                if (isForbiddenTag(element)) {
                    element.forbidden = true;
                    baseWarn('模板仅负责用来映射UI相关，请不要在模板中加入副作用的标签。如:<' + tag + '>,将不会被模板引擎解析');
                }

                if (!element.processed) {
                    // 如果该虚拟节点没有被处理过，处理其if for once指令
                    processFor(element);
                    processIf(element);
                    // 处理元素(处理class属性和style属性)
                    processElement(element);
                }

                // 校验根节点不能为slot，template和含有-for的元素
                function checkRootConstraints(el) {
                    if (el.tag === 'slot' || el.tag === 'template') {
                        baseWarn('不能使用<' + (el.tag) + '>做为根节点因为它可能包含多个节点');
                    }
                    if (el.attrsMap.hasOwnProperty('-for')) {
                        baseWarn('不能使用含有-for指令的节点做为根节点因为它会呈现多个元素');
                    }
                }

                if (!root) {
                    // 当前vdom是根节点
                    root = element;
                    // 校验根节点的合法性
                    checkRootConstraints(root);
                }
                else if (!stack.length) {
                    //没有未闭合的元素
                    if (root.if && (element.elseif || element.else)) {
                        // 根vdom有if指令 当前vdom有elseif指令或else指令 是根元素的同级元素并和根vdom的if指令形成对应
                        // 校验根节点的合法性
                        checkRootConstraints(element);
                        // 给根节点添加elseif表达式和表达式对应的vdom
                        addIfCondition(root, {
                            exp: element.elseif,
                            block: element
                        });
                    } else {
                        baseWarn('根节点中使用了-if指令但在和根节点同级的元素中未发现elseif或else指令');
                    }
                }

                if (currentParent && !element.forbidden) {
                    //如果当前vdom有父元素 且当前元素不是script和style标签
                    if (element.elseif || element.else) {
                        // 当前元素有else或者elseif指令（需要找到和当前vdom同级的含有-if的vdom将当前元素的else或elseif表达式加入ifConditions栈中）
                        processIfConditions(element, currentParent);
                    } else {
                        // 将当前vdom压入父vdom栈中
                        currentParent.children.push(element);
                        // 设置当前vdom的父vdom属性
                        element.parent = currentParent;
                    }
                }

                if (!unary) {
                    // 不是自闭和元素
                    currentParent = element;//当前元素为下一个vdom的父元素
                    stack.push(element);//将当前还未闭合的元素压栈
                }
            },
            end: function end() {
                // 匹配到一个元素结尾，就执行一次end回调
                // console.log("匹配到标签结束 " + arguments[0]);
                // 取出未闭合栈顶元素
                var element = stack[stack.length - 1];
                // 设置未闭合栈顶vdom的子元素中的最后一个vdom为lastNode
                var lastNode = element.children[element.children.length - 1];
                if (lastNode && lastNode.type === 3 && lastNode.text === ' ') {
                    // 如果lastNode 是一个text类型的vdom并内容为空 就移除该节点
                    element.children.pop();
                }
                // 未闭合元素出栈
                stack.length -= 1;//修改栈的长度
                currentParent = stack[stack.length - 1];//设置当前父元素为未闭合标签栈的栈顶元素
            },
            chars: function chars(text) {
                // 参数：text标签文本
                // 处理text标签匹配到text标签会回调 如果文本中含有模板占位符就创建一个2类型的vdom
                // 如果是一个纯文本就创建一个3类型的纯文本vdom
                // console.log("匹配到文本标签 " + text);
                if (!currentParent) {
                    //文本没有父元素
                    if (text === template) {
                        baseWarn("传入模板只是一个文本而不是一个根元素");
                    } else if ((text = text.trim())) {
                        baseWarn("text \"" + text + "\" 外部根元素将被忽略。");
                    }
                    return;
                }
                //解决IE下textarea标签placeholder属性中的内容被当做文本标签处理的bug
                if (isIE && currentParent.tag === 'textarea' && currentParent.attrsMap.placeholder === text) {
                    return
                }
                //父vdom的子vdom栈
                var children = currentParent.children;
                text = text.trim()
                    ? (isTextTag(currentParent) ? text : decodeHTMLCached(text))
                    : ((preserveWhitespace && children.length) ? ' ' : '');
                if (text) {
                    var res;
                    if (text !== ' ' && (res = parseText(text))) {
                        // 解析text为mustache占位符
                        children.push({
                            type: 2,//带mustache占位符的节点类型
                            expression: res.expression,
                            tokens: res.tokens,
                            text: text
                        });
                    } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
                        children.push({
                            type: 3,//纯文本的节点类型
                            text: text
                        });
                    }
                }
            },
            comment: function comment(text) {
                // 参数：注释内容 处理注释回调
                // console.log("匹配到注释 " + text);
                // 给父vdom插入一个注释vdom（文本节点）
                currentParent.children.push({
                    type: 3,
                    text: text,
                    isComment: true
                });
            }
        };

        praseHtml(template, options);

        //优化虚拟dom
        if (root) {
            // 处理vdom各个节点的static属性
            markStatic$1(root);
            // 增加静态根节点标志
            markStaticRoots(root, false);
        }
        // 返回虚拟dom的跟节点对象
        return root;
    }

    // 缓存处理后的处理静态属性的方法
    var genStaticKeysCached = cached(function genStaticKeys$1(keys) {
        // 判断vdom中的静态属性
        return makeMap(
            'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
            (keys ? ',' + keys : '')
        )
    });

    /**
     * 判断是不是保留标签
     * @param tag           vdom标签名
     * @return {*}
     */
    var isReservedTag = function (tag) {
        return isHTMLTag(tag) || isSVG(tag)
    };

    /**
     * 特殊处理svg标签和MathML标签的命名空间
     * @param tag
     * @returns {*}
     */
    function getTagNamespace(tag) {
        // 如果是矢量标签放回svg
        if (isSVG(tag)) {
            return 'svg'
        }
        // MathML只支持math作为root element
        if (tag === 'math') {
            return 'math'
        }
    }

    /**
     * 检测vdom中静态属性的方法
     */
    var isStaticKey = genStaticKeysCached(staticKeys || '');

    /**
     * 检测是否是slot,component标签
     * @type {Function}
     */
    var isBuiltInTag = makeMap('slot,component', true);

    /**
     * 判断vdom是不是静态的（静态节点指的是不需要做任何处理能直接映射成真实dom的）
     * @param node
     * @return {boolean}
     */
    function isStatic(node) {
        // 含有表达式text节点
        if (node.type === 2) {
            return false;
        }
        // 纯文本节点
        if (node.type === 3) {
            return true;
        }
        return !!(!node.hasBindings && //vdom中是否有除:class :style 之外的bind指令
            !node.if && !node.for && //vdom中是否有if for指令
            !isBuiltInTag(node.tag) &&//检测是否是slot,component标签
            isReservedTag(node.tag) && //判断是不是预留标签
            Object.keys(node).every(isStaticKey)); //判断vdom中的属性有没有不是静态属性的
    }

    /**
     * 给vdom中的各个节点增加是不是静态节点的static属性
     * @param node          vdom
     */
    function markStatic$1(node) {
        node.static = isStatic(node);
        if (node.type === 1) {
            if (!isReservedTag(node.tag)) {
                // 不是预留元素
                return;
            }
            for (var i = 0, l = node.children.length; i < l; i++) {
                // 遍历vdom的字节点设置 static属性
                var child = node.children[i];
                markStatic$1(child);
                if (!child.static) {
                    // 如果子节点中出现一个非静态节点那么父元素也是非静态的
                    node.static = false;
                }
            }
            if (node.ifConditions) {
                // 如果该vdom含有if else elseif 逻辑
                for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
                    // 判断if else(if)逻辑中对应的vdom是不是静态节点
                    var block = node.ifConditions[i$1].block;
                    markStatic$1(block);
                    if (!block.static) {
                        node.static = false;
                    }
                }
            }
        }
    }

    /**
     * 处理静态根节点
     * @param node
     * @param isInFor
     */
    function markStaticRoots(node, isInFor) {
        if (node.type === 1) {
            if (node.static) {
                //如果是静态vdom且有for指令改属性为其子节点staticInFor统统为true
                node.staticInFor = isInFor;
            }
            if (node.static && node.children.length && !(node.children.length === 1 && node.children[0].type === 3)) {
                // 节点是静态并且有子节点并且不是只有一个文本子节点
                node.staticRoot = true;
                return;
            } else {
                node.staticRoot = false;
            }
            if (node.children) {
                for (var i = 0, l = node.children.length; i < l; i++) {
                    markStaticRoots(node.children[i], isInFor || !!node.for);
                }
            }
            if (node.ifConditions) {
                for (var i$1 = 1, l$1 = node.ifConditions.length; i$1 < l$1; i$1++) {
                    markStaticRoots(node.ifConditions[i$1].block, isInFor);
                }
            }
        }
    }

    /**
     * CodegenState类
     * @param options
     * @constructor
     */
    function CodegenState(options) {
        this.options = options;
        this.warn = baseWarn;
        this.dataGenFns = dataGenFns;
        this.directives = {};
        var isReserved = isReservedTag;
        this.maybeComponent = function (el) {
            return !isReserved(el.tag);
        };
        this.onceId = 0;
        this.staticRenderFns = [];
    };

    /**
     * 处理静态根节点
     * @param el
     * @param state
     * @return {string}
     */
    function genStatic(el, state) {
        // 处理过静态根节点的标识
        el.staticProcessed = true;
        // 生成静态根节点处理的方法字串并压入state对象中
        // with方法的作用：with(obj)作用就是将后面的{}中的语句块中的缺省对象设置为obj，那么在其后面的{}语句块中引用obj的方法或属性时可以省略obj.的输入而直接使用方法或属性的名称。
        state.staticRenderFns.push(("with(this){return " + (genElement(el, state)) + "}"));
        // 静态根节点返回
        // _m()的执行字串
        return ("_m(" + (state.staticRenderFns.length - 1) + (el.staticInFor ? ',true' : '') + ")");
    }

    /**
     * 处理vdom中的for指令
     * @param el                含有for的vdom对象
     * @param state             CodegenState对象
     * @param altGen
     * @param altHelper
     * @return {string}
     */
    function genFor(el, state, altGen, altHelper) {
        // -for="(value, key) in object"
        // exp = object
        // iterator1 = value
        // iterator2 = key
        // -for="item in object"
        // exp = object
        // alias = item
        // 循环体
        var exp = el.for;
        // 循环出的item
        var alias = el.alias;
        // 迭代器存在返回',迭代器' 不存在返回''
        var iterator1 = el.iterator1 ? ("," + (el.iterator1)) : '';
        var iterator2 = el.iterator2 ? ("," + (el.iterator2)) : '';

        if (state.maybeComponent(el)) {
            //如果不是预留标签
            state.warn("<" + (el.tag) + " -for=\"" + alias + " in " + exp + "\">非预留标签中使用for。", true);
        }

        // 给vdom增加for指令处理过的标识
        el.forProcessed = true;
        // 如-for="(value, key) in object" 返回：
        // _l((object),function(undefined,value,key){retren vdom的剩余表达式})
        // _l()方法的执行字符串
        return (altHelper || '_l') + "((" + exp + ")," +
            "function(" + alias + iterator1 + iterator2 + "){" +
            "return " + ((altGen || genElement)(el, state)) +
            '})'
    }

    /**
     * 处理vdom中的if指令
     * @param el                含有if的vdom
     * @param state             CodegenState对象
     * @param altGen
     * @param altEmpty
     * @return {*}
     */
    function genIf(el, state, altGen, altEmpty) {
        // 处理过标识
        el.ifProcessed = true;
        return genIfConditions(el.ifConditions.slice(), state, altGen, altEmpty)
    }

    /**
     * 处理vdom中的IfConditions属性
     * @param conditions
     * @param state
     * @param altGen
     * @param altEmpty
     * @return {*}
     */
    function genIfConditions(conditions, state, altGen, altEmpty) {
        if (!conditions.length) {
            // 如果IfConditions属性为空数组
            return altEmpty || '_e()'
        }

        // 出栈栈底元素
        var condition = conditions.shift();
        if (condition.exp) {
            // -if='age>25' 返回
            // (age>25)?if对应vdom生成的表达式:else(if)对应vdom生成的表达式
            return ("(" + (condition.exp) + ")?" + (genTernaryExp(condition.block)) + ":" + (genIfConditions(conditions, state, altGen, altEmpty)))
        } else {
            return ("" + (genTernaryExp(condition.block)));
        }

        function genTernaryExp(el) {
            return altGen ? altGen(el, state) : (el.once ? genOnce(el, state) : genElement(el, state));
        }
    }

    /**
     * render方法中拼接原有属性
     * @param props
     * @returns {string}
     */
    function genProps(props) {
        var res = '';
        for (var i = 0; i < props.length; i++) {
            var prop = props[i];
            res += "\"" + (prop.name) + "\":" + (transformSpecialNewlines(prop.value)) + ",";
        }
        return res.slice(0, -1)
    }

    /**
     * 处理vdom上的其他属性
     * @param el
     * @param state
     * @return {string}
     */
    function genData$2(el, state) {
        var data = '{';
        // 处理key
        if (el.key) {
            data += "key:" + (el.key) + ",";
        }
        // 处理staticClass :class staticStyle :style生成相关表达式
        for (var i = 0; i < state.dataGenFns.length; i++) {
            data += state.dataGenFns[i](el);
        }
        // 处理属性
        if (el.attrs) {
            data += "attrs:{" + (genProps(el.attrs)) + "},";
        }
        data = data.replace(/,$/, '') + '}';
        return data
    }

    /**
     * 加工vdom子节点
     * @param el
     * @param state
     * @param checkSkip
     * @param altGenElement
     * @param altGenNode
     * @return {*}
     */
    function genChildren(el, state, checkSkip, altGenElement, altGenNode) {
        var children = el.children;
        if (children.length) {
            var el$1 = children[0];
            if (children.length === 1 && el$1.for) {
                // 子节点只有一个且有for指令
                return (altGenElement || genElement)(el$1, state)
            }
            //res == 2 有for 或者 if else(if)对应的vdom中有一个有for
            var normalizationType = checkSkip ? getNormalizationType(children) : 0;
            var gen = altGenNode || genNode;

            // [子节点1表达式,子节点2表达式...],2
            return ("[" + (children.map(function (c) {
                return gen(c, state);
            }).join(',')) + "]" + (normalizationType ? ("," + normalizationType) : ''))
        }
    }

    /**
     * 校验子节点类型
     * @param children          子节点数组
     * @return {number}
     */
    function getNormalizationType(children) {
        var res = 0;
        for (var i = 0; i < children.length; i++) {
            var el = children[i];
            if (el.type !== 1) {
                continue;
            }
            // 有for 或者 if else(if)对应的vdom中有一个有for
            if (el.for || (el.ifConditions && el.ifConditions.some(function (c) {
                return c.block.for !== undefined;
            }))) {
                res = 2;
                break;
            }
        }
        return res
    }

    /**
     * 处理节点
     * @param node
     * @param state
     * @return {*}
     */
    function genNode(node, state) {
        if (node.type === 1) {
            return genElement(node, state)
        } else {
            return genText(node)
        }
    }

    // 处理文本bug
    function transformSpecialNewlines(text) {
        return text.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
    }

    // 处理2,3类vdom
    function genText(text) {
        // 为2返回表达式_v(表达式) 为3返回_v(文本)
        return ("_v(" + (text.type === 2 ? text.expression : transformSpecialNewlines(JSON.stringify(text.text))) + ")")
    }

    /**
     * 生成vom对应的code
     * @param el
     * @param state
     * @return {*}
     */
    function genElement(el, state) {
        if (el.staticRoot && !el.staticProcessed) {
            // 处理静态根节点
            return genStatic(el, state)
        } else if (el.for && !el.forProcessed) {
            // 处理带有for指令的vdom
            return genFor(el, state)
        } else if (el.if && !el.ifProcessed) {
            // 处理带有if指令集的vdom
            return genIf(el, state)
        } else {
            // vdom节点的处理
            var code;
            var data = genData$2(el, state);
            var children = genChildren(el, state, true);
            // 返回 _c('标签名',{'staticClass':'','class':'','staticStyle':'','style':''},[子节点1表达式,子节点2表达式...](,2(2代表子节点中存在for指令)))
            code = "_c('" + (el.tag) + "'" + (data ? ("," + data) : '') + (children ? ("," + children) : '') + ")";
            return code;
        }
    };

    /**
     * 生成render方法
     * @param ast
     * @param options
     * @return {{render: string, staticRenderFns: Array}}
     */
    function generate(ast, options) {
        var state = new CodegenState(options);
        var code = ast ? genElement(ast, state) : '_c("div")';
        return {
            // render方法是在调用with方法
            render: ("with(this){return " + code + "}"),
            // 静态根节点渲染方法栈
            staticRenderFns: state.staticRenderFns
        }
    }

    /**
     * 编译模板生成vdom
     * @param template
     */
    function baseCompile(template, options) {
        // 将模板解析为vdom
        var ast = parse(template.trim());
        // 生成render方法
        var code = generate(ast, options);
        return {
            ast: ast, //vdom
            render: code.render,    //render方法表达式
            staticRenderFns: code.staticRenderFns   //静态根节点渲染方法栈
        }
    };


    /**
     * 将字符串当做代码执行
     * @param code          代码字串
     * @param errors        错误栈
     * @return {*}
     */
    function createFunction(code, errors) {
        try {
            // 返回代码字串的执行结果
            return new Function(code)
        } catch (err) {
            // 如果执行过程中发生错误将错误信息入栈
            errors.push({err: err, code: code});
            // 返回无操作方法
            return noop
        }
    }


    /**
     * 创建编译器对象编译器对象中有2个方法
     * compile方法：模板生成AST，render方法字串，静态节点方法字串栈
     * compileToFunctions方法：将compile方法生成的方法字串解析为可执行的方法
     * @return {{compile: compile, compileToFunctions: *}}
     */
    function createCompiler() {

        /**
         * 编译模板的方法
         * @param template
         * @param options
         * @return {{ast, render, staticRenderFns}|*}
         */
        function compile(template, options) {
            var compiled = baseCompile(template, options);
            return compiled;
        }

        /**
         * 创建将模板编译成方法的方法
         * @param compile 编译模板的方法
         * @return {compileToFunctions}
         */
        function createCompileToFunctionFn(compile) {

            // 缓存对象
            var cache = Object.create(null);

            return function compileToFunctions(template, options) {
                options = extend({}, options);

                try {
                    new Function('return 1');
                } catch (e) {
                    if (e.toString().match(/unsafe-eval|CSP/)) {
                        baseWarn('无法在该环境下工作,通过new Function()的方式来用字符串创建代码失败。');
                    }
                }

                // 缓存模板生成的render方法
                if (cache[template]) {
                    return cache[template]
                }

                // 调用编译模板的方法
                var compiled = compile(template, options);

                // 如果编译没有问题
                var res = {};
                var fnGenErrors = [];

                // 将vdom生成的render方法字串生成为可执行的render方法
                res.render = createFunction(compiled.render, fnGenErrors);

                // 将静态根节点栈中的方法生成为可执行的方法
                res.staticRenderFns = compiled.staticRenderFns.map(function (code) {
                    return createFunction(code, fnGenErrors)
                });

                // 生成的ast
                res.ast = compiled.ast;

                return (cache[template] = res);
            }
        }

        return {
            // 编译模板生成AST,render方法,静态树渲染方法
            compile: compile,
            // 将模板编译成方法的方法,当方法执行时返回可执行的render方法，AST，静态render方法
            compileToFunctions: createCompileToFunctionFn(compile)
        }
    }


    //==============================解析模板结束==================================

    //==============================虚拟节点部分==================================
    /**
     * 虚拟node对象
     * @param tag                   标签名
     * @param data                  数据（如staticClass Class）等
     * @param children              子vnode栈
     * @param text                  文本
     * @param elm
     * @param context               Vu组件上下文对象
     * @param componentOptions
     * @param asyncFactory
     * @constructor
     */
    var VNode = function VNode(tag, data, children, text, elm, context, componentOptions, asyncFactory) {
        // 标签名
        this.tag = tag;
        // 数据（如staticClass Class）等
        this.data = data;
        // 子vnode
        this.children = children;
        // 文本
        this.text = text;
        this.elm = elm;
        // 命名空间
        this.ns = undefined;
        // Vu组件上下文对象
        this.context = context;
        this.fnContext = undefined;
        this.fnOptions = undefined;
        this.fnScopeId = undefined;
        this.key = data && data.key;
        this.componentOptions = componentOptions;
        this.componentInstance = undefined;
        this.parent = undefined;
        this.raw = false;
        // 是不是静态节点
        this.isStatic = false;
        this.isRootInsert = true;
        // 是不是注释
        this.isComment = false;
        // 是不是克隆的
        this.isCloned = false;
        this.asyncFactory = asyncFactory;
        this.asyncMeta = undefined;
        // this.isAsyncPlaceholder = false;
    };
    //==============================虚拟节点结束==================================

    //=======================执行render方法依赖的方法==================================

    function isObject(obj) {
        return obj !== null && typeof obj === 'object'
    }

    /**
     * 执行render方法用到的所有方法
     * @param target
     */
    function installRenderHelpers(target) {
        target._n = toNumber;//处理number
        target._s = toString;//处理string
        target._l = renderList;//处理for循环
        target._q = looseEqual;//比较是否相等
        target._i = looseIndexOf;//检索数组中是否有值等于val
        target._m = renderStatic;//渲染静态节点
        target._v = createTextVNode;//创建纯文本vnode
        target._e = createEmptyVNode;//创建空vnode
    }

    /**
     * _n(val) 将val转换为number,如果不是number就返回val
     */
    function toNumber(val) {
        var n = parseFloat(val);
        return isNaN(n) ? val : n
    }

    /**
     * _s(val) 将val转换为string。null返回''，object返回缩进2个空格的object字串
     * @type {toString}
     * @private
     */
    function toString(val) {
        return val == null
            ? ''
            : typeof val === 'object'
                ? JSON.stringify(val, null, 2)
                : String(val)
    }

    /**
     * val是-for循环需要处理的指令
     * <span -for="item in test.test2">{{item.asd}}</span> 会被解析为
     * _l((test.test2),function(item){return _c('span',[_v(_s(item.asd))])})
     * @param val           待循环对象
     * @param render        循环执行的回调
     * @return {*}
     */
    function renderList(val, render) {
        var ret, i, l, keys, key;
        // 如果val是数组或者是字串
        if (Array.isArray(val) || typeof val === 'string') {
            ret = new Array(val.length);
            for (i = 0, l = val.length; i < l; i++) {
                ret[i] = render(val[i], i);
            }
        }
        // 如果val是number就是循环次数
        else if (typeof val === 'number') {
            ret = new Array(val);
            for (i = 0; i < val; i++) {
                // 执行回调入参 当前循环几次，真是循环计数器
                ret[i] = render(i + 1, i);
            }
        }
        // 如果val是对象就是循环对象的属性
        else if (isObject(val)) {
            keys = Object.keys(val);
            ret = new Array(keys.length);
            for (i = 0, l = keys.length; i < l; i++) {
                key = keys[i];
                // 执行回调入参 属性值，属性名，第几个属性
                ret[i] = render(val[key], key, i);
            }
        }
        if (isDef(ret)) {
            // 如果存在标注is vnode list标记
            (ret)._isVList = true;
        }
        // 返回创建的vnode数组
        return ret;
    }

    /**
     * 判断if或者if-else中的条件是否相等
     * @param a
     * @param b
     * @returns {*}
     */
    function looseEqual(a, b) {
        // 如果相等返回true
        if (a === b) {
            return true
        }
        var isObjectA = isObject(a);
        var isObjectB = isObject(b);
        // 如果a，b都是object类型
        if (isObjectA && isObjectB) {
            try {
                var isArrayA = Array.isArray(a);
                var isArrayB = Array.isArray(b);
                if (isArrayA && isArrayB) {
                    //如果a b都是数组
                    return a.length === b.length && a.every(function (e, i) {
                        return looseEqual(e, b[i])
                    })
                } else if (!isArrayA && !isArrayB) {
                    //如果a b都是对象
                    var keysA = Object.keys(a);
                    var keysB = Object.keys(b);
                    return keysA.length === keysB.length && keysA.every(function (key) {
                        return looseEqual(a[key], b[key])
                    })
                } else {
                    // 否则放回false
                    return false
                }
            } catch (e) {
                return false
            }
        } else if (!isObjectA && !isObjectB) {
            // a,b既不是object也不相等转为String比较 如 2 === '2' 转为字串后就相等
            return String(a) === String(b)
        } else {
            return false
        }
    }

    /**
     * 检索数组中是否有值等于val
     * @param arr           数组
     * @param val           比较值
     * @returns {number}    -1表示没有相等的 其他表示匹配的索引值
     */
    function looseIndexOf(arr, val) {
        for (var i = 0; i < arr.length; i++) {
            if (looseEqual(arr[i], val)) {
                return i
            }
        }
        return -1
    }

    /**
     * 渲染静态vnode
     * @param index         vm._staticTrees中的索引
     * @param isInFor       是否在for指令中
     * @returns {*}
     */
    function renderStatic(index, isInFor) {
        var cached = this._staticTrees || (this._staticTrees = []);
        var tree = cached[index];
        if (tree && !isInFor) {
            // 拷贝对应vm._staticTrees缓存中对应的静态vnode
            return Array.isArray(tree) ? cloneVNodes(tree) : cloneVNode(tree)
        }
        // 调用解析ast时生成的对应的staticRenderFns方法
        tree = cached[index] = this.$options.staticRenderFns[index].call(
            this,
            null,
            this
        );
        markStatic(tree, ("__static__" + index), false);
        return tree;
    }

    /**
     * 创建文本vnode
     * 如<div class="test">static</div>的render方法是_c('div',{staticClass:"test"},[_v("static")])
     * _v("static")标识的就是创建一个文本为static的纯文本vnode
     * @param val           值
     * @return {VNode}
     */
    function createTextVNode(val) {
        return new VNode(undefined, undefined, undefined, String(val))
    }

    /**
     * 创建一个空的vnode
     * <div class="test">
     *     <div -if="test">if</div>
     *     <div -else-if="test1">elseif</div>
     * </div>
     * 的render方法是：
     * _c('div',{staticClass:"test"},[(test)?_c('div',[_v("if")]):(test1)?_c('div',[_v("elseif")]):_e()])
     * 当if和else-if都不满足时执行_e()创建一个空的vnode
     * @param text
     * @return {VNode}
     */
    var createEmptyVNode = function (text) {
        if (text === void 0) text = '';
        var node = new VNode();
        node.text = text;
        node.isComment = true;
        return node
    };

    /**
     * 克隆vnode栈
     * @param vnodes    vnode数组
     * @param deep
     * @returns {Array}
     */
    function cloneVNodes(vnodes, deep) {
        var len = vnodes.length;
        var res = new Array(len);
        for (var i = 0; i < len; i++) {
            res[i] = cloneVNode(vnodes[i], deep);
        }
        return res
    }

    /**
     * 克隆vnode
     * @param vnode     需要克隆的vnode
     * @param deep      是否深度克隆（克隆子元素）
     * @returns {VNode}
     */
    function cloneVNode(vnode, deep) {
        // 组件选项
        var componentOptions = vnode.componentOptions;
        // 创建一个vnode实例
        var cloned = new VNode(
            vnode.tag,//标签名
            vnode.data,//对应的数据
            vnode.children,//子节点
            vnode.text,
            vnode.elm,
            vnode.context,
            componentOptions,
            vnode.asyncFactory
        );
        cloned.ns = vnode.ns;//命名空间
        cloned.isStatic = vnode.isStatic;//是否静态节点
        cloned.key = vnode.key;
        cloned.isComment = vnode.isComment;
        cloned.fnContext = vnode.fnContext;
        cloned.fnOptions = vnode.fnOptions;
        cloned.fnScopeId = vnode.fnScopeId;
        cloned.isCloned = true;
        if (deep) {
            // 深度克隆（克隆子元素）
            if (vnode.children) {
                cloned.children = cloneVNodes(vnode.children, true);
            }
            if (componentOptions && componentOptions.children) {
                componentOptions.children = cloneVNodes(componentOptions.children, true);
            }
        }
        return cloned
    };

    function markStatic(tree, key, isOnce) {
        if (Array.isArray(tree)) {
            for (var i = 0; i < tree.length; i++) {
                if (tree[i] && typeof tree[i] !== 'string') {
                    markStaticNode(tree[i], (key + "_" + i), isOnce);
                }
            }
        } else {
            markStaticNode(tree, key, isOnce);
        }
    }

    function markStaticNode(node, key, isOnce) {
        node.isStatic = true;
        node.key = key;
        node.isOnce = isOnce;
    }


    //=======================执行render方法依赖的方法(结束)==================================


    /**
     * 钩子方法，调用vm中的hook方法
     * @param vm        上下文
     * @param hook      方法名
     */
    function callHook(vm, hook) {
        var handlers = vm.$options[hook];
        if (handlers) {
            for (var i = 0, j = handlers.length; i < j; i++) {
                try {
                    handlers[i].call(vm);
                } catch (e) {
                    baseWarn('hook方法调用' + hook + '生命周期方法出错：' + e);
                }
            }
        }
    }

    /**
     * 是不是原始数据类型
     * @param value
     * @return {boolean}
     */
    function isPrimitive(value) {
        return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'symbol' ||
            typeof value === 'boolean'
        )
    }


    var uid$2 = 0;

    //==========================创建vnode的方法==================================
    var SIMPLE_NORMALIZE = 1;
    var ALWAYS_NORMALIZE = 2;

    function createElement(context, tag, data, children, normalizationType, alwaysNormalize) {
        if (Array.isArray(data) || isPrimitive(data)) {
            //如果
            normalizationType = children;
            children = data;
            data = undefined;
        }
        if (alwaysNormalize === true) {
            normalizationType = ALWAYS_NORMALIZE;
        }
        return _createElement(context, tag, data, children, normalizationType);
    }


    // target._n = toNumber;//处理number
    // target._s = toString;//处理string
    // target._l = renderList;//处理for循环
    // target._q = looseEqual;//比较是否相等
    // target._i = looseIndexOf;//检索数组中是否有值等于val
    // target._m = renderStatic;//渲染静态节点
    // target._v = createTextVNode;//创建纯文本vnode
    // target._e = createEmptyVNode;//创建空vnode
    // _c(
    //     //tagname
    //     'div',
    //     //data
    //     {
    //         staticClass: "test",
    //         class: message
    //     },
    //     //children
    //     [
    //         // 处理for循环(循环test.test2值来执行回调方法创建span)
    //         _l(
    //             (test.test2),
    //             function (item) {
    //                 return _c(
    //                     // tagname
    //                     'span',
    //                     // data
    //                     {},
    //                     // chirdren
    //                     [_v(_s(item.asd))]
    //                 );
    //             }
    //         ),
    //         // 创建纯文本vnode
    //         _v(" "),
    //         // 处理if else-if
    //         // if(test)
    //         (test) ?
    //             // 创建一个div 子节点是一个纯文本内容是if
    //             _c('div', {}, [_v("if")]) :
    //             // else if(test1)
    //             (test1) ?
    //                 // 创建一个div 子节点是一个纯文本内容是elseif
    //                 _c('div', {}, [_v("elseif")]) :
    //                 // else 穿件一个空vnode
    //                 _e()
    //     ],
    //     // 有for 或者 if else(if)中有for
    //     2
    // );


    function _createElement(context, tag, data, children, normalizationType) {

        if (isDef(data) && isDef((data).__ob__)) {
            baseWarn('避免使用被监听的数据作为vnode的数据' + JSON.stringify(data));
            // 返回一个空vnode
            return createEmptyVNode();
        }

        if (!tag) {
            // 如果不存在标签名返回一个空vnode
            return createEmptyVNode()
        }

        if (isDef(data) && isDef(data.key) && !isPrimitive(data.key)) {
            // 判断key是不是基础数据类型
            baseWarn('请使用基础数据类型作为key值' + data.key);

        }

        if (Array.isArray(children) && typeof children[0] === 'function') {
            data = data || {};
            data.scopedSlots = {default: children[0]};
            children.length = 0;
        }

        // 有for 或者 if else(if)中有for
        if (normalizationType === ALWAYS_NORMALIZE) {
            children = normalizeChildren(children);
        }

        // 处理没有for循环的子节点
        else if (normalizationType === SIMPLE_NORMALIZE) {
            children = simpleNormalizeChildren(children);
        }

        var vnode;
        if (typeof tag === 'string') {
            if (context.config.isReservedTag(tag)) {
                // 如果是html标签或者svg标签
                vnode = new VNode(tag, data, children, undefined, undefined, context);
            } else {
                baseWarn('创建vnode时发现不是标签的元素');
                return createEmptyVNode()
            }
        } else {
            baseWarn('创建vnode时发现不是标签的元素');
            return createEmptyVNode()
        }
        if (isDef(vnode)) {
            return vnode
        } else {
            return createEmptyVNode()
        }
    }

    /**
     * 处理正常子节点
     * @param children
     * @return {*}
     */
    function normalizeChildren(children) {
        return isPrimitive(children)
            // 如果是简单数据类型
            ? [createTextVNode(children)]
            : Array.isArray(children)
                // 如果是数组
                ? normalizeArrayChildren(children)
                : undefinedl;
    }

    /**
     * 处理简单子节点(深拷贝一份数组)
     * @param children
     * @return {*}
     */
    function simpleNormalizeChildren(children) {
        for (var i = 0; i < children.length; i++) {
            if (Array.isArray(children[i])) {
                return Array.prototype.concat.apply([], children)
            }
        }
        return children;
    }

    /**
     * 处理数组子节点中的所有for循环生成的数组子节点
     * 如果子节点数组中还有数组
     * <div class="test" :class="message">
     *     <span -for="item in test.test2">{{item.asd}}</span>
     *     <div -if="test">if</div>
     *     <div -else-if="test1">elseif</div>
     * </div>
     * test div的子节点如下
     * [
     *      ['span','span','span'],'div'
     * ]
     * 该方法执行后子节点会变成
     * [
     *      'span',
     *      'span',
     *      'span',
     *      'div'
     * ]
     * @param children          子节点
     * @param nestedIndex       _索引值
     * @return {Array}
     */
    function normalizeArrayChildren(children, nestedIndex) {
        var res = [];
        var i, c, lastIndex, last;
        for (i = 0; i < children.length; i++) {
            c = children[i];
            // 如果是undefined null boolean跳过此循环(忽略此子节点)
            if (!isDef(c) || typeof c === 'boolean') {
                continue;
            }
            lastIndex = res.length - 1;
            last = res[lastIndex];
            if (Array.isArray(c)) {
                if (c.length > 0) {
                    // 递归调用normalizeArrayChildren继续处理子节点中的数组
                    c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
                    if (isTextNode(c[0]) && isTextNode(last)) {
                        res[lastIndex] = createTextVNode(last.text + (c[0]).text);
                        c.shift();
                    }
                    // 如结果栈
                    res.push.apply(res, c);
                }
            }
            // 如果子节点是普通数据类型
            else if (isPrimitive(c)) {
                if (isTextNode(last)) {
                    res[lastIndex] = createTextVNode(last.text + c);
                } else if (c !== '') {
                    // 创建一个文本节点入栈
                    res.push(createTextVNode(c));
                }
            }
            else {
                if (isTextNode(c) && isTextNode(last)) {
                    res[lastIndex] = createTextVNode(last.text + c.text);
                } else {
                    //for循环生成的vnode会有_isVList标记
                    if (isTrue(children._isVList) && isDef(c.tag) && !isDef(c.key) && isDef(nestedIndex)) {
                        c.key = "__vlist" + nestedIndex + "_" + i + "__";
                    }
                    res.push(c);
                }
            }
        }
        return res;
    }

    /**
     * 判断vnode是不是一个文本节点
     * @param node
     * @return {boolean|*}
     */
    function isTextNode(node) {
        return isDef(node) && isDef(node.text) && !isTrue(node.isComment)
    }

    //==========================创建vnode的方法（结束）===============================

    //=============================vnode weacher容器===================================
    var uid = 0;

    /**
     * 移除数组中的某个元素
     * @param arr
     * @param item
     * @returns {Array.<T>}
     */
    function remove(arr, item) {
        if (arr.length) {
            var index = arr.indexOf(item);
            if (index > -1) {
                return arr.splice(index, 1)
            }
        }
    }

    /**
     * 容器对象
     * @constructor
     */
    var Dep = function Dep() {
        this.id = uid++;
        this.subs = [];
    };

    Dep.prototype.addSub = function addSub(sub) {
        this.subs.push(sub);
    };

    Dep.prototype.removeSub = function removeSub(sub) {
        remove(this.subs, sub);
    };

    /**
     * 创建数据监听者与vnode weacher之间的依赖关系
     * 将vnode weacher添加到data observer中dev中的sub栈
     * 将data observer添加到vnode weacher中的newDeps栈
     */
    Dep.prototype.depend = function depend() {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    };

    /**
     * 遍历subs容器栈中页面vnode weacher实例进行页面更新
     */
    Dep.prototype.notify = function notify() {
        var subs = this.subs.slice();
        for (var i = 0, l = subs.length; i < l; i++) {
            subs[i].update();
        }
    };

    /**
     * 静态属性用来缓存当前需要和数据监听者关联的dom观察者实例
     * 通过主动触发数据监听者的get方法来建立数据监听者和dom观察者的联系
     */
    Dep.target = null;
    var targetStack = [];

    /**
     * 添加缓存方法
     * @param _target
     */
    function pushTarget(_target) {
        if (Dep.target) {
            targetStack.push(Dep.target);
        }
        Dep.target = _target;
    }

    /**
     * 移除缓存方法
     * @param _target
     */
    function popTarget() {
        Dep.target = targetStack.pop();
    }

    //=============================vnode weacher容器结束=================================


    //=============================给数据添加数据拦截者=================================
    /**
     * 基础数据拦截器对象
     * @type {{enumerable: boolean, configurable: boolean, get: noop, set: noop}}
     */
    var sharedPropertyDefinition = {
        enumerable: true,
        configurable: true,
        get: noop,
        set: noop
    };

    /**
     * 给属性添加set get数据拦截方法
     * @param target            要拦截的数据对象
     * @param sourceKey         要拦截的源键值 _data(vm._data)
     * @param key               要拦截的键值 name(vm._data.name)
     */
    function proxy(target, sourceKey, key) {
        sharedPropertyDefinition.get = function proxyGetter() {
            return this[sourceKey][key];
        };
        sharedPropertyDefinition.set = function proxySetter(val) {
            this[sourceKey][key] = val;
        };
        // 给数据添加set get方法
        Object.defineProperty(target, key, sharedPropertyDefinition);
    }

    /**
     * 直接target的原型实例替换为src
     * @param target
     * @param src
     */
    function protoAugment(target, src) {
        target.__proto__ = src;
    }

    /**
     * 将src中的keys方法拷贝到target对象中
     * @param target
     * @param src
     * @param keys
     */
    function copyAugment(target, src, keys) {
        for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            def(target, key, src[key]);
        }
    }

    // 数组对象原型'push','pop','shift','unshift','splice','sort','reverse'里面包含着这些会改变数组结构的方法
    var arrayProto = Array.prototype;
    // 重写包装
    var arrayMethods = Object.create(arrayProto);
    [
        'push',
        'pop',
        'shift',
        'unshift',
        'splice',
        'sort',
        'reverse'
    ].forEach(function (method) {
        // 对应的方法源
        var original = arrayProto[method];
        // 重写'push','pop','shift','unshift','splice','sort','reverse'这些会改变数组结构的方法
        // 给arrayMethods添加method方法
        def(arrayMethods, method, function mutator() {
            var args = [],
                len = arguments.length;
            while (len--) args[len] = arguments[len];
            // 调用父类的方法，类似于java的super.方法名();
            var result = original.apply(this, args);
            // 取出该数据的观察者对象
            var ob = this.__ob__;
            var inserted;
            switch (method) {
                case 'push':
                case 'unshift':
                    inserted = args;
                    break;
                case 'splice':
                    inserted = args.slice(2);
                    break
            }
            if (inserted) {
                ob.observeArray(inserted);
            }
            // 通知数据发生改变
            ob.dep.notify();
            return result;
        });
    });

    // 获取arrayMethods中被重写的方法'push','pop','shift','unshift','splice','sort','reverse'
    var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

    /**
     * 观察者状态
     * @type {{shouldConvert: boolean}}
     */
    var observerState = {
        shouldConvert: true
    };

    /**
     * 创建数据观察者对象
     * @param value             数据对象
     * @param asRootData        是不是根数据
     * @returns {*}
     */
    function observe(value, asRootData) {
        if (!isObject(value) || value instanceof VNode) {
            return;
        }
        var ob;
        // 检查value上是否有__ob__属性并是Observer的实例
        if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
            // 该数据已经有观察者对象
            ob = value.__ob__;
        }
        // 数据可转变&&（数据是数组||普通对象）&& 数据可扩展
        else if (observerState.shouldConvert && (Array.isArray(value) || isPlainObject(value)) && Object.isExtensible(value)) {
            ob = new Observer(value);
        }
        // 如果是根数据
        if (asRootData && ob) {
            ob.vmCount++;
        }
        return ob;
    }

    /**
     * 数据观察者对象
     * @param value         需要拦截的数据
     * @constructor
     */
    var Observer = function Observer(value) {
        this.value = value;
        this.dep = new Dep();
        this.vmCount = 0;
        //给value添加__ob__属性值为当前Observer实例
        def(value, '__ob__', this);
        if (Array.isArray(value)) {
            // 如果value是数组，重写数组上可以改变数组值的方法'push','pop',
            // 'shift','unshift','splice','sort','reverse';
            var augment = hasProto ? protoAugment : copyAugment;
            augment(value, arrayMethods, arrayKeys);
            this.observeArray(value);
        } else {
            // 对象
            this.walk(value);
        }
    };

    /**
     * 观察数组的方法:循环给栈中的元素添加拦截方法
     * @param items
     */
    Observer.prototype.observeArray = function observeArray(items) {
        for (var i = 0, l = items.length; i < l; i++) {
            observe(items[i]);
        }
    };

    /**
     * 观察对象的方法:循环给每个属性添加拦截方法
     * @param obj
     */
    Observer.prototype.walk = function walk(obj) {
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            defineReactive(obj, keys[i], obj[keys[i]]);
        }
    };

    /**
     * 循环给数组下所有的属性对应的数据监听者容器中增加相应的页面观察者对象
     * @param value
     */
    function dependArray(value) {
        var e;
        for (var i = 0, l = value.length; i < l; i++) {
            e = value[i];
            e && e.__ob__ && e.__ob__.dep.depend();
            if (Array.isArray(e)) {
                dependArray(e);
            }
        }
    }

    /**
     * 给obj中的key属性添加拦截
     * @param obj
     * @param key
     * @param val
     * @param customSetter
     * @param shallow
     */
    function defineReactive(obj, key, val, customSetter, shallow) {

        // 当数据改变时需要驱动哪些页面进行改变的容器
        var dep = new Dep();
        // 获取对应键值的属性描述器
        var property = Object.getOwnPropertyDescriptor(obj, key);
        if (property && property.configurable === false) {
            return;
        }

        // 属性原本具有的setter，getter方法
        var getter = property && property.get;
        var setter = property && property.set;

        // 调用observe方法给当前对应属性的子属性添加数据拦截
        // 只有当val是[object Object]或者数组时才给其添加监视器
        // 返回val的监视器对象
        var childOb = !shallow && observe(val);

        Object.defineProperty(obj, key, {
            enumerable: true,//可for in遍历（可枚举）
            configurable: true,//可删除
            get: function reactiveGetter() {
                // 如果添加监听器之前存在getter方法，就调用
                var value = getter ? getter.call(obj) : val;
                // 当页面观察者创建完后会主动调一次数据的get方法从而
                // 让页面观察者和数据监听者建立联系
                if (Dep.target) {
                    dep.depend();
                    // 父节点数据改变会引起子节点中全部更新
                    if (childOb) {
                        childOb.dep.depend();
                        if (Array.isArray(value)) {
                            dependArray(value);
                        }
                    }
                }
                return value;
            },
            set: function reactiveSetter(newVal) {
                // 如果添加监听器之前存在getter方法，就调用
                var value = getter ? getter.call(obj) : val;
                // 如果值未发生改变
                if (newVal === value) {
                    return;
                }
                // 如果有set回调方法执行以下回调
                if (customSetter) {
                    customSetter();
                }
                // 设置新址
                if (setter) {
                    setter.call(obj, newVal);
                } else {
                    val = newVal;
                }
                // 调用observe方法给新值添加监听
                childOb = !shallow && observe(newVal);
                // 执行以下容器中
                dep.notify();
            }
        });
    }

    //=============================给数据添加数据拦截者结束=================================


    //======================================vnode观察者====================================

    /**
     * set判断是否有某属性
     * has，判断是否有该属性
     * add，添加属性
     * clear，清除所有属性
     */
    var _Set;
    if (typeof Set !== 'undefined' && isNative(Set)) {
        _Set = Set;
    } else {
        _Set = (function () {
            function Set() {
                this.set = Object.create(null);
            }

            Set.prototype.has = function has(key) {
                return this.set[key] === true
            };
            Set.prototype.add = function add(key) {
                this.set[key] = true;
            };
            Set.prototype.clear = function clear() {
                this.set = Object.create(null);
            };

            return Set;
        }());
    }

    /**
     * 观察者类 当页面render方法和update方法生成后创建观察者，
     * 当数据改变时会调用相应观察者的expOrFn方法实现vnode的局部更新
     * @param vm                    上下文对象
     * @param expOrFn               更新页面的方法
     * @param cb                    回调
     * @param options               选型
     * @param isRenderWatcher       是否是render方法的观察者
     * @constructor
     */
    var Watcher = function Watcher(vm, expOrFn, cb, options, isRenderWatcher) {
        this.vm = vm;
        if (isRenderWatcher) {
            // 给上下文对象_watcher挂载render方法观察者实例
            vm._watcher = this;
        }
        // 上下文对象中观察者栈
        vm._watchers.push(this);
        // 回调方法
        this.cb = cb;
        // id
        this.id = ++uid$2;
        // 标注当前Watcher实例是不是活动的
        this.active = true;
        // 用于保存dep实例的栈
        this.newDeps = [];
        // 判断dep容器中是否保存了该vnode观察者实例
        this.depIds = new _Set();
        // 用于判断Dep id是否存在
        this.newDepIds = new _Set();
        this.expression = expOrFn.toString();
        // 初始化getter方法为更新页面的方法
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn;
        } else {
            baseWarn('更新页面的方法不是方法' + expOrFn);
        }
        this.value = this.get();
    };

    /**
     * 设置Dep中静态属性target为当前vnode观察者，
     * 调用对应数据的getter方法建立数据监听者与vnode观察者之间的联系
     * @return {*}
     */
    Watcher.prototype.get = function get() {
        pushTarget(this);
        var value;
        var vm = this.vm;
        try {
            // 调用页面更新方法返回和页面相关的数据
            value = this.getter.call(vm, vm);
        } catch (e) {
            baseWarn('在观察者(watcher)中更新的方法执行出错' + e);
        } finally {
            popTarget();
        }
        return value;
    };

    /**
     * vnode观察者与dep容器实例相互添加保存
     * vnode观察者保存引用了该观察者的dep容器实例
     * dep容器中保存了对应数据变换会触发哪些vnode观察者实例
     * @param dep
     */
    Watcher.prototype.addDep = function addDep(dep) {
        var id = dep.id;
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id);
            this.newDeps.push(dep);
            if (!this.depIds.has(id)) {
                //将观察者实例加入容器中
                dep.addSub(this);
            }
        }
    };

    /**
     * 执行更新操作
     */
    Watcher.prototype.run = function run() {
        if (this.active) {
            // 调用get方法update vnode
            var value = this.get();
            if (value !== this.value || isObject(value) || this.deep) {
                var oldValue = this.value;
                this.value = value;
                this.cb.call(this.vm, value, oldValue);
            }
        }
    };

    /**
     * vnode监听者更新vnode方法
     */
    Watcher.prototype.update = function update() {
        // this.run();
        queueWatcher(this);
    };

    //======================================vnode观察者结束====================================

    //=================================宏任务和微任务===========================================

    /**
     * 任务处理部分原理简化
     * <div :class='data1'>{{data2}}</div>
     * data:{
     *      data1:'test1',
     *      data2:'test2'
     * }
     * 当data observer 监听到数据变化时,会通过watcher实例的update方法触发vnode update
     * 但会存在一种情况,我同时修改data1和data2
     * data.data1 = 'updated1';
     * data.data2 = 'updated1';
     * 这时就会分别触发data1和data2的observer从而调用2次同一个watcher实例的update方法
     * 而这两次update要实现的效果是完全一样的。这是后就要使用任务调度来解决这个问题。
     *
     * 执行流程如下:
     * 1 data1数据发生改变
     * 2 data1的observer实例触发watcher实例的update方法
     * 3 将watcher实例的update方法入栈
     * 4 启动更新栈中watcher实例的update方法的任务（线程，可理解为setTimeout）
     * 5 data2数据发生改变
     * 6 data2的observer实例触发watcher实例的update方法
     * 7 将watcher实例的update入栈时发现watcher实例已存在在栈中，不入栈，不执行启动更新栈方法。
     * 代码执行顺序如下 1 2 3 5 6 7 4(宏任务在下一轮Event Loop中执行)
     * 从而达到多个数据改变导致触发多次相同watcher实例的update方法，只会执行一次update方法
     * @type {Array}
     */


    var callbacks = [];//回调方法任务栈
    // callbacks中的任务是否在执行标志
    var pending = false;
    // 保存Watcher实例的队列
    var queue = [];
    // 标识队列中是否有某个Watcher实例
    var has = {};
    var waiting = false;
    // queue栈是否根据watcher的id排序
    var flushing = false;
    var index = 0;
    // 用来记录queue中同一个id出现的次数
    var circular = {};
    // 同一个watcher最大更新总数
    var MAX_UPDATE_COUNT = 100;

    /**
     * Watcher队列
     * @param watcher
     */
    function queueWatcher(watcher) {
        var id = watcher.id;
        // 用于防止队列总存在重复的watcher
        if (has[id] == null) {
            has[id] = true;
            //queue栈是否根据watcher的id排序
            if (!flushing) {
                queue.push(watcher);
            } else {
                var i = queue.length - 1;
                // 根据id在queue栈中排序插入
                while (i > index && queue[i].id > watcher.id) {
                    i--;
                }
                // 在queue[i+1]的位置插入watcher
                queue.splice(i + 1, 0, watcher);
            }
            if (!waiting) {
                waiting = true;
                nextTick(flushSchedulerQueue);
            }
        }
    }

    /**
     * 使用微任务或者宏任务执行callbacks中的所有任务
     * @param cb
     * @param ctx
     */
    function nextTick(cb, ctx) {
        // 将cb回调的执行压入callbacks栈中
        callbacks.push(function () {
            if (cb) {
                try {
                    cb.call(ctx);
                } catch (e) {
                    baseWarn('nextTick中添加的callbacks中的方法执行出错');
                }
            }
        });
        // callbacks中的任务是否在执行标志
        if (!pending) {
            pending = true;
            // 使用宏任务或微任务去执行flushCallbacks方法
            if (useMacroTask) {
                macroTimerFunc();
            } else {
                microTimerFunc();
            }
        }
    }

    /**
     * 遍历任务队列queue中的watcher执行watcher.run()方法
     */
    function flushSchedulerQueue() {
        //queue栈需要根据watcher的id排序
        flushing = true;
        var watcher, id;

        // 将queue栈中的watcher根据id升续排序
        queue.sort(function (a, b) {
            return a.id - b.id;
        });

        // 循环执行queue栈中watcher的run方法
        for (index = 0; index < queue.length; index++) {
            watcher = queue[index];
            id = watcher.id;
            has[id] = null;
            // 执行watcher的run方法
            watcher.run();
            // 同一个vnode watcher更新数超过了最大更新数限制
            if (has[id] != null) {
                circular[id] = (circular[id] || 0) + 1;
                if (circular[id] > MAX_UPDATE_COUNT) {
                    baseWarn('代码可能出现了更新循环在' + watcher.expression + '方法中');
                    break;
                }
            }
        }

        // 更新过的队列
        // var updatedQueue = queue.slice();
        // 调用更新过的队列中的生命周期方法
        // callUpdatedHooks(updatedQueue);
        resetSchedulerState();
    }

    /**
     * 重置任务flag值
     */
    function resetSchedulerState() {
        index = queue.length = 0;
        has = {};
        // circular = {};
        waiting = flushing = false;
    }

    /**
     * 创建宏任务和微任务方法（异步方法）
     * setImmediate，MessageChannel，setTimeout会，各种事件（比如鼠标单击事件）的回调函数 会产生宏任务
     * process.nextTick和Promise则会产生微任务
     */
    var microTimerFunc;// 微任务
    var macroTimerFunc;// 宏任务
    var useMacroTask = false;// 使用宏任务flag

    // 执行callbacks回调栈中的所有方法
    function flushCallbacks() {
        pending = false;
        var copies = callbacks.slice(0);
        callbacks.length = 0;
        for (var i = 0; i < copies.length; i++) {
            copies[i]();
        }
    };

    // 浏览器支持setImmediate使用setImmediate做宏任务方法
    if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
        macroTimerFunc = function () {
            setImmediate(flushCallbacks);
        };
    }
    // 浏览器支持MessageChannel使用MessageChannel做宏任务方法
    else if (typeof MessageChannel !== 'undefined' &&
        (isNative(MessageChannel) || MessageChannel.toString() === '[object MessageChannelConstructor]')) {
        var channel = new MessageChannel();
        var port = channel.port2;
        channel.port1.onmessage = flushCallbacks;
        macroTimerFunc = function () {
            port.postMessage(1);
        };
    }
    // 浏览器都不支持使用setTimeout做宏任务方法
    else {
        macroTimerFunc = function () {
            setTimeout(flushCallbacks, 0);
        };
    }

    // 浏览器支持Promise使用Promise做微任务方法
    if (typeof Promise !== 'undefined' && isNative(Promise)) {
        var p = Promise.resolve();
        microTimerFunc = function () {
            p.then(flushCallbacks);
            if (isIOS) {
                setTimeout(noop);
            }
        };
    }
    // 浏览器都不支持使用宏任务方法做为微任务方法
    else {
        microTimerFunc = macroTimerFunc;
    }
    //=================================宏任务和微任务结束=======================================

    //=============================diff vnode的方法====================================
    /**
     * 通过vnode生成初始化dom或者根据2个vnode diff 更新 dom的方法
     */
    var patch = (function () {
        var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

        /**
         * 创建diff vnode的方法
         * @param backend
         * @return {patch}
         */
        function createPatchFunction(backend) {
            var i, j;
            var cbs = {};
            // 操作样式和类
            var modules = backend.modules;
            // dom操作的方法集合
            var nodeOps = backend.nodeOps;
            // 空vnode
            var emptyNode = new VNode('', {}, []);
            // Input标签的type类型集合
            var isTextInputType = makeMap('text,number,password,search,email,tel,url');
            /**
             * 初始化cbs对象
             * cbs = {
             *     create:[所有create的方法],
             *     activate:[所有activate的方法],
             *     update:[所有update的方法],
             *     remove:[所有remove的方法],
             *     destroy:[所有destroy的方法]
             * }
             */
            for (i = 0; i < hooks.length; ++i) {
                cbs[hooks[i]] = [];
                for (j = 0; j < modules.length; ++j) {
                    if (isDef(modules[j][hooks[i]])) {
                        cbs[hooks[i]].push(modules[j][hooks[i]]);
                    }
                }
            }

            /**
             * 通过dom创建vnode
             * @param elm
             * @returns {VNode}
             */
            function emptyNodeAt(elm) {
                return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
            }

            function createRmCb(childElm, listeners) {
                function remove() {
                    if (--remove.listeners === 0) {
                        removeNode(childElm);
                    }
                }

                remove.listeners = listeners;
                return remove
            }

            function removeNode(el) {
                var parent = nodeOps.parentNode(el);
                if (isDef(parent)) {
                    nodeOps.removeChild(parent, el);
                }
            }

            /**
             * 创建dom
             * @param vnode                 vnode
             * @param insertedVnodeQueue
             * @param parentElm             父dom
             * @param refElm
             * @param nested
             */
            function createElm(vnode, insertedVnodeQueue, parentElm, refElm, nested) {
                vnode.isRootInsert = !nested;
                var data = vnode.data;
                var children = vnode.children;
                var tag = vnode.tag;
                if (isDef(tag)) {
                    // 创建具有vnode data的dom
                    vnode.elm = vnode.ns
                        ? nodeOps.createElementNS(vnode.ns, tag)
                        : nodeOps.createElement(tag, vnode);
                    // 创建子节点
                    createChildren(vnode, children, insertedVnodeQueue);
                    if (isDef(data)) {
                        // 调用Create的钩子方法来创建
                        invokeCreateHooks(vnode, insertedVnodeQueue);
                    }
                    insert(parentElm, vnode.elm, refElm);
                } else if (isTrue(vnode.isComment)) {
                    // 注释
                    vnode.elm = nodeOps.createComment(vnode.text);
                    insert(parentElm, vnode.elm, refElm);
                } else {
                    // 文本
                    vnode.elm = nodeOps.createTextNode(vnode.text);
                    insert(parentElm, vnode.elm, refElm);
                }
            }

            /**
             * 将elm插入到parent中
             * @param parent
             * @param elm
             * @param ref$$1
             */
            function insert(parent, elm, ref$$1) {
                if (isDef(parent)) {
                    if (isDef(ref$$1)) {
                        if (ref$$1.parentNode === parent) {
                            nodeOps.insertBefore(parent, elm, ref$$1);
                        }
                    } else {
                        nodeOps.appendChild(parent, elm);
                    }
                }
            }

            /**
             * 创建子dom的方法
             * @param vnode
             * @param children
             * @param insertedVnodeQueue
             */
            function createChildren(vnode, children, insertedVnodeQueue) {
                if (Array.isArray(children)) {
                    for (var i = 0; i < children.length; ++i) {
                        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true);
                    }
                }
                // 如果文本是简单数据类型创建一个文本dom插入elm中
                else if (isPrimitive(vnode.text)) {
                    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
                }
            }

            /**
             * 是否能进行diff比对
             * @param vnode
             * @return {boolean}
             */
            function isPatchable(vnode) {
                while (vnode.componentInstance) {
                    vnode = vnode.componentInstance._vnode;
                }
                return isDef(vnode.tag)
            }

            /**
             * 调用create的钩子方法
             * @param vnode
             * @param insertedVnodeQueue
             */
            function invokeCreateHooks(vnode, insertedVnodeQueue) {
                for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                    cbs.create[i$1](emptyNode, vnode);
                }
            }

            function addVnodes(parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
                for (; startIdx <= endIdx; ++startIdx) {
                    createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm);
                }
            }

            /**
             * 从parentElm中移除vnodes对应的elm
             * @param parentElm
             * @param vnodes
             * @param startIdx
             * @param endIdx
             */
            function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
                for (; startIdx <= endIdx; ++startIdx) {
                    var ch = vnodes[startIdx];
                    if (isDef(ch)) {
                        if (isDef(ch.tag)) {
                            removeAndInvokeRemoveHook(ch);
                        } else {
                            removeNode(ch.elm);
                        }
                    }
                }
            }

            function removeAndInvokeRemoveHook(vnode, rm) {
                if (isDef(rm) || isDef(vnode.data)) {
                    var i;
                    var listeners = cbs.remove.length + 1;
                    if (isDef(rm)) {
                        rm.listeners += listeners;
                    } else {
                        rm = createRmCb(vnode.elm, listeners);
                    }
                    if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
                        removeAndInvokeRemoveHook(i, rm);
                    }
                    for (i = 0; i < cbs.remove.length; ++i) {
                        cbs.remove[i](vnode, rm);
                    }
                    if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
                        i(vnode, rm);
                    } else {
                        rm();
                    }
                } else {
                    removeNode(vnode.elm);
                }
            }

            function createKeyToOldIdx(children, beginIdx, endIdx) {
                var i, key;
                var map = {};
                for (i = beginIdx; i <= endIdx; ++i) {
                    key = children[i].key;
                    if (isDef(key)) {
                        map[key] = i;
                    }
                }
                return map
            }

            /**
             * 更新子节点
             * @param parentElm
             * @param oldCh                 老子
             * @param newCh                 新子
             * @param insertedVnodeQueue
             * @param removeOnly
             */
            function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
                var oldStartIdx = 0;
                var newStartIdx = 0;
                var oldEndIdx = oldCh.length - 1;
                var oldStartVnode = oldCh[0];
                var oldEndVnode = oldCh[oldEndIdx];
                var newEndIdx = newCh.length - 1;
                var newStartVnode = newCh[0];
                var newEndVnode = newCh[newEndIdx];
                var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

                var canMove = !removeOnly;

                while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
                    if (!isDef(oldStartVnode)) {
                        oldStartVnode = oldCh[++oldStartIdx];
                    } else if (!isDef(oldEndVnode)) {
                        oldEndVnode = oldCh[--oldEndIdx];
                    } else if (sameVnode(oldStartVnode, newStartVnode)) {
                        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                        oldStartVnode = oldCh[++oldStartIdx];
                        newStartVnode = newCh[++newStartIdx];
                    } else if (sameVnode(oldEndVnode, newEndVnode)) {
                        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                        oldEndVnode = oldCh[--oldEndIdx];
                        newEndVnode = newCh[--newEndIdx];
                    } else if (sameVnode(oldStartVnode, newEndVnode)) {
                        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
                        oldStartVnode = oldCh[++oldStartIdx];
                        newEndVnode = newCh[--newEndIdx];
                    } else if (sameVnode(oldEndVnode, newStartVnode)) {
                        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                        oldEndVnode = oldCh[--oldEndIdx];
                        newStartVnode = newCh[++newStartIdx];
                    } else {
                        if (!isDef(oldKeyToIdx)) {
                            oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                        }
                        idxInOld = isDef(newStartVnode.key)
                            ? oldKeyToIdx[newStartVnode.key]
                            : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
                        if (!isDef(idxInOld)) {
                            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
                        } else {
                            vnodeToMove = oldCh[idxInOld];
                            if (sameVnode(vnodeToMove, newStartVnode)) {
                                patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
                                oldCh[idxInOld] = undefined;
                                canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
                            } else {
                                createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm);
                            }
                        }
                        newStartVnode = newCh[++newStartIdx];
                    }
                }
                if (oldStartIdx > oldEndIdx) {
                    refElm = !isDef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
                    addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
                } else if (newStartIdx > newEndIdx) {
                    removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
                }
            }

            function findIdxInOld(node, oldCh, start, end) {
                for (var i = start; i < end; i++) {
                    var c = oldCh[i];
                    if (isDef(c) && sameVnode(node, c)) {
                        return i
                    }
                }
            }

            /**
             * 比对新老vnode生成新dom
             * @param oldVnode              老的vnode
             * @param vnode                 新vnode
             * @param insertedVnodeQueue
             * @param removeOnly
             */
            function patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly) {
                if (oldVnode === vnode) {
                    return;
                }

                // 赋值elm
                var elm = vnode.elm = oldVnode.elm;

                // 静态节点
                if (isTrue(vnode.isStatic) &&
                    isTrue(oldVnode.isStatic) &&
                    vnode.key === oldVnode.key &&
                    isTrue(vnode.isCloned)
                ) {
                    vnode.componentInstance = oldVnode.componentInstance;
                    return;
                }

                var i;
                var data = vnode.data;
                var oldCh = oldVnode.children;
                var ch = vnode.children;
                if (isDef(data) && isPatchable(vnode)) {
                    for (i = 0; i < cbs.update.length; ++i) {
                        // 调用hook中的更新函数
                        cbs.update[i](oldVnode, vnode);
                    }
                }
                if (!isDef(vnode.text)) {
                    if (isDef(oldCh) && isDef(ch)) {
                        if (oldCh !== ch) {
                            updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly);
                        }
                    } else if (isDef(ch)) {
                        if (isDef(oldVnode.text)) {
                            nodeOps.setTextContent(elm, '');
                        }
                        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
                    } else if (isDef(oldCh)) {
                        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
                    } else if (isDef(oldVnode.text)) {
                        nodeOps.setTextContent(elm, '');
                    }
                } else if (oldVnode.text !== vnode.text) {
                    nodeOps.setTextContent(elm, vnode.text);
                }
                if (isDef(data)) {
                    if (isDef(i = data.hook) && isDef(i = i.postpatch)) {
                        i(oldVnode, vnode);
                    }
                }
            }

            /**
             * 比较两个input vnode 的type相等且合法
             * @param a
             * @param b
             * @return {*}
             */
            function sameInputType(a, b) {
                if (a.tag !== 'input') {
                    return true;
                }
                var i;
                var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
                var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
                return typeA === typeB || (isTextInputType(typeA) && isTextInputType(typeB));
            }

            /**
             * 比较两个vnode是否相同
             * @param a
             * @param b
             * @return {boolean|*}
             */
            function sameVnode(a, b) {
                return (
                    a.key === b.key && (//key相同
                        (
                            a.tag === b.tag &&//标签名相同
                            a.isComment === b.isComment &&//是否是注释
                            isDef(a.data) === isDef(b.data) &&//都存在属性数据
                            sameInputType(a, b)//比较两个input vnode 的type相等且合法
                        )
                    )
                );
            }

            return function patch(oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
                // 安装过的vnode的队列
                var insertedVnodeQueue = [];
                // 是否是真实的dom
                var isRealElement = isDef(oldVnode.nodeType);
                if (!isRealElement && sameVnode(oldVnode, vnode)) {
                    //如果是2个vnode进行比对
                    patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
                } else {
                    if (isRealElement) {
                        // 根据dom生成一个vnode
                        oldVnode = emptyNodeAt(oldVnode);
                    }
                    // 老的实体dom
                    var oldElm = oldVnode.elm;
                    // 获取dom的父元素
                    var parentElm$1 = nodeOps.parentNode(oldElm);
                    createElm(
                        vnode,
                        insertedVnodeQueue,
                        parentElm$1,
                        nodeOps.nextSibling(oldElm)
                    );
                    if (isDef(parentElm$1)) {
                        removeVnodes(parentElm$1, [oldVnode], 0, 0);
                    }
                }
                return vnode.elm
            }
        }

        /**
         * dom操作方法集合对象
         * @param tagName
         * @param vnode
         * @return {Element}
         */
        var nodeOps = (function () {

            function createElement$1(tagName, vnode) {
                var elm = document.createElement(tagName);
                if (tagName !== 'select') {
                    return elm;
                }
                // 设置属性
                if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
                    elm.setAttribute('multiple', 'multiple');
                }
                return elm;
            }

            function createTextNode(text) {
                return document.createTextNode(text)
            }

            function createComment(text) {
                return document.createComment(text)
            }

            function insertBefore(parentNode, newNode, referenceNode) {
                parentNode.insertBefore(newNode, referenceNode);
            }

            function removeChild(node, child) {
                node.removeChild(child);
            }

            function appendChild(node, child) {
                node.appendChild(child);
            }

            function parentNode(node) {
                return node.parentNode
            }

            function nextSibling(node) {
                return node.nextSibling
            }

            function tagName(node) {
                return node.tagName
            }

            function setTextContent(node, text) {
                node.textContent = text;
            }

            function setAttribute(node, key, val) {
                node.setAttribute(key, val);
            }

            /**
             * 创建一个不可编辑的对象 一个dom操作的方法集合
             * @type {Object}
             */
            var nodeOps = Object.freeze({
                createElement: createElement$1,
                createTextNode: createTextNode,
                createComment: createComment,
                insertBefore: insertBefore,
                removeChild: removeChild,
                appendChild: appendChild,
                parentNode: parentNode,
                nextSibling: nextSibling,
                tagName: tagName,
                setTextContent: setTextContent,
                setAttribute: setAttribute
            });

            return nodeOps;
        })();

        /**
         * 更新属性，样式，类的方法
         * @type {Function}
         */
        var modules = (function () {
            var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');
            var isBooleanAttr = makeMap(
                'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
                'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
                'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
                'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
                'required,reversed,scoped,seamless,selected,sortable,translate,' +
                'truespeed,typemustmatch,visible'
            );
            var isFalsyAttrValue = function (val) {
                return val == null || val === false
            };

            function updateAttrs(oldVnode, vnode) {
                if (!isDef(oldVnode.data.attrs) && !isDef(vnode.data.attrs)) {
                    return
                }
                var key, cur, old;
                var elm = vnode.elm;
                var oldAttrs = oldVnode.data.attrs || {};
                var attrs = vnode.data.attrs || {};
                if (isDef(attrs.__ob__)) {
                    attrs = vnode.data.attrs = extend({}, attrs);
                }

                for (key in attrs) {
                    cur = attrs[key];
                    old = oldAttrs[key];
                    if (old !== cur) {
                        setAttr(elm, key, cur);
                    }
                }

                if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
                    setAttr(elm, 'value', attrs.value);
                }
                for (key in oldAttrs) {
                    if (!isDef(attrs[key])) {
                        if (!isEnumeratedAttr(key)) {
                            elm.removeAttribute(key);
                        }
                    }
                }
            }

            function setAttr(el, key, value) {
                if (isBooleanAttr(key)) {
                    if (isFalsyAttrValue(value)) {
                        el.removeAttribute(key);
                    } else {
                        value = (key === 'allowfullscreen' && el.tagName === 'EMBED') ? 'true' : key;
                        el.setAttribute(key, value);
                    }
                } else if (isEnumeratedAttr(key)) {
                    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
                } else {
                    if (isFalsyAttrValue(value)) {
                        el.removeAttribute(key);
                    } else {
                        if (isIE && !isIE9 && el.tagName === 'TEXTAREA' && key === 'placeholder' && !el.__ieph) {
                            var blocker = function (e) {
                                e.stopImmediatePropagation();
                                el.removeEventListener('input', blocker);
                            };
                            el.addEventListener('input', blocker);
                            el.__ieph = true;
                        }
                        el.setAttribute(key, value);
                    }
                }
            }

            var attrs = {
                create: updateAttrs,
                update: updateAttrs
            };

            function concat(a, b) {
                return a ? (b ? (a + ' ' + b) : a) : (b || '')
            }

            function mergeClassData(child, parent) {
                return {
                    staticClass: concat(child.staticClass, parent.staticClass),
                    class: isDef(child.class)
                        ? [child.class, parent.class]
                        : parent.class
                }
            }

            function stringifyArray(value) {
                var res = '';
                var stringified;
                for (var i = 0, l = value.length; i < l; i++) {
                    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
                        if (res) {
                            res += ' ';
                        }
                        res += stringified;
                    }
                }
                return res
            }

            function stringifyObject(value) {
                var res = '';
                for (var key in value) {
                    if (value[key]) {
                        if (res) {
                            res += ' ';
                        }
                        res += key;
                    }
                }
                return res
            }


            function stringifyClass(value) {
                if (Array.isArray(value)) {
                    return stringifyArray(value)
                }
                if (isObject(value)) {
                    return stringifyObject(value)
                }
                if (typeof value === 'string') {
                    return value
                }
                return ''
            }

            function renderClass(staticClass, dynamicClass) {
                if (isDef(staticClass) || isDef(dynamicClass)) {
                    return concat(staticClass, stringifyClass(dynamicClass))
                }
                return ''
            }

            function genClassForVnode(vnode) {
                var data = vnode.data;
                var parentNode = vnode;
                var childNode = vnode;
                while (isDef(childNode.componentInstance)) {
                    childNode = childNode.componentInstance._vnode;
                    if (childNode && childNode.data) {
                        data = mergeClassData(childNode.data, data);
                    }
                }
                while (isDef(parentNode = parentNode.parent)) {
                    if (parentNode && parentNode.data) {
                        data = mergeClassData(data, parentNode.data);
                    }
                }
                return renderClass(data.staticClass, data.class)
            }

            function updateClass(oldVnode, vnode) {
                var el = vnode.elm;
                var data = vnode.data;
                var oldData = oldVnode.data;
                if (
                    !isDef(data.staticClass) &&
                    !isDef(data.class) && (
                        !isDef(oldData) || (
                            !isDef(oldData.staticClass) &&
                            !isDef(oldData.class)
                        )
                    )
                ) {
                    return;
                }

                var cls = genClassForVnode(vnode);

                var transitionClass = el._transitionClasses;
                if (isDef(transitionClass)) {
                    cls = concat(cls, stringifyClass(transitionClass));
                }

                if (cls !== el._prevClass) {
                    el.setAttribute('class', cls);
                    el._prevClass = cls;
                }
            }

            var klass = {
                create: updateClass,
                update: updateClass
            };

            return [
                attrs,
                klass
            ];
        })();


        return createPatchFunction({nodeOps: nodeOps, modules: modules});
    })();

    //=============================diff vnode的方法结束================================

    /**
     * Vu类
     * @param options
     * @constructor
     */
    function Vu(options) {
        // 初始化时的选项
        this.$options = options;
        // 如果是静态树的话保存到该属性中
        this._staticTrees = null;
        // 对应的vnode
        this._vnode = null;
        // 对应的element
        this.$el = null;
        // 用来保存vnode观察者的栈
        this._watchers = [];
        this.config = {
            isReservedTag: isReservedTag
        };
        // 初始化在he对象下的其他方法
        init(this);
        // 处理数据添加数据拦截方法
        this._initData(this);
        // 生成执行render方法
        this.$mount(false);
    }

    function init(vm) {
        vm.$createElement = function (a, b, c, d) {
            return createElement(vm, a, b, c, d, true);
        };
        vm._c = function (a, b, c, d) {
            return createElement(vm, a, b, c, d, false);
        };
    }

    /**
     * 将执行render需要的相关内部方法安装到原型上
     */
    installRenderHelpers(Vu.prototype);

    /**
     * 编译模板静态方法
     * 生成AST,对应模板的可执行render方法，以及静态节点可执行render方法
     */
    Vu.compile = createCompiler().compileToFunctions;


    // 处理数据添加数据拦截方法
    Vu.prototype._initData = function (vm) {
        var data = vm.$options.data;
        data = vm._data = data || {};
        if (!isPlainObject(data)) {
            data = {};
            baseWarn('data不是一个[object Object]类型');
        }
        // 需要监听数据的键值数组
        var keys = Object.keys(data);
        var i = keys.length;
        while (i--) {
            var key = keys[i];
            // 给第一层数据添加set get方法
            proxy(vm, "_data", key);
        }
        // 给数据添加观察者对象并添加到__ob__属性下，true表示是根节点
        observe(data, true);
    };

    // 活动的he组件上下文
    var activeInstance = null;

    /**
     * 更新虚拟dom的方法
     * @param vnode         执行render生成的vnode
     * @param hydrating
     * @private
     */
    Vu.prototype._update = function (vnode, hydrating) {
        var vm = this;
        // 是否执行上下文中的生命周期方法
        callHook(vm, 'updateBefore');
        // 之前的vnode
        var prevVnode = vm._vnode;
        var prevActiveInstance = activeInstance;
        // 初始化活动的组件
        activeInstance = vm;
        vm._vnode = vnode;
        // 如果之前没有vnode 直接生成新vnode
        if (!prevVnode) {
            vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false, vm.$options._parentElm, vm.$options._refElm);
            vm.$options._parentElm = vm.$options._refElm = null;
        }
        // 如果之前有vnode进行，比对两个vnode进行diff更新
        else {
            vm.$el = vm.__patch__(prevVnode, vnode);
        }
        // 将activeInstance恢复到更新之前状态
        activeInstance = prevActiveInstance;
        if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
            vm.$parent.$el = vm.$el;
        }
        // 调用更新后的什么周期方法
        callHook(vm, 'updateAfter');
    };

    /**
     * 用来执行编译template后生成的render方法
     * @return {*}
     * @private
     */
    Vu.prototype._render = function () {
        var vm = this;
        var ref = vm.$options;
        // 模板生成的render方法
        var render = ref.render;
        // 父虚拟dom
        var _parentVnode = ref._parentVnode;
        vm.$vnode = _parentVnode;
        var vnode;
        try {
            vnode = render.call(vm, vm.$createElement);
        } catch (e) {
            baseWarn('render执行出错');
        }
        vnode.parent = _parentVnode;
        return vnode
    };

    /**
     * 增加编译
     * @param vm 组件上下文对象
     * @param el dom对象
     * @param hydrating
     * @return {*}
     */
    function mountComponent(vm, template, hydrating) {
        // 将模板转换为dom对象
        vm.$el = vm.parseDom(template);
        // 执行vm中的beforeMount生命周期方法
        callHook(vm, 'beforeMount');
        // 更新组件的方法
        var updateComponent = function () {
            vm._update(vm._render(), hydrating);
        };
        /**
         * 创建对应vnode的Watcher实例
         * 当data发生改变时会触发Watcher实例的update方法重写调用
         * vm._update(vm._render(), hydrating)生成新的vnode
         */
        new Watcher(vm, updateComponent, noop, null, true);
        hydrating = false;
        return vm;
    }

    /**
     * 模板解析为ast,render方法，静态根节点render方法
     * 并挂载到vm（this）上
     * @type {*}
     */
    Vu.prototype.$mount = function (hydrating) {
        var options = this.$options;
        // 模板
        var template = options.template;
        if (template) {
            // 将模板编译为render方法和ast
            var ref = Vu.compile(template, {});
            var render = ref.render;
            var staticRenderFns = ref.staticRenderFns;
            var ast = ref.ast;
            options.render = render;
            options.staticRenderFns = staticRenderFns;
            options.ast = ast;
        }
        return mountComponent.call(this, this, template, hydrating);
    };

    /**
     * 将html转换为dom
     * @param html
     * @return {Element}
     */
    Vu.prototype.parseDom = function (html) {
        var objE = document.createElement("div");
        objE.innerHTML = html;
        return objE.children[0];
    };

    /**
     * 整体设置date
     * @param html
     * @return {Element}
     */
    Vu.prototype.setAllDate = function (data) {
        var vm = this;
        Object.keys(data).forEach(function (item) {
            vm._data[item] = data[item];
        });
    };

    /**
     * 强制根据data重置整个页面会闪动，更新完后调用cb
     */
    Vu.prototype.resetVu = function (data, cb) {
        var vm = this;
        // 清空实体dom
        vm.$el = vm.parseDom(vm.$options.template);
        // 清空vnode实现整体重置更新
        vm._vnode = null;
        Object.keys(data).forEach(function (item) {
            vm._data[item] = data[item];
        });
        // 自建什么周期方法
        function _updateAfter() {
            vm.$options.updateAfter.pop();
            cb.call(vm);
        }

        //给vm添加生命周期方法
        if (vm.$options.updateAfter) {
            //存在updateAfter生命周期 追加
            vm.$options.updateAfter.push(_updateAfter);
        } else {
            //不存在updateAfter生命周期 新建
            vm.$options.updateAfter = [_updateAfter];
        }
    };

    /**
     * 将vu模板生成的dom插入parentDom中
     * @param parentDom
     */
    Vu.prototype.appendIn = function (parentDom) {
        var vm = this;
        parentDom.appendChild(vm.$el);
    };

    /**
     * diff vnode 初始化dom的方法
     */
    Vu.prototype.__patch__ = inBrowser ? patch : noop;
    return Vu;
});