module.exports = {
  entry: __dirname + '/src/chart/chart.js',
  output: {
    path: __dirname + '/dist',
    filename: 'chart.min.js',
    library: 'chart',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
