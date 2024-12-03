export const getMimeTypeByExtension = (filename: string) => {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: { [key: string]: string } = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext || ''] || 'image/jpeg';
};

export const getMimeTypeFromDataUrl = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return matches ? matches[1] : 'image/jpeg';
};

export const isImageUrl = (url: string): boolean => {
  // Vérifie les extensions communes d'images
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url)) return true;
  // Vérifie si l'URL commence par data:image
  if (url.startsWith('data:image/')) return true;
  // Pour les autres URLs, vérifie si elles contiennent des indicateurs d'images
  return /\/(image|img|photo|picture)\/?/i.test(url);
};

export const cleanQuery = (query: string): string => {
  if (!query) return '';

  return query
    .replace(/\b2023\b/g, '')
    .replace(/\b(october|octobre)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};
