module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-worklets/plugin replaces react-native-reanimated/plugin for
    // Reanimated 4. Must remain the LAST plugin in the list.
    plugins: ['react-native-worklets/plugin'],
  };
};
