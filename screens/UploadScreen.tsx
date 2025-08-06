import React, { useState } from 'react';
import { View, Image, Button, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

import { uploadImageAsync } from '../utils/uploadImage';

export default function UploadScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    try {
      const gsPath = await uploadImageAsync(imageUri);
      router.push({ pathname: '/results', params: { imagePath: gsPath } });
    } catch (e) {
      console.error('Upload failed', e);
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

