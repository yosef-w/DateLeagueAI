import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export async function uploadImageAsync(uri: string): Promise<string> {
  try {
    console.log('📤 Reading file from URI:', uri);

    const blob: Blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError('Network request failed'));
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });

    console.log('📤 Blob size:', blob.size);
    console.log('📤 Blob type:', blob.type);

    const contentType = blob.type || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const storageRef = ref(storage, `photos/${filename}`);

    console.log('📤 Uploading to Firebase Storage path:', storageRef.fullPath);

    await uploadBytes(storageRef, blob, { contentType });

    // @ts-ignore React Native Blob has a non-standard close method
    blob.close?.();

    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Uploaded to:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('🔥 uploadImageAsync failed:', error.message);
    console.error('🔥 Full error:', error);
    throw error;
  }
}
