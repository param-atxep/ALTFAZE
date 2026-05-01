'use client';

import { useEffect } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

interface VitalsData {
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  FCP?: number;
}

export function useWebVitals() {
  useEffect(() => {
    const vitals: VitalsData = {};

    // Collect Core Web Vitals
    getLCP(metric => {
      vitals.LCP = metric.value;
      trackVitals(vitals);
    });

    getFID(metric => {
      vitals.FID = metric.value;
      trackVitals(vitals);
    });

    getCLS(metric => {
      vitals.CLS = metric.value;
      trackVitals(vitals);
    });

    getTTFB(metric => {
      vitals.TTFB = metric.value;
      trackVitals(vitals);
    });

    getFCP(metric => {
      vitals.FCP = metric.value;
      trackVitals(vitals);
    });
  }, []);
}

function trackVitals(vitals: VitalsData) {
  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;

    // Send as event
    gtag('event', 'web_vitals', {
      metric_id: 'web_vitals',
      value: vitals,
      metric_category: 'performance',
      metric_value: Object.values(vitals).reduce((a, b) => (a || 0) + (b || 0), 0) / Object.keys(vitals).length,
    });

    // Check thresholds and send as events
    if (vitals.LCP && vitals.LCP > 2500) {
      gtag('event', 'page_view_with_poor_lcp', {
        value: vitals.LCP,
      });
    }

    if (vitals.FID && vitals.FID > 100) {
      gtag('event', 'page_view_with_poor_fid', {
        value: vitals.FID,
      });
    }

    if (vitals.CLS && vitals.CLS > 0.1) {
      gtag('event', 'page_view_with_poor_cls', {
        value: vitals.CLS,
      });
    }
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', vitals);
  }
}

// Utility function to send performance metrics
export function reportPerformanceMetrics(metrics: Record<string, number>) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;

    gtag('event', 'performance_metrics', {
      metric_value: metrics,
    });

    // Send individual metrics
    Object.entries(metrics).forEach(([key, value]) => {
      gtag('event', `metric_${key}`, {
        value,
      });
    });
  }
}

// Utility function to track page views with custom data
export function trackPageView(data: {
  page_title: string;
  page_path: string;
  referrer?: string;
  search_query?: string;
}) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;

    gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_title: data.page_title,
      page_path: data.page_path,
      referrer: data.referrer,
      search_query: data.search_query,
    });

    // Also send as event for more granular tracking
    gtag('event', 'page_view_custom', {
      page_title: data.page_title,
      page_path: data.page_path,
      event_category: 'engagement',
    });
  }
}

// Track conversions/purchases
export function trackConversion(data: {
  value: number;
  currency: string;
  transaction_id?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}) {
  if (typeof window !== 'undefined' && 'gtag' in window) {
    const gtag = (window as any).gtag;

    gtag('event', 'purchase', {
      value: data.value,
      currency: data.currency,
      transaction_id: data.transaction_id,
      items: data.items,
    });
  }
}
