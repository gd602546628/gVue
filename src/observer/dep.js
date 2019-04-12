let id = 0

export class Dep {
    static target;
    id;
    subs;

    constructor() {
        this.id = id++
        this.subs = []
    }

    depend() { //收集依赖
        if (Dep.target) {
            Dep.target.addDep(this)
        }
    }

    notify() { //触发依赖
        this.subs.forEach(sub=>{
             sub.update()
        })
    }

    removeSub(watcher) {
        let index = this.subs.indexOf(watcher)
        if(index>=0){
            this.subs.splice(index, 1)
        }
    }

    addSub(watcher) {
        this.subs.push(watcher)
    }
}

Dep.target = null
const targetStack = []

export function pushTarget(target) {
    targetStack.push(target)
    Dep.target = target
}

export function popTarget() {
    targetStack.pop()
    Dep.target = targetStack[targetStack.length - 1]
}