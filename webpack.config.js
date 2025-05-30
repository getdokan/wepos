/**
 * Webpack configuration for WePos React frontend
 * Minimal override to add our custom entry point only
 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

const config = {
    ...defaultConfig,
    entry: {
        ...defaultConfig.entry,
        'wepos-react': path.resolve(__dirname, 'src/frontend/index.tsx'),
    },
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve?.alias,
            '@': path.resolve(__dirname, 'src/frontend'),
        },
    },
    devServer: {
        ...defaultConfig.devServer,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
        },
        allowedHosts: 'all',
    },
};

module.exports = config;
