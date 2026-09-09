import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { WeekClient } from './WeekClient';
import { isValidWeekString, getCurrentWeekString, getWeekDateRange } from '@/lib/dateUtils';

interface WeekPageProps {
  params: Promise<{
    week: string;
  }>;
}

export async function generateMetadata({ params }: WeekPageProps): Promise<Metadata> {
  const { week } = await params;
  if (!isValidWeekString(week)) {
    return { title: 'Weekly Goals | DayTrack' };
  }
  const range = getWeekDateRange(week);
  return {
    title: `${range.label} | Weekly Goals`,
    description: `Weekly goals and journal for ${range.label}`,
  };
}

export default async function WeekPage({ params }: WeekPageProps) {
  const { week } = await params;

  if (!isValidWeekString(week)) {
    redirect(`/week/${getCurrentWeekString()}`);
  }

  return <WeekClient week={week} />;
}
