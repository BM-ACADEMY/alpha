// src/utils/imageHelper.js
export const getImageUrl = (path) => {
  if (!path) return '/api/placeholder/600/400';
  const base = (import.meta.env.VITE_BASE_URL || 'http://localhost:5000/api')
    .replace('/api', '')
    .replace(/\/+$/, ''); // remove trailing slashes
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};