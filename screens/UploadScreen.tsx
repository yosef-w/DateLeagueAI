import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  Button,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { uploadImageAsync } from '../utils/uploadImage';

export default function UploadScreen() {
  const [imageUris, setImageUris] = useState<string[]>([]);
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

  const pickImages = async () => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 1,
      });

      console.log('📸 Image picker result:', result);

      if (!result.canceled && result.assets?.length > 0) {
        setImageUris(result.assets.map((asset) => asset.uri));
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Image Picker Error', 'Something went wrong while selecting the image.');
    }
  };

  const handleUpload = async () => {
    if (imageUris.length === 0) return;

    try {
      const uploadedUrls: string[] = [];
      for (const uri of imageUris) {
        const imageUrl = await uploadImageAsync(uri);
        uploadedUrls.push(imageUrl);
      }

      console.log('✅ Uploaded URLs:', uploadedUrls);
      router.push({
        pathname: '/results',
        params: { imagePaths: JSON.stringify(uploadedUrls) },
      });
    } catch (e) {
      console.error('❌ Upload failed:', e);
      Alert.alert('Upload failed', 'Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Choose Photos" onPress={pickImages} />
      {imageUris.length > 0 && (
        <>
          <ScrollView horizontal style={styles.carousel}>
            {imageUris.map((uri, idx) => (
              <Image key={idx} source={{ uri }} style={styles.image} />
            ))}
          </ScrollView>
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
  carousel: {
    marginVertical: 20,
  },
  image: {
    width: 180,
    height: 180,
    marginRight: 10,
    borderRadius: 8,
  },
});
