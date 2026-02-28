const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 */
const defaultConfig = getDefaultConfig(__dirname);

// Add MP3 support
defaultConfig.resolver.assetExts = [
  ...defaultConfig.resolver.assetExts,
  "mp3"
];

const config = {
  resolver: defaultConfig.resolver,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(defaultConfig, config);
