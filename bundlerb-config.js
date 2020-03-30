const postcssNested = require('postcss-nested')
const cssnano = require('cssnano')
const postcssCustomProperties = require('postcss-custom-properties')

const addMissingRequireMisc = require('./bundlerb/babel-plugins/transform-add-missing-require-misc-to-amd').default

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  // loaded before babel.config.js
  babel: {
    // run before dependencies are resolved
    // ensures that babel is able to parse the files, but doesn't
    // need to perform any transformations
    clientSyntaxPlugins: [
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'h',
        pragmaFrag: 'Fragment',
        throwIfNamespace: false,
      }],
      '@babel/plugin-proposal-class-properties',
    ],
    client: {
      // runs after all dependecies are resolved
      // these should perform all necessary transformations
      // for the browser
      presets: [
        [
          '@babel/preset-env', {
            modules: 'amd',
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-classes',
        addMissingRequireMisc,
      ],
      sourceMaps: true,
      minified: isProd,
      compact: isProd,
      comments: !isProd,
    },
    server: {
      // plugins to ensure ssr runs
      plugins: [
        '@babel/plugin-syntax-jsx',
        '@babel/plugin-transform-modules-commonjs',
      ],
    },
  },
  postcss: {
    plugins: [
      postcssNested,
      postcssCustomProperties({
        importFrom: [
          './postcssCustomProperties/colors.css',
        ],
        preserve: false,
      }),
      process.env.NODE_ENV === 'production' ? cssnano({
        preset: 'default',
      }) : undefined,
    ].filter(plugin => plugin),
  },
  nodeWatch: {
    reqursive: true,
  },
  nodeWatchPaths: [
    'src',
  ],
  ssrPaths: [
    '/index.html',
  ],
  moduleOverrides: {
    'hoist-non-react-statics': 'src/index.js',
  },
}
