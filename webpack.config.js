const webpack = require('webpack');
const path = require('path');
const package = require('./package.json');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

// Check if we're building React or Vue
const isReactBuild = process.env.BUILD_TARGET === 'react';

if (isReactBuild) {
    // Use wp-scripts configuration for React build
    const defaultConfig = require('@wordpress/scripts/config/webpack.config');

    module.exports = {
        ...defaultConfig,
        entry: {
            'react-frontend': './src/frontend/index.tsx',
        },
        output: {
            path: path.resolve(__dirname, './assets/js'),
            filename: '[name].js',
        },
        resolve: {
            ...defaultConfig.resolve,
            alias: {
                ...defaultConfig.resolve.alias,
                '@': path.resolve('./src/frontend/'),
                '@/components': path.resolve('./src/frontend/components/'),
                '@/pages': path.resolve('./src/frontend/pages/'),
                '@/hooks': path.resolve('./src/frontend/hooks/'),
                '@/utils': path.resolve('./src/frontend/utils/'),
                '@/types': path.resolve('./src/frontend/types/'),
                '@/api': path.resolve('./src/frontend/api/'),
                '@/store': path.resolve('./src/frontend/store/'),
                '@/styles': path.resolve('./src/frontend/styles/'),
            }
        },
        module: {
            ...defaultConfig.module,
            rules: [
                ...defaultConfig.module.rules,
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        'css-loader',
                        'postcss-loader'
                    ],
                }
            ]
        },
        plugins: [
            ...defaultConfig.plugins,
            new MiniCssExtractPlugin({
                filename: '../css/react-frontend.css',
            }),
        ],
    };
} else {
    // Original Vue.js configuration
    const vendorPackages = Object.keys(package.dependencies);
    vendorPackages.splice(vendorPackages.indexOf('lodash'), 1);

    // Naming and path settings
    var entryPoint = {
        frontend: './assets/src/frontend/main.js',
        admin: './assets/src/admin/main.js',
        vendor: vendorPackages,
        bootstrap: './assets/src/utils/Bootstrap.js',
        wphook: './assets/vendors/wp-hook/index.js',
        style: './assets/less/style.less',
    };

    var exportPath = path.resolve(__dirname, './assets/js');

    module.exports = (env, argv) => {
        let appName = argv.mode === 'development' ? '[name].js' : '[name].min.js';
        let appNameCss = argv.mode === 'development' ? '../css/[name].css' : '../css/[name].min.css';

        return {
            entry: entryPoint,

            output: {
                path: exportPath,
                filename: appName,
            },

            resolve: {
                alias: {
                    'vue$': 'vue/dist/vue.esm.js',
                    '@': path.resolve('./assets/src/'),
                    'frontend': path.resolve('./assets/src/frontend/'),
                    'admin': path.resolve('./assets/src/admin/'),
                }
            },

            externals: {
                _: 'window.wepos._'
            },

            plugins: [
                new MiniCssExtractPlugin(
                    {
                        filename: ({ chunk }) => {
                            return appNameCss;
                        },
                    }
                ),
                new VueLoaderPlugin(),
                new webpack.ProvidePlugin({
                    _: '_'
                })
            ],

            module: {
                rules: [
                    {
                        test: /\.(js|jsx|ts)$/,
                        exclude: /node_modules/,
                        use: {
                            loader: 'babel-loader',
                        },
                    },
                    {
                        test: /\.vue$/,
                        loader: 'vue-loader',
                        options: {
                            extractCSS: true
                        }
                    },
                    {
                        test: /\.(le|c)ss$/,
                        use: [
                            MiniCssExtractPlugin.loader,
                            "css-loader",
                            "less-loader",
                        ],
                    },
                    {
                        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
                        use: [
                            {
                                loader: 'file-loader',
                                options: {
                                    outputPath: 'fonts',
                                },
                            },
                        ],
                    }
                ]
            },

            optimization: {
                minimize: true,
                minimizer: [
                    new TerserPlugin({
                        extractComments: false
                    }),
                    new CssMinimizerPlugin()
                ],
            },
        }
    }
}
