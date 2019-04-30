import GVue from '../src/index'
import {observe, set, del} from "../src/observer";
import {Watcher} from '../src/observer/watcher'
import {parseHtml} from '../src/compiler/parser/html-parser'
import {parse} from "../src/compiler/parser/index";
import compiler from '../src/compiler/index'
import {installRenderHelpers} from '../src/instance/renderHelper'
import {createElement} from '../src/vdom/create-element'


function GVueTest(){
    let gvue = new GVue({
        el: '#test',
        data() {
            return {
                list: [1, 2, 3],
                map: {
                    a: '11',
                    b: '22',
                },
                c:true,
                a: 'haha',
                src: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=3339202615,3879308162&fm=26&gp=0.jpg'
            }
        },
        components: {
            testComponent: {
                template: `<div>
<p>{{props1}}</p>
<button @click="click">dsds</button>
</div>`,
                props: {
                    props1: {
                        type: String,
                        default: 'props1'
                    }
                },
                data() {
                    return {
                        a: '2222'
                    }
                },
                methods: {
                    click() {
                        this.$emit('emitTest')
                    }
                },
                created(){
                    console.log('子组件created')
                }
            }
        },
        computed: {
            computedTest() {
                return this.a + 'cccc'
            }
        },
        created() {
            console.log('created')
        },
        mounted() {
            console.log('mounted')
        },
        methods: {
            click(e) {
                this.a = 'ddd'
            },
            emitTest(){
                console.log('子组件事件触发')
            }
        }
    })

    console.log(gvue)
}
GVueTest()

function observeTest() {

    let obj = {
        a: {
            item1: '111',
            item2: '2222',
        },
        c: [1, 2]
    }
    observe(obj)
    new Watcher(obj, 'c', (value, oldValue) => {
        console.log(value, oldValue)
    })

    // obj.a.item2 = '4444'
    //  set(obj.a, 'item3', '3333')
    // obj.a.item3 = '555'
    obj.c.push(3)
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

//parseTest()

function compilerTest() {
    let dom = document.querySelector('#test')
    let render = compiler(dom.outerHTML, {})
    console.log(render)
    console.log(render.render)
}

//compilerTest()





