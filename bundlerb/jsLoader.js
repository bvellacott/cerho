const { join, relative } = require('path')
const babel = require('@babel/core')
const BBError = require('./BBError')

const loadJsDependencies = api => (module, index) => new Promise((resolve, reject) => {
  module.js = module.js || { result: {} }
  const result = module.js.result
  const { code, ast } = result || {}
  module.js.dependencyPaths = module.js.dependencyPaths || []
  const babelOptions = {
    ...index.defaultBabelOptions,
    cwd: index.basedir,
    moduleId: module.path,
    filename: join(index.basedir, module.path),
    filenameRelative: relative(index.basedir, join(index.basedir, module.path)),
    sourceFileName: module.sourceMapFilename,
    plugins: [
      ...index.syntaxPlugins,
      module.commonRootTransform,
    ]
  }
  babel[ast ? 'transformFromAst' : 'transform'](
    ast || code || module.js.contents, 
    {
      ...babelOptions,
      sourceMaps: true,
    }, 
    async (err, result = {}) => {
      if (err) {
        return reject(new BBError(`Failed find dependencies for '${module.path}'`, err))
      }
      try {
        module.dependencies.push(...(await api.resolveModules(module.js.dependencyPaths, index)))
        module.js.result = result
        resolve(module)
      } catch (e) {
        reject(new BBError(`Failed find dependencies for '${module.path}'`, e))
      }
    },
  )
})

const jsLoader = api => ({
  matcher: /\.js$|\.mjs$.css$|.scss$.svg$.json$/,
  load: loadJsDependencies(api),
})

exports.loadJsDependencies = loadJsDependencies
exports.jsLoader = jsLoader
