const Concat = require('concat-with-sourcemaps')
const { join, relative, dirname } = require('path')
const { TransformImportsToCommonRoot } = require('./babel-plugins/transform-imports-to-common-root')
const BBError = require('./BBError')
const { FsResolver } = require('./FsResolver')
const { initJs } = require('./initJs')
const { jsonLoader } = require('./jsonLoader')
const { postcssLoader } = require('./postcssLoader')
const { jsLoader } = require('./jsLoader')
const { jsTranspilerLoader } = require('./jsTranspilerLoader')
const { jsBundler } = require('./jsBundler')
const { cssBundler } = require('./cssBundler')
const { jsCssBundler } = require('./jsCssBundler')

const api = {
  defaultBaseDir: join(process.cwd()),
  defaultNodeModulesDir: join(process.cwd(), 'node_modules'),

  buildIndex: (options = {}) => ({
    nonJsFiles: {},
    nonJsExtensions: ['.scss', '.css'],
    resolvers: [ FsResolver(api, /.*/) ],
    loaders: [
      initJs,
      postcssLoader(api),
      jsonLoader,
      jsLoader(api),
      jsTranspilerLoader,
    ],
    bundlers: [
      jsBundler,
      cssBundler,
      jsCssBundler,
    ],
    aliases: {},
    basedir: api.defaultBaseDir,
    nodeModulesDir: api.defaultNodeModulesDir,
    modulesByPath: {},
    modulesArray: [],
    sourcemaps: true,
    sourceSeparator: '\n',
    mapFileSuffix: '.map',
    supportAsyncRequire: false,
    ...options,
    syntaxPlugins: options.syntaxPlugins || [],
    defaultBabelOptions: {
      ast: true,
      babelrc: false,
      configFile: false,
      moduleIds: true,
      cwd: options.basedir || api.defaultBaseDir,
      plugins: [],
      ...options.defaultBabelOptions,
    },
  }),

  invalidateCaches: (module, index) => {
    index.bundlers
      .filter(bundler => bundler.hasCachedResult(module))
      .forEach(bundler => bundler.invalidate(module))
  },

  resolveRootModule: async (_modulePath, index, context) => {
    let modulePath = _modulePath.trim()
    modulePath = modulePath.replace(/^\//, '').replace(new RegExp(`\\${index.mapFileSuffix}$`), '')
    index.rootModulePath = modulePath
    try {
      const module = await api.resolveModule(modulePath, index, context)
      if (module.resolvingPromise) {
        await module.resolvingPromise
      }
      return module
    } catch (e) {
      const module = index.modulesByPath[modulePath]
      if (module) {
        const arrayIndex = Math.max(0, index.modulesArray.indexOf(module))
        for (let i = arrayIndex; i < index.modulesArray.length; i++) {
          delete index.modulesByPath[index.modulesArray[i].path]
        }
        index.modulesArray.splice(arrayIndex, index.modulesArray.length - arrayIndex)
        throw new BBError(`Failed to resolve root module: ${modulePath}`, e)
      }
    }
  },

  resolveModule: async (modulePath, index, context = {}) => {
    try {
      let module = index.modulesByPath[modulePath]
      if (!module) {
        module = {
          filenameRelative: relative(index.basedir, join(index.basedir, modulePath)),
          path: modulePath,
          dependencies: [],
          dependants: {},
          sourceMapFilename: relative(
            join(index.basedir, dirname(index.req.path)),
            join(index.basedir, modulePath),
          ),
        }
        index.modulesByPath[modulePath] = module
        index.modulesArray.push(module)
        module.id = index.modulesArray.length - 1
        module.commonRootTransform = TransformImportsToCommonRoot(module)
      } else if (module.resolvingPromise) {
        return module
      }
      const resolvingPromise = (async () => {
        await Promise.all(index.resolvers.map(resolve => resolve(module, index, context)))
        module.dependencies.forEach(({ dependants }) => dependants[module.id] = module)
        await api.resolveModules(module.dependencies.map(({ path }) => path), index, false, context)
        return module
      })()
      module.resolvingPromise = resolvingPromise
      await module.resolvingPromise
      delete module.resolvingPromise
      return resolvingPromise
    } catch (e) {
      throw new BBError('Unknown error resolving module - this might be a result of another module not resolving', e)
    }
  },

  resolveModules: (modulePaths = [], index, context = {}) => Promise
    .all(modulePaths
      .map(modulePath =>
      api.resolveModule(modulePath, index, context)
    )),

  updateModule: async (modulePath, index) => {
    const module = index.modulesByPath[modulePath]
    api.invalidateCaches(module, index)
    module.dependencies = []
    module.dependants = {}
    try {
      for (let i = 0; i < index.loaders.length; i++) {
        const { matcher, load } = index.loaders[i]
        if (!matcher || matcher.test(modulePath, module)) {
          await load(module, index)
        }
      }
    } catch (e) {
      throw new BBError(`Failed to update module '${modulePath}'`, e)
    }
    return module
  },

  // can this be run on a separate thread?
  concatenate: (module, index, priorIdsString, res) => {
    if (module.concat) {
      return
    }
    const priorIds = (priorIdsString || '').split(',')
      .reduce((ids, id) => {
        if (!id) {
          return ids
        }
        const priorModules = {}
        api.flatten(index.modulesArray[id], priorModules)
        Object.keys(priorModules).forEach(id => { ids[id] = true })
        return ids
      }, {})

    const alreadyResolved = {}
    const flattenedWithoutPrior = api
      .flatten(module)
      .reverse()
      .filter(module => {
        if (alreadyResolved[module.id] || priorIds[module.id]) {
          return false
        }
        alreadyResolved[module.id] = module
        return true
      })

    res.setHeader('loaded-root-ids', module.id)
    return Promise.all(index.bundlers
      .filter(({ matcher }) => matcher && matcher.test(module.path, module))
      .reduce((promises, bundler) => {
        const { bundle } = bundler
        const concat = new Concat(
          index.sourcemaps,
          `${module.path}${priorIdsString ? `?priorIds=${priorIdsString}` : ''}`,
          index.sourceSeparator
        )
        promises.push(bundle(
          module,
          flattenedWithoutPrior,
          index,
          concat,
          priorIdsString,
        ))
        return promises
      }, []))
  },

  findCircularModules: (module, path = [], circularModules = {}) => {
    let isCircularMember = false; 
    for (let i = 0; i < path.length; i++) {
      const pathMember = path[i]
      if (pathMember === module) {
        isCircularMember = true
      }
      if (isCircularMember) {
        pathMember.isCircularMember = isCircularMember
        circularModules[pathMember.id] = pathMember
      }
    }
    if (!isCircularMember) {
      module.dependencies.forEach(dependency =>
        api.findCircularModules(dependency, [...path, module], circularModules)
      )
    }
    return circularModules
  },

  flattenNonCircular: (module, modules = {}, inResolveOrder = []) => {
    modules[module.id] = module
    inResolveOrder.push(module)
    if (module.dependencies) {
      for (let i = module.dependencies.length - 1; i >= 0; i--) {
        const dependency = module.dependencies[i]
        if (!dependency.isCircularMember) {
          api.flattenNonCircular(dependency, modules, inResolveOrder)
        }
      }
    }
    return inResolveOrder
  },

  flatten: (module, modules = {}, inResolveOrder = []) => {
    const circularModules = api.findCircularModules(module)
    const modulesToFlatten = Object.values(circularModules)
    if (!circularModules[module.id]) {
      modulesToFlatten.unshift(module)
    }
    modulesToFlatten.forEach(mtf => api.flattenNonCircular(mtf, modules, inResolveOrder))
    return inResolveOrder
  },

  bundlerBee: (index = api.buildIndex()) => async (req, res, next) => {
    const { modulePath, query: { priorIds: priorIdsString, loadStyles } } = req
    try {
      const requestIndex = {...index, priorIdsString, loadStyles: !!loadStyles, req, res }
      const module = await api.resolveRootModule(modulePath, requestIndex, true)
      res.setHeader('moduleId', module.id)
      res.setHeader('allIds', JSON.stringify(requestIndex.modulesArray.map(module => module.id)))
      await api.concatenate(module, requestIndex, priorIdsString, res)
      req.module = module
      next()
    } catch (error) {
      console.log(error)
      res.statusCode = 500
      res.statusMessage = `failed to bundle ${module.path}`
      res.send(error && error.message || error)
    }
  },
}

module.exports = api
