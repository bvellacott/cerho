const { join, relative } = require('path')
const resolve = require('resolve')
const { transformAlias } = require('bueno-repo')

const defaultConfig = {
  babel: {
    clientSyntaxPlugins: [],
    client: {
      plugins: [],
    },
    server: {
      plugins: [],
    },
  },
  postcss: {
    plugins: [],
  },
}

const configPath = join(process.cwd(), 'bundlerb-config')
const requireConfig = () => {
  try {
    const config = require(configPath) || {}
    return {
      ...defaultConfig,
      ...config,
    }
  } catch(e) {
    console.error(e)
    console.log(`unable to resolve config path at ${configPath} - using empty config instead`)
    return defaultConfig;
  }
}

const packageFilter = pkg => {
  const { moduleOverrides = {} } = requireConfig()
  return {
    ...pkg,
    main: moduleOverrides[pkg.name] || pkg.module || pkg.main,
  }
}

const requireToPath = (req, filedir, basedir) => {
  const withAliasResolved = transformAlias(req, basedir)
  let absolutePath
  if (
    !withAliasResolved.startsWith('/') &&
    !withAliasResolved.startsWith('.')
  ) {
    // try and resolve from root node_modules first
    try {
      absolutePath = resolve.sync(
        withAliasResolved,
        { basedir, packageFilter },
      )
    } catch (e) { }
  } 
  if (!absolutePath) {
    // and then relative to the requiring module
    absolutePath = resolve.sync(
      withAliasResolved,
      { basedir: filedir, packageFilter },
    )
  }
  return `./${relative(basedir, absolutePath)}`
}

const isValidRequireCall = nodepath => {
  if (!nodepath.isCallExpression()) return false
  if (!nodepath.get('callee').isIdentifier({ name: 'require' })) {
    return false
  }
  if (nodepath.scope.getBinding('require')) return false

  const args = nodepath.get('arguments')
  if (args.length !== 1) return false

  const arg = args[0]
  if (!arg.isStringLiteral()) return false

  return true;
}

const isValidDefinePropertyCallOnExports = nodepath => {
  if (!nodepath.isExpressionStatement()) return false
  const { expression } = nodepath.node
  if (!expression || expression.type !== 'CallExpression') return false
  const { callee, arguments: args } = expression
  if (!callee || callee.type !== 'MemberExpression') return false
  const { object, property } = callee
  if (!object || !property || object.name !== 'Object' || property.name !== 'defineProperty') return false
  
  if (args.length !== 3) return false;
  if (args[0].name !== 'exports') return false;
  if (args[1].type !== 'StringLiteral') return false;
  if (args[2].type !== 'ObjectExpression') return false;

  return true;
}

Object.defineProperty(exports, "__esModule", { value: true });

exports.defaultConfig = defaultConfig
exports.requireConfig = requireConfig
exports.packageFilter = packageFilter
exports.requireToPath = requireToPath
exports.isValidRequireCall = isValidRequireCall
exports.isValidDefinePropertyCallOnExports = isValidDefinePropertyCallOnExports
