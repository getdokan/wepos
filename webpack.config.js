/**
 * Webpack configuration for WePos React frontend
 */
const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const fs = require('fs');

const isDevMode = process.env.NODE_ENV !== 'production';

// Create a dev mode indicator file
if (isDevMode) {
    const devModeFile = path.resolve(process.cwd(), '.dev-server-running');
    fs.writeFileSync(devModeFile, new Date().toISOString());

    // Register a cleanup function to remove the file when the process exits
    process.on('exit', () => {
        try {
            if (fs.existsSync(devModeFile)) {
                fs.unlinkSync(devModeFile);
            }
        } catch (e) {
            // Ignore errors during cleanup
        }
    });

    // Also handle interrupt signals
    ['SIGINT', 'SIGTERM'].forEach(signal => {
        process.on(signal, () => {
            try {
                if (fs.existsSync(devModeFile)) {
                    fs.unlinkSync(devModeFile);
                }
            } catch (e) {
                // Ignore errors during cleanup
            }
            process.exit();
        });
    });
}

const config = {
    ...defaultConfig,
    output: {
        ...defaultConfig.output,
        path: path.resolve(process.cwd(), 'assets/js'),
    },
    resolve: {
        ...defaultConfig.resolve,
        alias: {
            ...defaultConfig.resolve?.alias,
            '@': path.resolve(process.cwd(), 'src/frontend'),
            '@components': path.resolve(process.cwd(), 'src/frontend/components'),
            '@utils': path.resolve(process.cwd(), 'src/frontend/utils'),
            '@hooks': path.resolve(process.cwd(), 'src/frontend/hooks'),
            '@pages': path.resolve(process.cwd(), 'src/frontend/pages'),
            '@styles': path.resolve(process.cwd(), 'src/frontend/styles'),
        }
    },
    // Configure dev server for HMR
    devServer: isDevMode ? {
        devMiddleware: {
            writeToDisk: true,
        },
        allowedHosts: 'all',
        host: 'localhost',
        port: 8887,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    } : undefined,
};

const originalEntry = config.entry;

config.entry = () => {
    const wpEntries = typeof originalEntry === 'function' ? originalEntry() : originalEntry;

    return {
        ...wpEntries,
        'wepos-react': path.resolve(process.cwd(), 'src/frontend/index.tsx'),
    };
};

module.exports = config;
