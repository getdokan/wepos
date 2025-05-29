const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        'wepos-react': path.resolve(__dirname, 'index.tsx'),
    },
    output: {
        ...defaultConfig.output,
        path: path.resolve(__dirname, '../../assets/js'),
        filename: '[name].js',
    },
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve.alias,
            '@': path.resolve(__dirname, '.'),
        },
    },
};
