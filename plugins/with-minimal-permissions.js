const { withInfoPlist } = require('expo/config-plugins');

module.exports = (config) =>
  withInfoPlist(config, (nextConfig) => {
    const backgroundModes = nextConfig.modResults.UIBackgroundModes;
    if (Array.isArray(backgroundModes)) {
      nextConfig.modResults.UIBackgroundModes = backgroundModes.filter(
        (mode) => mode !== 'fetch',
      );
    }
    delete nextConfig.modResults.NSMotionUsageDescription;
    return nextConfig;
  });
