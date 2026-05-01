export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function slugToText(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug);
}

export interface PerformanceMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

export function reportPerformanceMetrics(metrics: PerformanceMetrics) {
  if (typeof window === 'undefined') return;

  // Send to analytics
  if (window.gtag) {
    Object.entries(metrics).forEach(([metric, value]) => {
      if (value !== undefined) {
        window.gtag('event', metric, {
          value: Math.round(value),
          event_category: 'Web Vitals',
        });
      }
    });
  }
}

export const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: 2500, // ms
  FID: 100, // ms
  CLS: 0.1, // unitless
};

export const PERFORMANCE_BUDGETS = {
  JavaScript: 170, // KB
  CSS: 30, // KB
  Images: 200, // KB per image
  Total: 500, // KB total
};

export const IMAGE_SIZES = {
  thumbnail: 150,
  small: 300,
  medium: 600,
  large: 1200,
  xlarge: 1920,
};

export type ImageSize = keyof typeof IMAGE_SIZES;

export function getImageUrl(
  url: string,
  size: ImageSize = 'medium',
  quality: number = 80
): string {
  // For Vercel Image Optimization
  const params = new URLSearchParams({
    url,
    w: IMAGE_SIZES[size].toString(),
    q: quality.toString(),
    fm: 'webp',
  });

  return `/_next/image?${params.toString()}`;
}

export const SEO_JSON_LD = {
  ORGANIZATION: '@type: Organization',
  PRODUCT: '@type: Product',
  PERSON: '@type: Person',
  ARTICLE: '@type: BlogPosting',
  BREADCRUMB: '@type: BreadcrumbList',
};

export interface PageViewData {
  title: string;
  path: string;
  referrer?: string;
  searchQuery?: string;
}

export function trackPageView(data: PageViewData) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_title: data.title,
      page_path: data.path,
      referrer: data.referrer,
    });
  }
}

export interface ConversionData {
  value: number;
  currency: string;
  transactionId: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
}

export function trackConversion(data: ConversionData) {
  if (typeof window === 'undefined') return;

  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: data.transactionId,
      value: data.value,
      currency: data.currency,
      items: data.items,
    });
  }
}
