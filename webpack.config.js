const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const Dotenv = require('dotenv-webpack');

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

  return config;
};
