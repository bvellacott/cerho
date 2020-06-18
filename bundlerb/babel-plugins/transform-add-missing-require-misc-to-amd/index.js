const {
  identifier,
  stringLiteral,
} = require('@babel/types')
const {
  isValidRequireCall,
  isValidDefinePropertyCallOnExports,
} = require('../../utils')

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

    function addDefineParam(dependencyName, defineCallExpression, paramName) {
      try {
        const arrayExpression = defineCallExpression.node.arguments[1]
        const functionExpression = defineCallExpression.node.arguments[2]
        const elements = arrayExpression.elements
        const params = functionExpression.params
        elements.unshift(stringLiteral(dependencyName))
        params.unshift(identifier(paramName || dependencyName))
        functionExpression.params = params
        arrayExpression.elements = elements
      } catch (e) {
        console.log(e)
      }
    }

    const RequireMiscVisitor = (requireDependencies) => {
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
          if (isValidRequireCall(requireCall)) {
            visitor.hasUnpassedRequire = true;
            requireDependencies.push(requireCall.node.arguments[0].value)
          }
        },
        ExpressionStatement(definePropertyCall) {
          if (isValidDefinePropertyCallOnExports(definePropertyCall)) {
            visitor.hasUnpassedExports = true;
          }
        },
      }
      return visitor
    }

    const AmdVisitor = () => ({
      CallExpression(callExpression) {
        if (!isValidDefineCall(callExpression)) return
        const requireDependencies = []
        const visitor = RequireMiscVisitor(requireDependencies)
        callExpression.traverse(
          visitor,
          this,
        );
        requireDependencies
          .reverse()
          .forEach((dep, i) => addDefineParam(dep, callExpression, `_$${i}`))

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