const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure all Firebase packages resolve to the single hoisted @firebase/app
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@firebase/app') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@firebase/app/dist/index.cjs.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

