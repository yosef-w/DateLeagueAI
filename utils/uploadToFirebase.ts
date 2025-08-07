import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import getBlob from './getBlob';

const uuidv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const uploadToFirebase = async (uri: string): Promise<string> => {
  const blob = await getBlob(uri);
  const fileName = `${uuidv4()}.jpg`;
  const storageRef = ref(storage, `uploads/${fileName}`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
};

export default uploadToFirebase;
