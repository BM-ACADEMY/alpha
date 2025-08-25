
import axiosInstance from '@/modules/common/lib/axios';

// Fallback for imageCache if Map is unavailable
const imageCache = typeof Map === 'function' ? new Map() : {
  cache: {},
  set(key, value) { this.cache[key] = value; },
  get(key) { return this.cache[key]; },
  has(key) { return key in this.cache; },
  clear() { this.cache = {}; },
};

// Log if Map is unavailable for debugging
if (typeof Map !== 'function') {
  console.warn('Map constructor is not available. Using fallback object for imageCache.');
}

// Function to fetch image as blob and return a blob URL
export const getImageUrl = async (filePath, userId, entityType = 'user') => {
  if (!filePath || !userId) {
    console.warn('getImageUrl: Missing filePath or user ID', { filePath, userId });
    return '/fallback-image.png';
  }

  // Check cache first
  if (imageCache.has(filePath)) {
    return imageCache.get(filePath);
  }

  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  const endpoint = entityType === 'complaint'
    ? `/complaint-image/${userId}/${encodeURIComponent(filename)}`
    : `/profile-image/get-image/${entityType}/${userId}/${encodeURIComponent(filename)}`;

  try {
    const response = await axiosInstance.get(endpoint, {
      responseType: 'blob',
      withCredentials: true,
    });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = URL.createObjectURL(blob);
    imageCache.set(filePath, blobUrl); // Cache the blob URL
    return blobUrl;
  } catch (error) {
    console.error('getImageUrl error:', {
      filePath,
      status: error.response?.status,
      message: error.message,
    });
    return '/fallback-image.png';
  }
};

// Export imageCache for cleanup if needed
export { imageCache };
