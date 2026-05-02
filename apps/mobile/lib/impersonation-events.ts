type Listener = () => void

let listeners: Listener[] = []

export const notifyImpersonationChange = () => listeners.forEach(l => l())

export const onImpersonationChange = (fn: Listener) => {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}
