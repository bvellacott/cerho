require('bueno-repo').setupAliases()

const { join } = require('path')
const express = require('express')
const { setupBabelSsr } = require('../setupBabelSsr')
const { buildIndex, bundlerBee } = require('..')
const { requireConfig } = require('../utils')

const config = requireConfig()

const app = express();

const index = buildIndex({
  defaultBabelOptions: config.babel.client,
  syntaxPlugins: config.babel.clientSyntaxPlugins,
})

setupBabelSsr(index)
const bundler = bundlerBee(index)

const ssrJsx = (relativeModulePath, req, res) => {
  const modulePath = join(process.cwd(), relativeModulePath)
  const render = require(modulePath).default
  res.setHeader('Content-Type', 'text/html;charset=UTF-8')
  res.send(render(req, res))
}

app.get('*', (req, res, next) => {
  // console.log('CALLING:', req.path)
  next()
})
if (config.discardPaths && config.discardPaths.length) {
  app.get(config.discardPaths, (req, res, next) => {
    res.setHeader('Content-Type', 'text/plain;charset=UTF-8')
    res.send('')
    // console.log('DISCARDED:', req.path)
  })
}
app.use(express.static('static'))
if (config.ssrIndex) {
  app.get(
    config.ssrPaths || [],
    (req, res, next) => ssrJsx(config.ssrIndex, req, res, next),
  )
}
app.get(['/*.jsx'], ssrJsx)
app.get(['/*.js', '/*.js.map', '/*.mjs', '/*.mjs.map', '/*.scss', '/*.scss.map', '/*.css', '/*.css.map'],
  (req, res, next) => {
    req.modulePath = req.path
    return bundler(req, res, next)
  })
app.get(['/*.jscss', '/*.jscss.map'], (req, res, next) => {
  req.modulePath = req.path.replace(/\.jscss/, '.js')
  return bundler(req, res, next)
})
app.get(['/*.js', '/*.mjs'], (req, res) => {
  res.setHeader('Content-Type', 'text/javascript;charset=UTF-8')
  res.send(req.module.js.result.concat.content)
})
app.get(['/*.js.map', '/*.mjs.map'], (req, res) => {
  res.setHeader('Content-Type', 'application/json;charset=UTF-8')
  res.send(req.module.js.result.concat.sourceMap)
})
app.get('/*.scss', (req, res) => {
  res.setHeader('Content-Type', 'text/css;charset=UTF-8')
  res.send(req.module.css.result.concat.content)
})
app.get('/*.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css;charset=UTF-8')
  res.send(req.module.css.result.concat.content)
})
app.get('/*.jscss', (req, res) => {
  res.setHeader('Content-Type', 'text/css;charset=UTF-8')
  res.send(req.module.jsCss.result.concat.content)
})
app.get('/*.jscss.map', (req, res) => {
  res.setHeader('Content-Type', 'text/css;charset=UTF-8')
  res.send(req.module.jsCss.result.concat.sourceMap)
})
app.get('/*.scss.map', (req, res) => {
  res.setHeader('Content-Type', 'application/json;charset=UTF-8')
  res.send(req.module.css.result.concat.sourceMap)
})
app.get('/*.css.map', (req, res) => {
  res.setHeader('Content-Type', 'application/json;charset=UTF-8')
  res.send(req.module.css.result.concat.sourceMap)
})
app.use(express.static(process.cwd()))

app.listen(4000);
