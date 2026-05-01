import crypto from 'crypto';
import { parseCloudinaryUrl } from '@/lib/security';

export function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl) {
    throw new Error('CLOUDINARY_URL is not configured');
  }

  return parseCloudinaryUrl(cloudinaryUrl);
}

export async function uploadToCloudinary(file: File, folder = 'altfaze') {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }

  return response.json() as Promise<{ secure_url: string; public_id: string; resource_type: string }>;
}
