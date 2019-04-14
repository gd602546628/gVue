import GVue from '../src/index'
import {observe} from "../src/observer";
import {Watcher} from '../src/observer/watcher'
import {parseHtml} from '../src/compiler/parser/html-parser'
import {parse} from "../src/compiler/parser/index";
import compiler from '../src/compiler/index'
import {installRenderHelpers} from '../src/instance/renderHelper'
import {createElement} from '../src/vdom/create-element'

function observeTest() {

    let obj = {
        a: {
            b: {
                c: 333
            }
        }
    }
    observe(obj)
    new Watcher(obj, 'a.b', (value, oldValue) => {
        console.log(value, oldValue)
    })
    obj.a.b = {
        d: '444'
    }

    /*  new Watcher(obj, function (ctx) {
          let a = ctx.a.b.c
          let b = ctx.a.b
      }, (value, oldValue) => {
          console.log(value, oldValue)
      })
      obj.a.b.c = '444444444444'*/
}

//observeTest()

function parseHtmlTest() {
    /*  let str = `<div v-for="item in a" style="width: 10px;height: 10px" :style="{width:10px}">
  <p>dsdds</p>
  <div>
  <img src="dsddsd"/>
  </div></div>
  <div>dsd</div>`*/
    let str = `<div></div><234`
    console.log(str)
    parseHtml(str, {

        start: (tagName, attr, isOne, start, end) => {
            console.log('start', tagName, attr, isOne, start, end)
        },
        end: (tagName, start, end) => {
            console.log('end', tagName, start, end)
        },
        chars: (text, start, end) => {
            //  throw new Error()
            console.log('chars', text, start, end)
        }
    })
}

//parseHtmlTest()

function parseTest() {
    let dom = document.querySelector('#test')
    let ast = parse(dom.outerHTML, {a: 123})
    console.log(ast)
}

function compilerTest() {
    let dom = document.querySelector('#test')
    let render = compiler(dom.outerHTML, {})
    let vm = {
        list: [],
        a: 11,
        $options: {}
    }
    installRenderHelpers(vm)
    vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
    let renderFn = new Function(render.render)
    console.log(vm)
    console.log(render)
    console.log(renderFn)
    vm.renderFn = renderFn
    console.log(vm.renderFn())
}

compilerTest()


function anonymous() {
    return _c('div', {attrs: {"id": "test"}}, [_l((list), function (item) {
        return _c('div', {key: "item"}, [_c('div', [_v(_s(item.name))])], 1)
    }), _v(" "), _c('input', {
        directives: [{name: "model", rawName: "v-model", value: (a), expression: "a"}],
        domProps: {"value": (a)},
        on: {
            "input": function ($event) {
                if ($event.target.composing) return;
                a = $event.target.value
            }
        }
    }), _v(" "), _c('img', {attrs: {"src": "sdadsd"}})], 2)
}
