const { join, dirname } = require('path')
const postcss = require('postcss')
const BBError = require('./BBError')
const { requireConfig } = require('./utils')

const config = requireConfig()

const loadCssTarget = api => (module, index) => new Promise((resolve, reject) => {
  module.css = module.css || {}
  module.css.dependencyPaths = []
  postcss(config.postcss.plugins)
    .use(postcss.plugin('postcss-loader', function (options) {
      return function (root, result) {
        root.each(node => {
          if (node.type === 'atrule' && node.name === 'import') {
            if (typeof node.params !== 'string') {
              result.warn('Unable to resolve import', { node })
            }
            const matchResult = /\s*["']\s*([^'"\s]+){1}\s*["']\s*/.exec(node.params)
            if (!matchResult) {
              result.warn('Unable to resolve import', { node })
            }
            const relativePath = matchResult[1]
            const dependencyPath = `./${join(dirname(module.path), relativePath)}`
            module.css.dependencyPaths.push(dependencyPath)
            node.remove()
          }
        })
      }
    }))
    .process(module.contents, {
      from: module.sourceMapFilename,
      to: module.sourceMapFilename,
      map: {
        inline: false,
        annotation: false,
      },
    })
    .then(async result => {
      module.dependencies.push(...(await api.resolveModules(module.css.dependencyPaths, index)))
      module.css.result = result
      resolve(module)
    })
    .catch(e => reject(new BBError(`Failed to load css target '${module.path}'`, e)))
})

const postcssLoader = api => ({
  matcher: /.css$|.scss$/,
  load: loadCssTarget(api),
})

exports.loadCssTarget = loadCssTarget
exports.postcssLoader = postcssLoader
