import React from 'react';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert is a no-op, so auth errors were invisible on web.
if (Platform.OS === 'web') {
  Alert.alert = (title, message) => {
    console.warn('[Alert]', title, message ?? '');
    window.alert([title, message].filter(Boolean).join('\n\n'));
  };
}

import App from './App';

function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
