import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MonthClient } from './MonthClient';
import { isValidMonthString, getCurrentMonthString, formatMonthYear } from '@/lib/dateUtils';

interface MonthPageProps {
  params: Promise<{
    month: string;
  }>;
}

export async function generateMetadata({ params }: MonthPageProps): Promise<Metadata> {
  const { month } = await params;
  if (!isValidMonthString(month)) {
    return { title: 'Monthly Goals | DayTrack' };
  }
  const label = formatMonthYear(month);
  return {
    title: `${label} | Monthly Goals`,
    description: `Monthly goals and journal for ${label}`,
  };
}

export default async function MonthPage({ params }: MonthPageProps) {
  const { month } = await params;

  if (!isValidMonthString(month)) {
    redirect(`/month/${getCurrentMonthString()}`);
  }

  return <MonthClient month={month} />;
}
