const { join, relative } = require('path')
const babel = require('@babel/core')
const BBError = require('./BBError')

const transpileJs = (module, index) => new Promise((resolve, reject) => {
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
      ...index.defaultBabelOptions.plugins,
    ],
    babelrc: true,
    configFile: true,
  }
  const callback = (err, result = {}) => {
    if (err) {
      return reject(err)
    }
    try {
      module.js.result = result
      resolve(module)
    } catch (e) {
      reject(new BBError(`Failed to transpile module '${module.path}'`, e))
    }
  }
  if (ast) {
    babel.transformFromAst(ast, code, babelOptions, callback)
  } else {
    babel.transform(code || module.js.contents, babelOptions, callback)
  }
})

const jsTranspilerLoader = {
  matcher: /\.js$|\.mjs$|.css$|.svg$|.json$|.scss$/,
  load: transpileJs,
}

exports.transpileJs = transpileJs
exports.jsTranspilerLoader = jsTranspilerLoader
