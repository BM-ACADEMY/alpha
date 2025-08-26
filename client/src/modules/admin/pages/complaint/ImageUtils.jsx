
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

  // Extract filename and verify userId from URL
  let filename;
  try {
    const parts = filePath.split('/');
    filename = parts[parts.length - 1];
    const urlUserId = parts[parts.length - 2]; // Assuming user_id is second-to-last
    if (urlUserId !== userId) {
      console.warn('getImageUrl: userId mismatch', { urlUserId, providedUserId: userId, filePath });
    }
    if (!filename) throw new Error('Invalid filePath: no filename found');
  } catch (error) {
    console.error('getImageUrl: Failed to parse filePath', { filePath, error: error.message });
    return '/fallback-image.png';
  }

  const endpoint = entityType === 'complaint'
    ? `/complaints/complaint-image/${userId}/${encodeURIComponent(filename)}`
    : `/profile-image/get-image/${entityType}/${userId}/${encodeURIComponent(filename)}`;

  console.log('getImageUrl: Requesting image', { endpoint, filePath, userId, entityType });

  try {
    const response = await axiosInstance.get(endpoint, {
      responseType: 'blob',
      // Use Authorization header for JWT
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = URL.createObjectURL(blob);
    imageCache.set(filePath, blobUrl);
    console.log('getImageUrl: Image fetched successfully', { blobUrl });
    return blobUrl;
  } catch (error) {
    console.error('getImageUrl error:', {
      filePath,
      endpoint,
      status: error.response?.status,
      message: error.message,
    });
    return '/fallback-image.png';
  }
};

// Export imageCache for cleanup if needed
export { imageCache };