const { dirname } = require('path')
const { isModule } = require('@babel/helper-module-transforms')
const {
  requireToPath,
  isValidRequireCall,
} = require('../../utils')

const TransformImportsToCommonRoot = (module = {}) => {
  return function() {
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
