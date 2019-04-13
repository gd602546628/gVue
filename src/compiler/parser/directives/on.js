

export default function on (el, dir) {
  if ( dir.modifiers) {
    console.warn(`v-on without argument does not support modifiers.`)
  }
  el.wrapListeners = (code) => `_g(${code},${dir.value})`
}
