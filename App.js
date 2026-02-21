import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { BatteryProvider } from './compoenents/context/BatteryContext';
import Body from './compoenents/Body';

// --- REDUX IMPORTS ---
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './compoenents/redux/store'; // Adjust path to your store.js
// ---------------------

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#bb86fc" />
          </View>
        } 
        persistor={persistor}
      >
        <BatteryProvider>
          <View style={styles.container}>
            <Body />
            <StatusBar style="auto" />
          </View>
        </BatteryProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#0a0a0a'
  }
});