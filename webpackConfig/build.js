const path = require('path');

module.exports = {
    context: path.resolve(__dirname, '../'),
    devtool: 'eval-source-map',
    entry: {
        app: "./src/index.js",
    },
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    }
}