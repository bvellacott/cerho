const loadJsonTarget = (module) => new Promise((resolve) => {
  module.js = module.js || { result: {} }
  module.js.contents = `export default ${module.contents}`
  return resolve(module)
})

const jsonLoader = {
  matcher: /.json$/,
  load: loadJsonTarget,
}

exports.loadJsonTarget = loadJsonTarget
exports.jsonLoader = jsonLoader
