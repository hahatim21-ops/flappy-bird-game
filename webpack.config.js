const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const Dotenv = require('dotenv-webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Add dotenv-webpack plugin to load .env file
  config.plugins.push(
    new Dotenv({
      path: '.env', // Path to .env file
      safe: false, // Don't require .env.example
      systemvars: true, // Load system environment variables
      silent: false, // Show warnings
    })
  );

  // Copy penguin avatar from public folder
  config.plugins.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public/penguin-avatar.png'),
          to: 'penguin-avatar.png',
          noErrorOnMissing: true,
        },
      ],
    })
  );

  // Add rule to handle audio files (mp3, wav, etc.)
  config.module.rules.push({
    test: /\.(mp3|wav|ogg|m4a)$/,
    type: 'asset/resource',
    generator: {
      filename: 'static/media/[name].[hash][ext]',
    },
  });

  return config;
};
