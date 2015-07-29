var path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    debug: true,
    context: path.resolve(__dirname),
    entry: './example/example.jsx',
    output: {
        path: path.resolve(__dirname, 'example'),
        filename: 'example.min.js',
    },
    resolve: {
        root: path.resolve(__dirname),
    },
};
