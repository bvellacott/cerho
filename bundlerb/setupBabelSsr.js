const fs = require('fs')
const { resolve } = require('path')
const { addHook } = require('pirates')
const watch = require('node-watch')
const babel = require('@babel/core')
const BBError = require('./BBError')
const { requireConfig } = require('./utils')
const nodeModulesRegex = require('node-modules-regexp')

const setupBabelSsr = (index) => {
	const config = requireConfig()
	
	const handleNonJs = (contents, filename) => {
		index.nonJsFiles[filename] = contents
		return ''																																			
	}

	const handleJsx = (contents, filename) => {
		if (nodeModulesRegex.test(filename)) {
			return contents
		}

		if (filename.endsWith('.svg')) {
			contents = `
import { h } from 'preact'
export default () => ${contents.replace(/\n/g, '')}
`
		}
		const transformed = babel.transformSync(contents, config.babel.server)
		return transformed.code
	}
	
	addHook(handleJsx, {
		exts: ['.js', '.jsx', '.svg'],
		ignoreNodeModules: false,
	})
	addHook(handleNonJs, {
		exts: index.nonJsExtensions,
		ignoreNodeModules: false,
	})
	
	watch(
		(config.nodeWatchPaths || []).map(
			path => resolve(process.cwd(), path)
		),
		config.nodeWatch,
		(evt, filename) => {
			try {
				if (filename && fs.statSync(filename).isFile() && require.cache[filename]) {
					console.log(`clearing ${filename} from cache`)
					try {
						module = require.cache[filename]
						require.cache[filename] = {}
						clearParentsFromCache(require.cache, [module])
					} catch (e) {
						throw new BBError(`failed to clear parent modules from cache for: ${filename}`, e)
					}
					delete require.cache[filename]
				}
			} catch (e) {
				console.error(e)
			}
		});
}

const clearParentsFromCache = (cache, modules) => {
	const parents = getParentsFromCache(cache, modules)
	if (parents.length) {
		parents.forEach(({ filename }) => {
			console.log(`clearing ${filename} from cache`)
			delete require.cache[filename]
		})
		clearParentsFromCache(cache, parents)
	}
}

const getParentsFromCache = (cache, modules) =>
	Object.values(cache)
		.filter(({ children = [] }) => modules
			.some(({ filename }) => children
				.find(({ filename: childFilename }) => childFilename === filename)))

exports.setupBabelSsr = setupBabelSsr
