import React, { useState } from 'react';
import {
  View,
  Image,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import uploadToFirebase from '../utils/uploadToFirebase';

const UploadScreen = (): React.ReactElement => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access to continue.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        setDownloadUrl(null);
      }
    } catch (e) {
      console.error('Error picking image:', e);
      Alert.alert('Error', 'Unable to select image.');
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!imageUri) return;
    try {
      setLoading(true);
      const url = await uploadToFirebase(imageUri);
      setDownloadUrl(url);
      console.log('Uploaded image URL:', url);
    } catch (e) {
      console.error('Upload failed:', e);
      Alert.alert('Error', 'Image upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button title="Upload" onPress={handleUpload} />
        </>
      )}
      {downloadUrl && (
        <Text selectable style={styles.urlText}>
          {downloadUrl}
        </Text>
      )}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
};

export default UploadScreen;

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
    borderRadius: 8,
    marginVertical: 20,
  },
  urlText: {
    marginTop: 16,
    color: 'blue',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
