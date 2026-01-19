const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const Dotenv = require('dotenv-webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Load .env for web so process.env.EXPO_PUBLIC_* is available in the bundle
  config.plugins.push(
    new Dotenv({
      path: '.env',
      systemvars: true,
      silent: true,
    })
  );

  return config;
};
