/**
 * Merged Webpack configuration for WePos (React + Vue)
 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const packageJson = require('./package.json');
const webpack = require('webpack');

// Extract vendor packages from dependencies (excluding lodash as per old config)
const vendorPackages = Object.keys(packageJson.dependencies || {}).filter(pkg => pkg !== 'lodash');

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production' || process.env.NODE_ENV === 'production';
    const modeSuffix = isProduction ? '.min' : '';

    const config = {
        ...defaultConfig,
        entry: {
            ...defaultConfig.entry,
            // React entry points
            'wepos-react': path.resolve(__dirname, 'src/frontend/index.tsx'),
            'wepos-admin-react': path.resolve(__dirname, 'src/admin/index.tsx'),
            'wepos-admin-switching': path.resolve(__dirname, 'src/admin/panel-switcher/index.tsx'),

            // Old Vue/Legacy entry points
            '../assets/js/frontend': './assets/src/frontend/main.js',
            '../assets/js/admin': './assets/src/admin/main.js',
            '../assets/js/vendor': vendorPackages,
            '../assets/js/bootstrap': './assets/src/utils/Bootstrap.js',
            '../assets/js/wphook': './assets/vendors/wp-hook/index.js',
            '../assets/js/style': './assets/less/style.less',
        },
        output: {
            ...defaultConfig.output,
            // Default path is build/
            filename: (pathData) => {
                const name = pathData.chunk.name;
                if (name === 'wepos-react' || name === 'wepos-admin-react' || name === 'wepos-admin-switching') {
                    return '[name].js';
                }
                // For legacy assets, we use the mode suffix (.min) if in production
                return `[name]${modeSuffix}.js`;
            },
        },
        resolve: {
            ...defaultConfig.resolve,
            alias: {
                ...defaultConfig.resolve?.alias,
                // React Aliases
                '@react': path.resolve(__dirname, 'src/frontend'),
                '@admin': path.resolve(__dirname, 'src/admin'),

                // Old Vue Aliases
                '@': path.resolve(__dirname, 'assets/src/'),
                'vue$': 'vue/dist/vue.esm.js',
                'frontend': path.resolve(__dirname, 'assets/src/frontend/'),
                'admin': path.resolve(__dirname, 'assets/src/admin/'),
            },
            extensions: [...(defaultConfig.resolve?.extensions || []), '.vue', '.ts', '.tsx'],
        },
        externals: {
            ...defaultConfig.externals,
            _: 'window.wepos._'
        },
        module: {
            ...defaultConfig.module,
            rules: [
                ...defaultConfig.module.rules,
                // Vue Loader
                {
                    test: /\.vue$/,
                    loader: 'vue-loader',
                },
                // Less Support
                {
                    test: /\.less$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'less-loader',
                    ],
                },
            ],
        },
        plugins: [
            ...defaultConfig.plugins,
            new VueLoaderPlugin(),
            new webpack.ProvidePlugin({
                _: '_'
            }),
        ],
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

    // Customize MiniCssExtractPlugin to handle legacy CSS paths
    config.plugins.forEach((plugin) => {
        if (plugin.constructor.name === 'MiniCssExtractPlugin') {
            const originalFilename = plugin.options.filename;
            plugin.options.filename = (pathData) => {
                const chunkName = pathData.chunk.name;
                if (chunkName && chunkName.startsWith('../assets/js/')) {
                    // Extract name and change js to css, and go up one level to assets/css
                    const name = chunkName.replace('../assets/js/', '');
                    return `../assets/css/${name}${modeSuffix}.css`;
                }
                return originalFilename;
            };
        }
    });

    return config;
};
