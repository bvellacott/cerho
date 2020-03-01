const fs = require('fs')
const path = require('path')

const FsResolver = (api, matcher) => (module, index) => {
  if (!matcher.test(module.path)) {
    return module
  }
  return new Promise((resolve, reject) => {
    fs.stat(path.join(index.basedir, module.path), (err, stats) => {
      if (err) {
        reject(err)
      } else if (
        module.fstats &&
        stats.mtimeMs === module.fstats.mtimeMs) {
        resolve(module)
      } else {
        module.fstats = stats
        const absolutePath = path.join(index.basedir, module.path)
        if (
          index.nonJsExtensions.find(ext => absolutePath.endsWith(ext) &&
          index.nonJsFiles[absolutePath]
        )) {
          updateIfChanged(
            module,
            index.nonJsFiles[absolutePath],
            api,
            index,
            resolve,
            reject,
          )          
        } else {
          fs.readFile(absolutePath, 'utf8', (err, contents) => {
            if (err) {
              return reject(err)
            }
            updateIfChanged(
              module,
              contents,
              api,
              index,
              resolve,
              reject,
            )
          })
        }
      }
    })
  })
}

const updateIfChanged = (module, contents, api, index, resolve, reject) => {
  if (
    !module.contents ||
    contents.length !== module.contents.length ||
    contents !== module.contents
  ) {
    module.contents = contents
    api.updateModule(module.path, index)
      .then(resolve)
      .catch(reject)
  } else {
    resolve(module)
  }
}

module.exports.FsResolver = FsResolver
