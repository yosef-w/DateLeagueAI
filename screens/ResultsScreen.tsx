import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { callGeminiApi } from '../services/geminiApi';

const { width: screenWidth } = Dimensions.get('window');

export default function ResultsScreen() {
  const { imagePaths } = useLocalSearchParams<{ imagePaths: string }>();
  const [imageArray, setImageArray] = useState<string[]>([]);
  const [feedbackArray, setFeedbackArray] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeImages = async () => {
      try {
        const parsedImages = JSON.parse(decodeURIComponent(imagePaths));
        setImageArray(parsedImages);

        const feedbackResults: string[] = [];
        for (const imageUrl of parsedImages) {
          const result = await callGeminiApi(imageUrl);
          feedbackResults.push(result);
        }

        setFeedbackArray(feedbackResults);
      } catch (error) {
        console.error('❌ Gemini API error:', error);
        setFeedbackArray(['Unable to retrieve feedback.']);
      } finally {
        setLoading(false);
      }
    };

    if (imagePaths) {
      analyzeImages();
    }
  }, [imagePaths]);

  const [activeSlide, setActiveSlide] = useState(0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / screenWidth
          );
          setActiveSlide(index);
        }}
      >
        {imageArray.map((uri, idx) => (
          <View key={idx} style={styles.slide}>
            <Image source={{ uri }} style={styles.image} />
          </View>
        ))}
      </ScrollView>

      <Text style={styles.feedback}>{feedbackArray[activeSlide]}</Text>
    </View>
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
    alignItems: 'center',
  },
  slide: {
    width: screenWidth,
    alignItems: 'center',
  },
  image: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: 12,
    marginBottom: 16,
  },
  feedback: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    marginTop: 10,
  },
});
