import GVue from '../src/index'
import {observe} from "../src/observer";
import {Watcher} from '../src/observer/watcher'
import {parseHtml} from '../src/compiler/parser/html-parser'
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
let str=`<div></div><234`
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

parseHtmlTest()
