const path = require('path')

module.exports = {
    entry: './index.js',
    output: {
        filename: 'dist/promise.js',
        path: path.resolve(__dirname),
        library: 'esPromise',
        libraryTarget: 'umd'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        }]
    }
}