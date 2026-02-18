import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Body from './compoenents/Body';   // 👈 import body.js

export default function App() {
  return (
    <View style={styles.container}>
      <Body /> 
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
