module.exports = function(api) {
  api.cache(true);
  return {
    plugins: [
      '@babel/plugin-transform-destructuring',
      ['@babel/plugin-transform-react-jsx', {
        pragma: 'h',
        pragmaFrag: 'Fragment',
        throwIfNamespace: false,
      }],
    ],
    sourceMaps: true
  };
}
