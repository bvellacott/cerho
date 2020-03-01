const { basename } = require('path')

const jsBundler = {
  matcher: /\.js$|\.mjs$/,
  bundle: (module, flattenedWithoutPrior, index, concat) => {
    const flattenedWithoutPriorReversed = flattenedWithoutPrior.reverse()
    if (index.supportAsyncRequire) {
      concat.add(null, `window.define.priorIds.push(${module.id});`)
      if (index.loadStyles) {
        concat.add(null,
          `(function() { var e = document.createElement('link'); e.setAttribute('href', '${module.path.replace(/\.js$/, '.jscss')}'); e.setAttribute('rel', 'preload'); e.setAttribute('as', 'style'); e.setAttribute('onload', "this.rel='stylesheet'"); document.getElementsByTagName('head')[0].appendChild(e); })()`
        )
      }
    }
    for (let i = 0; i < flattenedWithoutPriorReversed.length; i++) {
      const { path, sourceMapFilename, js } = flattenedWithoutPriorReversed[i]
      if (!js) {
        throw new Error(`the module '${path} has no js target'`)
      } else if (!js.result) {
        throw new Error(`the module '${path} has no js target result'`)
      } else if (!js.result.code) {
        throw new Error(`the module '${path} has no js target result code'`)
      }
      const { result: { code, map }} = js
      concat.add(sourceMapFilename, code, index.sourcemaps ? map : undefined)
    }
    module.js = module.js || { result: {} }
    module.js.result.concat = concat
    if (index.sourcemaps) {
      concat.add(null,
        `//# sourceMappingURL=${basename(module.path)}${index.mapFileSuffix}${index.priorIdsString ?
          `?priorIds=${index.priorIdsString}` :
          ''}`
      )
    }
  },
  invalidate: (module) => delete module.js,
  hasCachedResult: module => !!module.js
}

exports.jsBundler = jsBundler
