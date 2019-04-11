const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
module.exports = {
    context: path.resolve(__dirname, '../'),
    devtool: 'eval-source-map',
    entry: {
        app: "./dev/index.js",
    },
    output: {
        path: path.resolve(__dirname, 'devTemp'),
        filename: '[name].js'
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    },
    devServer: {
        compress: true,
        contentBase: path.join(__dirname, "devTemp"),
        port:7000,
        host:'localhost',
        open:false
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './dev/index.html',
            inject: true
        }),
    ]
}