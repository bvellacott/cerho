const postcssNested = require('postcss-nested')
const cssnano = require('cssnano')
const postcssCustomProperties = require('postcss-custom-properties')

const addMissingRequireMisc = require('./bundlerb/babel-plugins/transform-add-missing-require-misc-to-amd').default

const isProd = process.env.NODE_ENV === 'production'

const jsxPluginConfig = [
  '@babel/plugin-transform-react-jsx', {
    pragma: 'h',
    pragmaFrag: 'Fragment',
    throwIfNamespace: false,
  },
]

module.exports = {
  // loaded before babel.config.js
  babel: {
    // run before dependencies are resolved
    // ensures that babel is able to parse the files, but doesn't
    // need to perform any transformations
    clientSyntaxPlugins: [
      '@babel/plugin-syntax-jsx',
    ],
    client: {
      // runs after all dependecies are resolved
      // these should perform all necessary transformations
      // for the browser
      // ... understanding plugin and preset ordering is essential here
      presets: [
        {
          plugins: [
            jsxPluginConfig,
            '@babel/plugin-transform-classes',
            '@babel/plugin-transform-destructuring',
            addMissingRequireMisc,
          ],
        }, [
          '@babel/preset-env', {
            modules: 'amd',
          },
        ], 
      ],
      sourceMaps: true,
      minified: isProd,
      compact: isProd,
      comments: !isProd,
      retainLines: !isProd,
    },
    server: {
      // plugins to ensure ssr runs
      plugins: [
        jsxPluginConfig,
        '@babel/plugin-transform-modules-commonjs',
      ],
    },
  },
  postcss: {
    plugins: [
      postcssNested,
      postcssCustomProperties({
        importFrom: [
          './postcssCustomProperties/constants.css',
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
  ssrIndex: '/src/index.jsx',
  ssrPaths: [
    '/index.html',
  ],
  moduleOverrides: {
    'hoist-non-react-statics': 'src/index.js',
  },
}
