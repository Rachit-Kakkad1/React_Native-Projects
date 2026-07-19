/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Evaluated lazily to prevent load-time circular dependency ReferenceErrors
export const Fonts = {
  get sans() { return Platform.OS === 'ios' ? 'system-ui' : 'normal'; },
  get serif() { return Platform.OS === 'ios' ? 'ui-serif' : 'serif'; },
  get rounded() { return Platform.OS === 'ios' ? 'ui-rounded' : 'normal'; },
  get mono() { return Platform.OS === 'ios' ? 'ui-monospace' : 'monospace'; },
};
