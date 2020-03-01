const {
  identifier,
  stringLiteral,
} = require('@babel/types')

const TransformImportsToCommonRoot = (module = {}, aliases = {}) => {
  return function() {
    function isValidDefineCall(nodepath) {
      if (!nodepath.isCallExpression()) return false;
      if (!nodepath.get('callee').isIdentifier({ name: 'define' })) {
        return false;
      }

      const args = nodepath.get('arguments');
      if (args.length !== 3) return false;

      if (
        !args[0].isStringLiteral() || 
        !args[1].isArrayExpression() ||
        !args[2].isFunctionExpression()
      ) {
        return false;
      }

      return true;
    }

    function hasUnpassedExports(nodepath) {
      try {
        const arrayExpression = nodepath.get('arguments')[1]
        const functionExpression = nodepath.get('arguments')[2]
        const elements = arrayExpression.get('elements')
        const params = functionExpression.get('params')
        for (let i = 0; i < params.length; i += 1) {
          const { type, name } = params[i] || {}
          if (type === 'Identifier' && name === 'exports') {
            return false
          }
        }
        const body = functionExpression.get('body').get('body')
        for (let i = 0; i < body.length; i += 1) {
          const child = body[i]
          if (
            child.isExpressionStatement() &&
            child.get('expression').isAssignmentExpression() &&
            child.get('expression').get('left').isMemberExpression() &&
            child.get('expression').get('left').get('object').isIdentifier() &&
            child.get('expression').get('left').get('object').node.name === 'exports'
          ) {
            elements.unshift(stringLiteral('exports'))
            params.unshift(identifier('exports'))
            functionExpression.set('params', params)
            arrayExpression.set('elements', elements)
            break
          }
        };
      } catch (e) {
        console.log(e)
      }
    }

    const AmdVisitor = () => ({
      CallExpression(nodepath) {
        if (!isValidDefineCall(nodepath) || !hasUnpassedExports(nodepath)) return;

      },
    });

    return {
      visitor: {
        Program: {
          exit(nodepath, { cwd, filename }) {
            if (this.ran) return;
            this.ran = true;

            nodepath.traverse(
              AmdVisitor(),
              this,
            );
          },
        },
      },
    };
  };
};

exports.TransformImportsToCommonRoot = TransformImportsToCommonRoot

exports.default = TransformImportsToCommonRoot();
