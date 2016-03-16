var webpack = require('webpack');

module.exports = {
    debug: false,
    devtool: 'source-map',
    entry: './lib/client',
    output: {
        path: './lib/static',
        filename: 'client.js'
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            mangle:   true,
            compress: {
                warnings: false // Suppress uglification warnings
            }
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }
        })
    ],
    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                loader: 'babel',
                include: __dirname + '/lib/client',
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.hbs$/,
                loader: 'handlebars'
            }
        ]
    }
};
