'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentMonthString } from '@/lib/dateUtils';

export default function MonthIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const currentMonth = getCurrentMonthString();
    router.replace(`/month/${currentMonth}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#090a0d] flex items-center justify-center">
      <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-zinc-400 animate-ping" />
        <span>Loading monthly workspace...</span>
      </div>
    </div>
  );
}
