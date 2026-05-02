import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  imageAlt?: string;
  url?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  rating?: number;
  reviewCount?: number;
  price?: number;
  currency?: string;
  noIndex?: boolean;
  siteName?: string;
  locale?: string;
}

export function toAbsoluteUrl(pathOrUrl?: string, fallbackPath = '/') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';

  if (!pathOrUrl) {
    return new URL(fallbackPath, siteUrl).toString();
  }

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl, siteUrl).toString();
  }
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    imageAlt,
    url = '/',
    canonical,
    type = 'website',
    author,
    publishedAt,
    updatedAt,
    noIndex = false,
    siteName = 'ALTFaze',
    locale = 'en_US',
  } = config;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com';
  const resolvedUrl = toAbsoluteUrl(url, '/');
  const canonicalUrl = toAbsoluteUrl(canonical || url, '/');
  const fullTitle = `${title} | ALTFaze`;
  const imageUrl = toAbsoluteUrl(image || '/og-image.png');
  const openGraphType =
    type === 'product' ? 'website' : (type as 'website' | 'article' | 'profile');

  return {
    title: fullTitle,
    description,
    keywords: [...keywords, 'freelance', 'marketplace', 'templates'],
    metadataBase: new URL(siteUrl),
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url: resolvedUrl,
      type: openGraphType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt || title,
        },
      ],
      siteName,
      locale,
      publishedTime: publishedAt,
      modifiedTime: updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@altfaze_io',
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export interface StructuredData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

export function generateOrganizationSchema(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ALTFaze',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
    description: 'Global freelancer marketplace for developers, designers & businesses',
    sameAs: [
      'https://twitter.com/altfaze_io',
      'https://linkedin.com/company/altfaze',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@altfaze.com',
    },
  };
}

export function generateProductSchema(config: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  url: string;
}): StructuredData {
  const { name, description, image, price, currency, rating, reviewCount, url } = config;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    url,
    priceCurrency: currency,
    price,
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
      },
    }),
  };
}

export function generateReviewSchema(config: {
  itemName: string;
  author: string;
  rating: number;
  reviewBody: string;
  url: string;
}): StructuredData {
  const { itemName, author, rating, reviewBody, url } = config;

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Thing',
      name: itemName,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody,
    url,
  };
}

export function generatePersonSchema(config: {
  name: string;
  url: string;
  image?: string;
  description?: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
}): StructuredData {
  const { name, url, image, description, title, rating, reviewCount } = config;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(image && { image }),
    ...(description && { description }),
    ...(title && { jobTitle: title }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount,
      },
    }),
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateArticleSchema(config: {
  title: string;
  description: string;
  image: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  url: string;
}): StructuredData {
  const { title, description, image, author, publishedAt, updatedAt, url } = config;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished: publishedAt,
    dateModified: updatedAt,
    url,
  };
}

export function generateJsonLd(schema: StructuredData | StructuredData[]): string {
  return JSON.stringify(Array.isArray(schema) ? schema : [schema]);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildProjectPath(title: string, id: string): string {
  return `/projects/${slugify(title)}-${id}`;
}

export const SEO_CONSTANTS = {
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://altfaze.com',
  SITE_NAME: 'ALTFaze',
  DEFAULT_DESCRIPTION: 'Global freelancer marketplace for developers, designers & businesses',
  TWITTER_HANDLE: '@altfaze_io',
  COMPANY_EMAIL: 'support@altfaze.com',
};
