const { basename } = require('path')

const jsCssBundler = {
  matcher: /\.js$/,
  bundle: (module, flattenedWithoutPrior, index, concat) => {
    [...flattenedWithoutPrior]
      .filter(module => module.css)
      .forEach(({ sourceMapFilename, css: { result: { css, map }}}) =>
      concat.add(sourceMapFilename, css, index.sourcemaps && map ? map.toString() : undefined))
    module.jsCss = module.jsCss || { result: {} }
    module.jsCss.result.concat = concat
    if (index.sourcemaps) {
      concat.add(null,
        `/*# sourceMappingURL=${basename(module.path)}${index.mapFileSuffix}${index.priorIdsString ?
          `?priorIds=${index.priorIdsString} */` :
          ' */'}`
      )
    }
  },
  invalidate: module => delete module.jsCss,
  hasCachedResult: module => !!(module.jsCss && module.jsCss.result && module.jsCss.result.concat)
}

exports.jsCssBundler = jsCssBundler
