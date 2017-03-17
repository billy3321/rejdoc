var webpack = require('webpack');
module.exports = {
    entry: {
        main: './index.js'
    },
    output: {
        library:  'getReJDocString',
        filename: 'getReJDocString.min.js',
        path:     './dist/'
    },
    externals: {
        'jquery':       'jQuery',
        'react':        'React',
        'react-dom':    'ReactDOM',
        'react-router': 'ReactRouter',
        'history':      'History',
        'redux':        'Redux',
        'react-redux':  'ReactRedux'
    },
    module: {
        loaders: [
            {
                test:   /\.json$/,
                loader: 'json-loader'
            },
            {
                test:    /\.js$/,
                exclude: /node_modules/,
                loader:  'babel-loader',
                query:   {
                    presets: ['es2015', 'react']
                }
            },
            {
                test:   /\.js?$/,
                loader: "unicode-loader"
            }
        ]
    },
    plugins: [
        // new webpack.optimize.CommonsChunkPlugin({name: 'vendor'}),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify('alpha')
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            comments: false,
            mangle:   {
                except: ['$super', '$', 'exports', 'require']
            }
        })
    ]
};