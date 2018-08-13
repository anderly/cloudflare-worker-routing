require('dotenv').config({ path: __dirname + '/cloudflare.env' });

const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'index.js',
    },
    target: 'webworker',
    mode: 'production',
    optimization: {
        minimize: false,
    },
    performance: {
        hints: false,
    },
};
