'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTodayDateString } from '@/lib/dateUtils';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const today = getTodayDateString();
    router.replace(`/day/${today}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
      <div className="flex items-center gap-2.5 text-zinc-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <span>Opening today&apos;s goal workspace...</span>
      </div>
    </div>
  );
}
