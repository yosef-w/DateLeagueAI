import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { getBlob } from './getBlob';

// Upload a local file to Firebase Storage and return its download URL
export async function uploadToFirebaseAndGetUrl(uri: string): Promise<string> {
  const blob = await getBlob(uri);
  const filename = uri.split('/').pop() || `image-${Date.now()}`;
  const storageRef = ref(storage, `uploads/${filename}`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
