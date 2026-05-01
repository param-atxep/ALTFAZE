import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit, createRateLimitResponse, validateUploadFile } from '@/lib/security';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rateLimitResult = rateLimit(req, 'upload', {
    limit: 10,
    windowMs: 60 * 1000,
  });

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, {
      limit: 10,
      windowMs: 60 * 1000,
    });
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.CLOUDINARY_URL) {
      return NextResponse.json({ error: 'Upload storage is not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validation = validateUploadFile(file, 10 * 1024 * 1024);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const upload = await uploadToCloudinary(file, 'altfaze/uploads');

    return NextResponse.json({
      url: upload.secure_url,
      publicId: upload.public_id,
      resourceType: upload.resource_type,
    });
  } catch (error) {
    logger.error('Upload error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
