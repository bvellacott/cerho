const { basename } = require('path')

const cssBundler = {
  matcher: /\.css$|.scss$/,
  bundle: (module, flattenedWithoutPrior, index, concat) => {
    flattenedWithoutPrior
      .reverse()
      .forEach(({ sourceMapFilename, css: { result: { css, map }}}) =>
        concat.add(sourceMapFilename, css, index.sourcemaps && map ? map.toString() : undefined))
    module.css = module.css || { result: {} }
    module.css.result.concat = concat
    if (index.sourcemaps) {
      concat.add(null,
        `/*# sourceMappingURL=${basename(module.path)}${index.mapFileSuffix}${index.priorIdsString ?
          `?priorIds=${index.priorIdsString} */` :
          ' */'}`
      )
    }
  },
  invalidate: module => delete module.css,
  hasCachedResult: module => !!(module.css && module.css.result && module.css.result.concat)
}

exports.cssBundler = cssBundler
