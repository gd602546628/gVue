import {initExtend, ASSET_TYPES} from './extend'

export function initGlobalApi(GVue) {
    GVue.options = Object.create(null)
    ASSET_TYPES.forEach(type => {
        GVue.options[type + 's'] = Object.create(null)
    })

    GVue.options._base = GVue
    initExtend(GVue)
}