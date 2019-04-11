let id = 0

export class Dep {
    static target
    id

    constructor() {
        this.id = id++
    }

    depend() {
    }

    notify() {
    }
}