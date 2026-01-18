const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const Dotenv = require('dotenv-webpack');
const path = require('path');

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
