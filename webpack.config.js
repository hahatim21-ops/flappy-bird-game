const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const path = require('path');

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

  // Copy backgrounds as-is to preserve original image quality
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/login-background.png'),
          to: 'login-background.png',
        },
        {
          from: path.resolve(__dirname, 'public/multiplayer-background.png'),
          to: 'multiplayer-background.png',
        },
      ],
    })
  );

  return config;
};
