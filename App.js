import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { BatteryProvider } from './compoenents/context/BatteryContext';
import Body from './compoenents/Body';   // 👈 import body.js

export default function App() {
  return (
    <BatteryProvider>
      <View style={styles.container}>
        <Body />
        <StatusBar style="auto" />
      </View>
    </BatteryProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    backgroundColor: '#fff',
  },
});
