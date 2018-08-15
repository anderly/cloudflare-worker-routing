require('dotenv').config({ path: __dirname + '/cloudflare.env' });

const webpack = require('webpack');

module.exports = {
    entry: __dirname + '/src/index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'index.js',
    },
    target: 'webworker',
    mode: 'production',
    optimization: {
        minimize: false,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: [/frequency_lists/],
            },
        ],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.DefinePlugin({
            LAST_MODIFIED: JSON.stringify(new Date().toJSON()),
        }),
    ],
};
