import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResultsScreen() {
  const { feedback } = useLocalSearchParams<{ feedback?: string }>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Analysis Results</Text>
      <Text style={styles.body}>{feedback}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
  },
});
