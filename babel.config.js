module.exports = function(api) {
  api.cache(true);
  return {
    plugins: [
      // plugins added here, will run on both server and client,
      // but currently sourcemaps won't oblige
    ],
  };
}
