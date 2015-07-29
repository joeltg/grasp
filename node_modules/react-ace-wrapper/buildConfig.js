var path = require('path');

module.exports = {
    path: path.join(__dirname, 'example'),
    rootPath: path.resolve(__dirname),
    testEntryPoint: path.join(__dirname, 'test', 'index.jsx'),
    webpackConfig: {
        debug: require('./webpack.config.js'),
        production: require('./webpack.config.prod.js'),
    },
};
