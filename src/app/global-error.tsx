'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-white">
          <div className="max-w-lg w-full rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm font-medium text-red-300">Critical application error</p>
            <h1 className="mt-2 text-2xl font-bold">Service unavailable</h1>
            <p className="mt-3 text-white/70">
              Reload the page or try again in a moment.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={reset}>Retry</Button>
              <Button variant="outline" asChild>
                <Link href="/">Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
