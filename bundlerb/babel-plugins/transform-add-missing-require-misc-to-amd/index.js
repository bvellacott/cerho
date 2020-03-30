const {
  identifier,
  stringLiteral,
} = require('@babel/types')

const TransformAddMissingRequireMisc = () => {
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

    function isDefineParamAlreadyPassed(paramName, defineCallExpression) {
      const functionExpression = defineCallExpression.get('arguments')[2]
      const params = functionExpression.get('params')
      for (let i = 0; i < params.length; i += 1) {
        const { type, name } = params[i] || {}
        if (type === 'Identifier' && name === paramName) {
          return true
        }
      }
      return false
    }

    function addDefineParam(paramName, defineCallExpression) {
      try {
        const arrayExpression = defineCallExpression.node.arguments[1]
        const functionExpression = defineCallExpression.node.arguments[2]
        const elements = arrayExpression.elements
        const params = functionExpression.params
        elements.unshift(stringLiteral(paramName))
        params.unshift(identifier(paramName))
        functionExpression.params = params
        arrayExpression.elements = elements
      } catch (e) {
        console.log(e)
      }
    }

    const RequireMiscVisitor = () => {
      const visitor = {
        AssignmentExpression(assignmentExpression) {
          if (assignmentExpression.get('left').isMemberExpression()) {
            const object = assignmentExpression.get('left').get('object')
            let name;
            if (object.isIdentifier()) {
              name = object.node.name
            } else if (object.get('object').isIdentifier()) {
              name = object.get('object').node.name
            }
            if (name === 'exports') {
              visitor.hasUnpassedExports = true;
            } else if (name === 'module') {
              visitor.hasUnpassedModule = true;
            }
          }
        },
        CallExpression(requireCall) {
          if (
            requireCall.get('callee').isIdentifier({ name: 'require' }) &&
            !requireCall.scope.getBinding('require')
          ) {
            visitor.hasUnpassedRequire = true;
          }
        },
      }
      return visitor
    }

    const AmdVisitor = () => ({
      CallExpression(callExpression) {
        if (!isValidDefineCall(callExpression)) return
        const visitor = RequireMiscVisitor()
        callExpression.traverse(
          visitor,
          this,
        );
        if (!isDefineParamAlreadyPassed('require', callExpression) && visitor.hasUnpassedRequire) {
          addDefineParam('require', callExpression)
        }
        if (!isDefineParamAlreadyPassed('exports', callExpression) && visitor.hasUnpassedExports) {
          addDefineParam('exports', callExpression)
          if (!isDefineParamAlreadyPassed('module', callExpression)) {
            addDefineParam('module', callExpression)
          }
        } else if (!isDefineParamAlreadyPassed('module', callExpression) && visitor.hasUnpassedModule) {
          addDefineParam('module', callExpression)
        }
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

exports.TransformAddMissingRequireMisc = TransformAddMissingRequireMisc

exports.default = TransformAddMissingRequireMisc();
