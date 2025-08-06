import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import { callGeminiApi } from '../services/geminiApi';

type ResultsRoute = {
  Results: { imagePath: string };
};

export default function ResultsScreen() {
  const route = useRoute<RouteProp<ResultsRoute, 'Results'>>();
  const { imagePath } = route.params;

  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      try {
        const result = await callGeminiApi(imagePath);
        setFeedback(result);
      } catch (e) {
        setFeedback('Unable to retrieve feedback.');
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [imagePath]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>{feedback}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
});

