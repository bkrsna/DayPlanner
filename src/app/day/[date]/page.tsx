import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DayClient } from './DayClient';
import { isValidDateString, formatMediumDate, getTodayDateString } from '@/lib/dateUtils';

interface DayPageProps {
  params: Promise<{
    date: string;
  }>;
}

export async function generateMetadata({ params }: DayPageProps): Promise<Metadata> {
  const { date } = await params;
  if (!isValidDateString(date)) {
    return { title: 'Daily Goal Tracker' };
  }
  return {
    title: `${formatMediumDate(date)} | Daily Goal Tracker`,
    description: `Daily goals, todos, habits, and reflections for ${date}`,
  };
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  if (!isValidDateString(date)) {
    redirect(`/day/${getTodayDateString()}`);
  }

  return <DayClient date={date} />;
}
