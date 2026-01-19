export const resolveImageUrl = (path?: string) => {
  if (!path) return '';
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  return `${baseUrl}/${cleanPath}`;
};

export const stripApiUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  if (url.startsWith(baseUrl)) {
    return url.replace(baseUrl, '');
  }
  return url;
};
