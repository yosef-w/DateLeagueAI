import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

/** Map common image mime types to file extensions */
function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('gif')) return 'gif';
  if (m.includes('bmp')) return 'bmp';
  if (m.includes('heic') || m.includes('heif')) return 'heic';
  return 'jpg'; // default
}

/** Generate a collision-resistant filename */
function generateFilename(ext: string) {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${Date.now()}-${rand}.${ext}`;
}

/** Read a local file URI into a Blob with a timeout */
function readUriToBlob(uri: string, timeoutMs = 30000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const timer = setTimeout(() => {
      xhr.abort();
      reject(new Error(`Blob read timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    xhr.onload = () => {
      clearTimeout(timer);
      resolve(xhr.response);
    };
    xhr.onerror = () => {
      clearTimeout(timer);
      reject(new TypeError('Network request failed while reading blob'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload a local image URI to Firebase Storage and return the public download URL.
 * Optionally pass a pathPrefix (e.g. "users/123/photos") to organize uploads.
 */
export async function uploadImageAsync(
  uri: string,
  pathPrefix = 'photos'
): Promise<string> {
  try {
    const blob = await readUriToBlob(uri);

    const contentType = (blob as any).type || 'image/jpeg';
    const ext = extFromMime(contentType);
    const filename = generateFilename(ext);
    const objectPath = `${pathPrefix}/${filename}`;
    const storageRef = ref(storage, objectPath);

    // Add useful cache headers so CDN/browser can cache profile images
    const metadata = {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    };

    await uploadBytes(storageRef, blob, metadata);
    // @ts-ignore (RN Blob sometimes exposes close)
    (blob as any).close?.();

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('🔥 uploadImageAsync failed:', error?.message || error);
    throw error;
  }
}
