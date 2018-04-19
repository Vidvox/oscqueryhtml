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
      'osc': path.join(__dirname, 'node_modules/osc/src/osc.js'),
      '../osc.js': path.join(__dirname, 'node_modules/osc/src/osc.js'),
      'osc-websocket-client': path.join(__dirname, 'node_modules/osc/src/platforms/osc-websocket-client.js'),
//        'osc': path.join(__dirname, 'node_modules/osc/dist/osc-browser.js'),
    }
  },
  node: {
    fs: 'empty',
    tls: 'empty',
  },
  externals: {
    ws: 'ws'
  }
};
