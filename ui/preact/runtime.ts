const cache: Record<string, object> = {}
function r (modules: string | string[], resolve?: Function): object | Promise<object> {
  if (Array.isArray(modules)) {
    Promise.all(
      modules.map(mdl =>
        new Promise(resolve => {
          const script = document.createElement('script')
          script.src = './dist/' + mdl.slice(2) + '.js';
          script.onload = () => resolve(cache[mdl])
          document.head.appendChild(script);
        })
      )
    ).then(m => resolve(m))
    return
  }

  if (!cache[modules]) throw new Error('Module not found')
  return cache[modules]
}

(window as any).d = function d (id: string, deps: string[], mdl: Function) {
  if (!mdl) {
    mdl = deps as unknown as Function
    deps = []
  }

  const e = {}
  const args = []
  for (let i = 0; i < deps.length; i++) {
    const dep = deps[i]
    if (dep === 'require') args.push(r)
    else if (dep === 'exports') args.push(e)
    else r(dep)
  }

  mdl.apply(null, args)
  cache[id] = e
}
