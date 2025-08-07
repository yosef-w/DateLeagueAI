import React, { useEffect, useRef, useState } from 'react';
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
import Carousel from 'react-native-snap-carousel';

const { width: screenWidth } = Dimensions.get('window');

export default function ResultsScreen() {
  const { imagePaths } = useLocalSearchParams<{ imagePaths: string }>();
  const [imageArray, setImageArray] = useState<string[]>([]);
  const [feedbackArray, setFeedbackArray] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef(null);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Carousel
        ref={carouselRef}
        data={imageArray}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} />
        )}
        sliderWidth={screenWidth}
        itemWidth={screenWidth * 0.8}
        onSnapToItem={(index) => setActiveSlide(index)}
        loop
      />

      <Text style={styles.feedback}>{feedbackArray[activeSlide]}</Text>
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
