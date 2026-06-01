const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure @ alias resolves to src/
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Add .webp to asset extensions so Metro bundles animated splash
config.resolver.assetExts = [
  ...config.resolver.assetExts.filter(ext => ext !== 'webp'),
  'webp',
];

module.exports = config;
