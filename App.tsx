import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💈 BarberFlow</Text>
      <Text style={styles.sub}>App iniciando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4fc3f7',
  },
  sub: {
    fontSize: 14,
    color: '#5a6888',
    marginTop: 8,
  },
});
