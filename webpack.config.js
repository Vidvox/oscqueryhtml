const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: ['whatwg-fetch', './src/index.js'],
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'bundle.js',
    library: 'oscQuery',
    libraryTarget: 'window',
  },
  resolve: {
    alias: {
      'osc': path.join(__dirname, 'node_modules/osc/src/osc.js'),
      'osc-transports': path.join(__dirname, 'node_modules/osc/src/' +
                                  'osc-transports.js'),
      'osc-websocket-client': path.join(__dirname, 'node_modules/osc/src/' +
                                        'platforms/osc-websocket-client.js'),
      'vanilla-picker': path.join(__dirname, 'node_modules/vanilla-picker/' +
                                  'dist/vanilla-picker.js'),
    }
  },
  node: {
    fs: 'empty',
    tls: 'empty',
  },
  externals: {
    ws: 'ws'
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
          sourceMap: true,
          uglifyOptions:{safari10:true}
      })
    ]
  }
};
