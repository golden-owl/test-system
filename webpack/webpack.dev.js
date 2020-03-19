process.env.NODE_ENV = 'development';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
// const CleanWebpackPlugin = require('clean-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');

console.log('Deveeee');

module.exports = merge(common, {
  mode: 'development',
  // devtool: 'inline-source-map',
  watch: true,
  devtool: '#cheap-module-eval-source-map',
  optimization: {
      noEmitOnErrors: true,
  },
  devServer: {
    contentBase: './assets/js',
		// hot: true
	},
	plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    // new CleanWebpackPlugin(['./developing']),
    // new HtmlWebpackPlugin({
		// 	template: 'src/index.html'
    // }),
		// new webpack.HotModuleReplacementPlugin()
	],
});