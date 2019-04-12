let id = 0
import {parsePath} from '../util'
import {popTarget, pushTarget} from './dep'

export class Watcher {
    id;
    vm;
    deps;
    newDeps;
    depIds;
    newDepIds;
    getter;
    value;
    expression;
    cb;

    constructor(vm, expOrFn, cb, options, isRenderWatcher) {
        this.id = id++
        this.vm = vm
        this.deps = []
        this.newDeps = []
        this.depIds = new Set()
        this.newDepIds = new Set()
        this.expression = expOrFn.toString()
        this.cb = cb
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            this.getter = parsePath(expOrFn)
        }

        this.value = this.get()
    }

    get() {
        pushTarget(this)
        const vm = this.vm
        let value
        try {
            value = this.getter.call(vm, vm)
        } catch (e) {
            console.log(e)
            console.warn('调用watcher时传入表达式有误，表达式：' + this.expression)
        } finally {
            popTarget()
            this.cleanupDeps()
        }

        return value
    }

    addDep(dep) {
        const id = dep.id
        if (!this.newDepIds.has(id)) {
            this.newDeps.push(dep)
            this.newDepIds.add(id)
            if (!this.depIds.has(id)) {
                this.depIds.add(id)
                dep.addSub(this)
            }
        }
    }

    cleanupDeps() {
        let i = this.deps.length
        while (i--) {
            const dep = this.deps[i]
            if (!this.newDepIds.has(dep.id)) { // 清除再次求值时的无效依赖
                dep.removeSub(this)
            }
        }
        let tmp = this.depIds
        this.depIds = this.newDepIds
        this.newDepIds = tmp
        this.newDepIds.clear()
        tmp = this.deps
        this.deps = this.newDeps
        this.newDeps = tmp
        this.newDeps.length = 0
    }

    update() {
        this.run()
    }

    run() {
        let value = this.get()
        let oldValue = this.value
        this.value = value
        if (oldValue !== value) {
            this.cb.call(this.vm, value, oldValue)
        }
    }


}