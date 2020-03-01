const { join } = require('path')
const BuiltinModule = require('module')
const { moduleAliases } = require('../package.json')

// Guard against poorly mocked module constructors
var Module = module.constructor.length > 1
  ? module.constructor
  : BuiltinModule

const aliases = Object.keys(moduleAliases || {}).map(alias => ({
  regex: new RegExp(`^${alias}`),
  aliasedPath: moduleAliases[alias],
}))
  
const transformAlias = (path, basedir = process.cwd()) => {
  for (let i = 0; i < aliases.length; i++) {
    const { regex, aliasedPath } = aliases[i];
    if (regex.test(path)) {
      const noAlias = path.replace(regex, '')
      return join(basedir, aliasedPath, noAlias)
    }
  }
  return path;
}

const setupAliases = () => {
  const oldResolveFilename = Module._resolveFilename
  Module._resolveFilename = function (request, parentModule, isMain, options) {
    const transformedRequest = transformAlias(request)
    return oldResolveFilename.call(this, transformedRequest, parentModule, isMain, options)
  }	
}

exports.aliases = aliases
exports.transformAlias = transformAlias
exports.setupAliases = setupAliases
