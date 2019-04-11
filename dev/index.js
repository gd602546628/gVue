import GVue from '../src/index'
import {observe} from "../src/observer";


function observeTest() {

    let obj = {
        a: {
            b: {
                c: 333
            }
        }
    }
    observe(obj)
    obj.a.b.c = 444
    console.log(obj.a.b.c)
    console.log(obj)
}

observeTest()
