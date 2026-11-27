
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, Platform } from 'react-native';

import App from './App';
import { ToastHost } from './src/components/Toast';

// react-native-web's Alert.alert does nothing. Simple messages already use
// notify() (src/components/Toast). The remaining Alert.alert calls are real
// questions ("Delete this book?"), so on web show a confirm dialog and run the
// chosen button's handler; with one button, a plain alert.
if (Platform.OS === 'web') {
  Alert.alert = (title, message, buttons) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancel = buttons.find(b => b.style === 'cancel');
    const action =
      buttons.find(b => b.style === 'destructive') ||
      buttons.filter(b => b !== cancel).pop();
    if (window.confirm(text)) action?.onPress?.();
    else cancel?.onPress?.();
  };
}

function Root() {
  return (
    <SafeAreaProvider>
      <App />
      <ToastHost />
    </SafeAreaProvider>
  );
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
