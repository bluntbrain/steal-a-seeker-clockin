module.exports = function (api) {
  api.cache(true);
  return {
    // Filament uses Worklets Core; Reanimated 4 uses the separate Worklets runtime.
    // Both flags are required: disabling only Worklets makes Expo fall back to
    // Reanimated's plugin (which is also the Worklets plugin in Reanimated 4).
    presets: [['babel-preset-expo', {worklets: false, reanimated: false}]],
    // Both plugins recognize 'worklet'. Keep their compilation domains separate.
    overrides: [
      {
        test: /(?:react-native-filament|react-native-worklets-core|phone-filament)/,
        plugins: [
          ['@babel/plugin-transform-parameters', {}, 'worklet-parameters'],
          'react-native-worklets-core/plugin',
        ],
      },
      {
        exclude: /(?:react-native-filament|react-native-worklets-core|phone-filament)/,
        // Lower defaults before extracting a worklet. A default such as
        // dt=TUNING.step otherwise runs before this.__closure is unpacked and
        // throws on the native UI thread as soon as the tutorial starts moving.
        plugins: [
          ['@babel/plugin-transform-parameters', {}, 'worklet-parameters'],
          'react-native-worklets/plugin',
        ],
      },
    ],
  };
};
