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

export const uploadToCloudinary = async (file, folderName, fileName) => {
  if (!(file instanceof File)) {
    console.error('Invalid file object:', file);
    throw new Error('Invalid file: Expected a File object');
  }

  const data = new FormData();
  data.append('file', file);
  data.append('upload_preset', 'suncrop');
  data.append('folder', folderName);
  if (fileName) {
    data.append('public_id', fileName); // Use public_id for custom file name
  }

  try {
    const res = await fetch(
      'https://api.cloudinary.com/v1_1/dmetfxrjv/image/upload',
      {
        method: 'POST',
        body: data,
      }
    );
    const json = await res.json();
    if (json.error) {
      console.error('Cloudinary error:', json.error);
      throw new Error(json.error.message);
    }
    return json.secure_url;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
export const priceFormatter = (price) => {
  return price
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const isNetworkAvailable = () => {
  return navigator.onLine;
};
