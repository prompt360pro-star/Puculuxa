const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace root
const projectRoot = __dirname;
// In this case, the workspace root is the parent directory
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (and bundle) packages from their relative paths
// This is important for @puculuxa/shared
config.resolver.disableHierarchicalLookup = true;

// 4. FIX: Windows node:sea mkdir error
if (process.platform === 'win32') {
    config.resolver.resolveRequest = (context, moduleName, platform) => {
        if (moduleName.startsWith('node:')) {
            return { type: 'empty' };
        }
        return context.resolveRequest(context, moduleName, platform);
    };
}

module.exports = config;
