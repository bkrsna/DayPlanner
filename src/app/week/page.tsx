'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentWeekString } from '@/lib/dateUtils';

export default function WeekIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const currentWeek = getCurrentWeekString();
    router.replace(`/week/${currentWeek}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#090a0d] flex items-center justify-center">
      <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
        <span>Loading weekly workspace...</span>
      </div>
    </div>
  );
}
