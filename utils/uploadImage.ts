import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export async function uploadImageAsync(uri: string): Promise<string> {
  try {
    console.log('📤 Converting URI to blob:', uri);
    const response = await fetch(uri);
    const blob = await response.blob();

    console.log('📤 Blob size:', blob.size);
    console.log('📤 Blob type:', blob.type);

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, `photos/${filename}`);

    console.log('📤 Uploading to Firebase Storage path:', storageRef.fullPath);

    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });

    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Uploaded to:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('🔥 uploadImageAsync failed:', error.message);
    console.error('🔥 Full error:', error);
    throw error;
  }
}
