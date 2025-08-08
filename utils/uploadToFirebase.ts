// utils/uploadToFirebase.ts
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import getBlob from './getBlob';

// Keep your UUID helper
const uuidv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Overloads let you call with 1 or 2 args without TS whining
export default function uploadToFirebase(uri: string): Promise<string>;
export default function uploadToFirebase(
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string>;

export default async function uploadToFirebase(
  uri: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const blob = await getBlob(uri);
  const fileName = `${uuidv4()}.jpg`;
  const storageRef = ref(storage, `uploads/${fileName}`);

  return new Promise<string>((resolve, reject) => {
    // You can pass metadata if you want contentType, cacheControl, etc.
    const task = uploadBytesResumable(storageRef, blob /*, { contentType: 'image/jpeg' }*/);

    task.on(
      'state_changed',
      (snap) => {
        const progress = snap.totalBytes
          ? snap.bytesTransferred / snap.totalBytes
          : 0;
        onProgress?.(progress);
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          onProgress?.(1); // final tick
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
