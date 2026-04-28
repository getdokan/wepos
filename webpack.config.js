/**
 * Merged Webpack configuration for wePos (React + Vue).
 *
 * Split into two configs so the heavy `@wedevs/plugin-ui` + `react-router-dom`
 * code is bundled exactly once (in `wepos-components`, the "carrier") and
 * externalized everywhere else. Drops the per-entry duplication that made the
 * release zip ~30MB.
 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const packageJson = require('./package.json');
const webpack = require('webpack');

// Extract vendor packages from dependencies (excluding lodash as per old config)
const vendorPackages = Object.keys(packageJson.dependencies || {}).filter(
  (pkg) => pkg !== 'lodash',
);

const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const { requestToExternal, requestToHandle } = require('./webpack-dependency-mapping');

module.exports = (env, argv) => {
  const isProduction =
    argv.mode === 'production' || process.env.NODE_ENV === 'production';
  const modeSuffix = isProduction ? '.min' : '';

  const sharedAlias = {
    ...defaultConfig.resolve?.alias,
    // React Aliases
    '@react': path.resolve(__dirname, 'src/frontend'),
    '@admin': path.resolve(__dirname, 'src/admin'),
    '@wepos/components': path.resolve(__dirname, 'src/index.ts'),
    // Old Vue Aliases
    '@': path.resolve(__dirname, 'assets/src/'),
    vue$: 'vue/dist/vue.esm.js',
    frontend: path.resolve(__dirname, 'assets/src/frontend/'),
    admin: path.resolve(__dirname, 'assets/src/admin/'),
  };

  const sharedExtensions = [
    ...(defaultConfig.resolve?.extensions || []),
    '.vue',
    '.ts',
    '.tsx',
  ];

  const sharedModule = {
    ...defaultConfig.module,
    rules: [
      ...defaultConfig.module.rules,
      // Vue Loader
      { test: /\.vue$/, loader: 'vue-loader' },
      // Less Support
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader'],
      },
    ],
  };

  const sharedDevServer = {
    ...defaultConfig.devServer,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods':
        'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    allowedHosts: 'all',
  };

  const sharedWatchOptions = {
    ignored: ['**/node_modules/**', '**/build/**', '**/dist/**'],
  };

  // Build a fresh plugins array per-config: the dependency-extraction plugin
  // emits per-entry asset.php files, and webpack mutates plugin state during
  // compilation, so each compiler needs its own instances.
  const buildPlugins = () => {
    const basePlugins = defaultConfig.plugins.filter(
      (plugin) =>
        plugin.constructor.name !== 'DependencyExtractionWebpackPlugin'
    );
    return [
      ...basePlugins,
      new DependencyExtractionWebpackPlugin({
        requestToExternal,
        requestToHandle,
      }),
      new VueLoaderPlugin(),
      new webpack.ProvidePlugin({ _: '_' }),
    ];
  };

  const customizeCssFilename = (config) => {
    config.plugins.forEach((plugin) => {
      if (plugin.constructor.name === 'MiniCssExtractPlugin') {
        const originalFilename = plugin.options.filename;
        plugin.options.filename = (pathData) => {
          const chunkName = pathData.chunk.name;
          if (chunkName && chunkName.startsWith('../assets/js/')) {
            const name = chunkName.replace('../assets/js/', '');
            return `../assets/css/${name}${modeSuffix}.css`;
          }
          return originalFilename;
        };
      }
    });
    return config;
  };

  // Carrier config: bundles `@wedevs/plugin-ui` + `react-router-dom` once and
  // exposes them on `window` via the `wepos-components` entry. All other
  // bundles externalize these imports and read from those globals.
  const carrierConfig = {
    ...defaultConfig,
    name: 'wepos-carrier',
    entry: {
      'wepos-components': path.resolve(__dirname, 'src/index.ts'),
    },
    output: {
      ...defaultConfig.output,
      filename: '[name].js',
      library: {
        name: ['wepos', '[name]'],
        type: 'window',
      },
    },
    resolve: {
      ...defaultConfig.resolve,
      alias: sharedAlias,
      extensions: sharedExtensions,
    },
    externals: {
      ...defaultConfig.externals,
      _: 'window.wepos._',
    },
    module: sharedModule,
    plugins: buildPlugins(),
    watchOptions: sharedWatchOptions,
    devServer: sharedDevServer,
  };

  // Main config: every other React bundle + legacy Vue bundles. Externalizes
  // `@wedevs/plugin-ui` and `react-router-dom` so they aren't duplicated.
  const mainConfig = {
    ...defaultConfig,
    name: 'wepos-main',
    entry: {
      // React entry points (carrier exists in the other config)
      'wepos-react': path.resolve(__dirname, 'src/frontend/index.tsx'),
      'wepos-admin-react': path.resolve(__dirname, 'src/admin/index.tsx'),
      'wepos-appearance': path.resolve(__dirname, 'src/appearance/index.tsx'),

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
      // Carrier already cleaned the build dir.
      clean: false,
      filename: (pathData) => {
        const name = pathData.chunk.name;
        if (
          name === 'wepos-react' ||
          name === 'wepos-admin-react' ||
          name === 'wepos-appearance'
        ) {
          return '[name].js';
        }
        return `[name]${modeSuffix}.js`;
      },
      library: {
        name: ['wepos', '[name]'],
        type: 'window',
      },
    },
    resolve: {
      ...defaultConfig.resolve,
      alias: sharedAlias,
      extensions: sharedExtensions,
    },
    externals: {
      ...defaultConfig.externals,
      _: 'window.wepos._',
      // Same pattern wepos-pro already uses — globals are populated by the
      // carrier (wepos-components) before these bundles run.
      '@wedevs/plugin-ui': '__weposPluginUI',
      'react-router-dom': '__weposReactRouterDOM',
    },
    module: sharedModule,
    plugins: buildPlugins(),
    watchOptions: sharedWatchOptions,
    devServer: sharedDevServer,
    // Build the carrier first so its asset.php lands before main config runs.
    dependencies: ['wepos-carrier'],
  };

  customizeCssFilename(carrierConfig);
  customizeCssFilename(mainConfig);

  return [carrierConfig, mainConfig];
};
