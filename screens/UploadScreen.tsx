import React, { useEffect, useState } from 'react';
import { View, Image, Button, StyleSheet, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { uploadImageAsync } from '../utils/uploadImage';

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [permission, requestPermission] = ImagePicker.useMediaLibraryPermissions();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert('Permission required', 'Please enable photo access in your settings.');
        }
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Unsupported', 'Image Picker is not supported on web.');
        return;
      }

      if (!permission?.granted) {
        const { granted } = await requestPermission();
        if (!granted) {
          Alert.alert('Permission required', 'Allow access to your photos to continue.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Use PascalCase
        allowsEditing: false,
        quality: 1,
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets?.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Image Picker Error', 'Something went wrong while selecting the image.');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;

    try {
      const imageUrl = await uploadImageAsync(imageUri);
      console.log('✅ Image uploaded to:', imageUrl);
      router.push({ pathname: '/results', params: { imagePath: imageUrl } });
    } catch (e) {
      console.error('❌ Upload failed:', e);
      Alert.alert('Upload failed', 'Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Choose Photo" onPress={pickImage} />
      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button title="Upload & Analyze" onPress={handleUpload} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 8,
  },
});
