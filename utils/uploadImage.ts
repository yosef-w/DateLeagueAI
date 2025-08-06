import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload an image from a local URI to Firebase Storage.
 * @param uri local file URI of the image
 * @returns full gs:// path of the uploaded image
 */
export async function uploadImageAsync(uri: string): Promise<string> {
  // Fetch the file and convert it to a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Generate a random file name
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(storage, `photos/${filename}`);

  // Upload to Firebase Storage
  await uploadBytes(storageRef, blob);

  // Return the full gs:// path
  return `gs://${storageRef.bucket}/${storageRef.fullPath}`;
}

