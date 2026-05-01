'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg w-full rounded-2xl border bg-white p-8 shadow-lg">
        <p className="text-sm font-medium text-red-600">Application error</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-600">
          Please try again. If the problem persists, reload the page or return to the homepage.
        </p>
        <div className="mt-6 flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
