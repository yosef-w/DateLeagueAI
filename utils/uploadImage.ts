import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export async function uploadImageAsync(uri: string): Promise<string> {
  try {
    console.log('📤 Reading file from URI:', uri);
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    console.log('📤 Byte size:', bytes.byteLength);

    const extension = uri.split('.').pop()?.toLowerCase() === 'png' ? 'png' : 'jpg';
    const contentType = extension === 'png' ? 'image/png' : 'image/jpeg';

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
    const storageRef = ref(storage, `photos/${filename}`);

    console.log('📤 Uploading to Firebase Storage path:', storageRef.fullPath);

    await uploadBytes(storageRef, bytes, { contentType });

    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Uploaded to:', downloadURL);
    return downloadURL;
  } catch (error: any) {
    console.error('🔥 uploadImageAsync failed:', error.message);
    console.error('🔥 Full error:', error);
    throw error;
  }
}
