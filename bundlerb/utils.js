const { join, relative, resolve } = require('path')

const defaultConfig = {
  babel: {
    clientSyntaxPlugins: [],
    client: {
      plugins: [],
    },
    server: {
      plugins: [],
    },
  },
  postcss: {
    plugins: [],
  },
}

// const relativeCwd = relative(__dirname, )
const configPath = join(process.cwd(), 'bundlerb-config')
const requireConfig = () => {
  try {
    const config = require(configPath) || {}
    return {
      ...defaultConfig,
      ...config,
    }
  } catch(e) {
    console.error(e)
    console.log(`unable to resolve config path at ${configPath} - using empty config instead`)
    return defaultConfig;
  }
}

exports.defaultConfig = defaultConfig
exports.requireConfig = requireConfig
