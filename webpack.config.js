const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'window'
  },
  resolve: {
    alias: {
      'osc-js': path.join(__dirname, 'node_modules/osc-js/lib/osc.browser.js'),
    }
  }
};
