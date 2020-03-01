const initJs = {
  matcher: /\.js$|\.mjs$/,
  load: (module) => {
    module.js = module.js || {}
    module.js.contents = module.contents
    return Promise.resolve(module)
  }
}

exports.initJs = initJs
