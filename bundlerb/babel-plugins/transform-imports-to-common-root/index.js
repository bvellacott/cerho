const { relative, dirname, join } = require('path')
const resolve = require('resolve')
const nodeLibs = require('node-libs-browser') // this is to mock the node libraries for the browser
const { isModule } = require('@babel/helper-module-transforms')
const { transformAlias } = require('../../aliases')
const { requireConfig } = require('../../utils')

const { moduleOverrides = {} } = requireConfig()

const packageFilter = pkg => ({
  ...pkg,
  main: moduleOverrides[pkg.name] || pkg.module || pkg.main,
})

const requireToPath = (req, filedir, basedir) =>
  relative(
    basedir,
    resolve.sync(
      resolveAlias(req, basedir),
      { basedir: filedir, packageFilter },
    ),
  )

const resolveAlias = (path, basedir) => {
  if (nodeLibs[path]) {
    return nodeLibs[path]
  }
  return transformAlias(path, basedir);
}

const TransformImportsToCommonRoot = (module = {}) => {
  return function() {
    function isValidRequireCall(nodepath) {
      if (!nodepath.isCallExpression()) return false;
      if (!nodepath.get('callee').isIdentifier({ name: 'require' })) {
        return false;
      }
      if (nodepath.scope.getBinding('require')) return false;

      const args = nodepath.get('arguments');
      if (args.length !== 1) return false;

      const arg = args[0];
      if (!arg.isStringLiteral()) return false;

      return true;
    }

    const AmdVisitor = (filedir, basedir, dependencyPaths) => ({
      CallExpression(nodepath) {
        if (!isValidRequireCall(nodepath)) return;
        const req = nodepath.node.arguments[0].value;
        const newPath = requireToPath(req, filedir, basedir);
        nodepath.node.arguments[0].value = newPath;
        dependencyPaths.push(newPath);
      },
    });

    return {
      visitor: {
        Program: {
          exit(nodepath, { cwd, filename }) {
            if (this.ran) return;
            this.ran = true;

            const filedir = dirname(filename);
            module.js = module.js || {};
            module.js.dependencyPaths = module.js.dependencyPaths || [];
            const es6Imports = getEs6Imports(nodepath, filedir, cwd)
            es6Imports.forEach(dep => module.js.dependencyPaths.push(dep))
            nodepath.traverse(
              AmdVisitor(filedir, cwd, module.js.dependencyPaths),
              this,
            );
          },
        },
      },
    };
  };
};

const getEs6Imports = (path, filedir, basedir, aliases) => {
  if (!isModule(path)) return [];
  return path.get('body')
    .filter(child => 
      (child.isImportDeclaration() || child.isExportDeclaration()) && child.get('source').node)
    .map(child => {
      const newPath = requireToPath(child.get('source').node.value, filedir, basedir, aliases)
      child.get('source').node.value = newPath
      return newPath
    })
}

exports.TransformImportsToCommonRoot = TransformImportsToCommonRoot

exports.default = TransformImportsToCommonRoot()
