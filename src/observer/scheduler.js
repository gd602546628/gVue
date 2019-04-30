let has = {}
let waiting = false
let flushing = false
let queue = []
let index = 0
const activatedChildren = []
function resetSchedulerState() {
    index = queue.length = activatedChildren.length = 0
    has = {}
    waiting = flushing = false
}

function flushSchedulerQueue() {
    flushing = true
    let watcher, id


    // 更新前 先对watcher排序
    // 1 组件更新，先更新父组件，再更新子组件，父组件总是先创建，所以id比较小
    // 2 用户创建的watcher先于 render watcher
    // 3 子组件在父组件更新期间被销毁的，子组件的watcher将会被跳过
    queue.sort((a, b) => a.id - b.id)

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        if (watcher.before) {
            watcher.before()
        }
        id = watcher.id
        has[id] = null
        watcher.run()
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice()
    const updatedQueue = queue.slice()

    resetSchedulerState()

    // call component updated and activated hooks
    // callActivatedHooks(activatedQueue)
    //   callUpdatedHooks(updatedQueue)


}


// 异步watcher执行，每次触发依赖的set，都将watcher丢入队列，等调用栈完成后再一次执行watcher.run,
export function queueWatcher(watcher) {
    let id = watcher.id
    if (!has[id]) {
        has[id] = true
        if (!flushing) {
            queue.push(watcher)
        } else {
            // if already flushing, splice the watcher based on its id
            // if already past its id, it will be run next immediately.
            let i = queue.length - 1
            while (i > index && queue[i].id > watcher.id) {
                i--
            }
            queue.splice(i + 1, 0, watcher)
        }
        // queue the flush
        if (!waiting) {
            waiting = true
            nextTick(flushSchedulerQueue)
        }
    }
}


// 调用nextTick,传入的cb都丢进一个数组，并将runCallBack，丢入macrotask (这里可以使用Promise,丢入最后执行的microtask)
// 这样做能保证调用栈中所有nextTick执行完，再一次执行callback
let pending = false
let callbacks = []

function runCallBack() {
    pending = false
    let copy = callbacks.slice(0)
    callbacks.length = 0
    copy.forEach(cb => {
        cb()
    })
}

export function nextTick(cb, ctx) {
    callbacks.push(() => {
        try {
            cb.call(ctx)
        } catch (e) {
            console.error('$nextTick回调错误', e)
        }
    })
    if (!pending) {
        pending = true
        setTimeout(runCallBack, 0)
    }
}

export function queueActivatedComponent (vm) {
    // setting _inactive to false here so that a render function can
    // rely on checking whether it's in an inactive tree (e.g. router-view)
    vm._inactive = false
    activatedChildren.push(vm)
}