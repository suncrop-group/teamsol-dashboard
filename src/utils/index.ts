import { BASE_URL } from '@/api';
import { store } from '@/redux/store';

export function parseCustomDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

export const validateInput = (obj) => {
  const result = [];
  for (const key in obj) {
    if (obj[key] === '') {
      result.push(key);
    }
  }
  return result.length === 0;
};

// Photos are shrunk in the browser before they are uploaded: a phone picture
// is several megabytes, far more than a receipt or an event photo needs.
const MAX_SIDE = 1600;
const QUALITY = 0.75;

/**
 * A smaller copy of a photo: longest side at most 1600 px, JPEG. Anything
 * that is not a photo (a PDF, a GIF, an SVG) is returned as it is, and so is
 * a photo the browser cannot read or that would not come out smaller.
 */
export const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file;
  try {
    // "from-image" applies the camera's rotation, so the copy is upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    // JPEG has no transparency: put a see-through PNG on white, not black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
};

// --- uploads ------------------------------------------------------------------
// Files go straight to Google Cloud Storage: the backend hands out one upload
// link per file, the browser PUTs the file to it, and the public link that
// comes back is what gets stored on the record. Files keep the folder they
// were always filed under.

interface UploadLink {
  uploadUrl: string;
  url: string;
  contentType: string;
}

interface Waiting {
  /** Being compressed; the batch waits for all of them. */
  file: Promise<File>;
  folder: string;
  name: string;
  resolve: (url: string) => void;
  reject: (error: Error) => void;
}

// Uploads started together (a form's five attachments) share one request for
// their links instead of asking once per file.
let waiting: Waiting[] = [];

const flush = async () => {
  const batch = waiting;
  waiting = [];
  try {
    const files = await Promise.all(batch.map((item) => item.file));
    const token = store.getState().auth.user?.token;
    const response = await fetch(`${BASE_URL}/v2/uploads/sign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client': 'web',
        'X-Client-Platform': 'web',
        'X-Client-Version': __APP_VERSION__,
      },
      body: JSON.stringify({
        files: batch.map((item, index) => ({
          folder: item.folder,
          name: item.name || files[index].name,
          contentType: files[index].type,
        })),
      }),
    });
    const json = await response.json().catch(() => ({}));
    const links: UploadLink[] = json?.data || [];
    if (!response.ok || links.length !== batch.length) {
      throw new Error(json?.message || 'Could not prepare the upload');
    }

    await Promise.all(
      batch.map(async (item, index) => {
        try {
          const put = await fetch(links[index].uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': links[index].contentType },
            body: files[index],
          });
          if (!put.ok) throw new Error('Upload failed');
          item.resolve(links[index].url);
        } catch (error) {
          item.reject(error instanceof Error ? error : new Error('Upload failed'));
        }
      }),
    );
  } catch (error) {
    const failure = error instanceof Error ? error : new Error('Upload failed');
    batch.forEach((item) => item.reject(failure));
  }
};

/**
 * Upload one file and get back its public link. Photos are compressed
 * first, always. Calls made together are sent as one batch.
 */
export const uploadFile = async (
  original: File,
  folderName: string,
  fileName?: string,
): Promise<string> => {
  if (!(original instanceof File)) {
    console.error('Invalid file object:', original);
    throw new Error('Invalid file: Expected a File object');
  }
  return new Promise<string>((resolve, reject) => {
    // Joined to the batch at once, before compression finishes, so files
    // picked together always share one request.
    waiting.push({
      file: compressImage(original),
      folder: folderName,
      name: fileName || '',
      resolve,
      reject,
    });
    // The first of a group starts the clock; the rest join the same batch.
    if (waiting.length === 1) setTimeout(flush, 0);
  });
};

/** The name the pages have always called it by; storage is no longer Cloudinary. */
export const uploadToCloudinary = uploadFile;

export const priceFormatter = (price) => {
  return price
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const isNetworkAvailable = () => {
  return navigator.onLine;
};
