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
  console.log('matches', dataUrl);
  return matches ? matches[1] : 'image/jpeg';
};
