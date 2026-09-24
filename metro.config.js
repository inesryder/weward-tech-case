const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Bundle Rive animations as assets.
config.resolver.assetExts.push("riv");

module.exports = config;
