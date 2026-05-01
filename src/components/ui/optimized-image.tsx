'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallbackColor?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackColor = '#f1f5f9',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Default to container-based sizing if width/height not provided
  const containerClassName = !width || !height ? 'w-full h-auto' : '';

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Placeholder while loading */}
      {!isLoaded && !error && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ backgroundColor: fallbackColor }}
        />
      )}

      {/* Error fallback */}
      {error ? (
        <div
          className="flex items-center justify-center bg-slate-200 text-slate-600"
          style={{
            width: width || '100%',
            height: height || '300px',
          }}
        >
          Image failed to load
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          sizes={`
            (max-width: 640px) 100vw,
            (max-width: 768px) 85vw,
            (max-width: 1024px) 80vw,
            70vw
          `}
          {...props}
        />
      )}
    </div>
  );
}

/**
 * Generate responsive image sizes for different breakpoints
 * Usage: sizes={getResponsiveImageSizes()}
 */
export function getResponsiveImageSizes(): string {
  return `
    (max-width: 640px) 100vw,
    (max-width: 768px) 85vw,
    (max-width: 1024px) 80vw,
    70vw
  `;
}

/**
 * Generate srcset for different pixel densities
 * Usage: with next/image automatic srcset generation
 */
export function getImageBreakpoints(): number[] {
  return [320, 480, 640, 768, 1024, 1280, 1536, 1920];
}

/**
 * Calculate optimal image dimensions maintaining aspect ratio
 */
export function calculateImageDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number
): { width: number; height: number } {
  const aspectRatio = originalHeight / originalWidth;
  const width = Math.min(originalWidth, maxWidth);
  const height = Math.round(width * aspectRatio);

  return { width, height };
}

/**
 * Get image quality setting based on format
 */
export function getImageQuality(format: 'webp' | 'avif' | 'jpeg' = 'webp'): number {
  const qualityMap = {
    webp: 75,
    avif: 70,
    jpeg: 80,
  };
  return qualityMap[format] || 75;
}
