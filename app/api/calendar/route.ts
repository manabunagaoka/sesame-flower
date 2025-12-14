import { NextResponse } from 'next/server';
import { MENU_CONTENT } from '@/lib/constants';
import { ContentItem } from '@/lib/types';

// Calendar API - merges custom school events + holidays
export async function GET(request: Request) {
  try {
    // Fetch custom school events
    const customResponse = await fetch(`${getBaseUrl(request)}/api/events`);
    const customData = await customResponse.json();
    
    // Get static holidays from constants (calendar is always an array)
    const calendarContent = MENU_CONTENT.calendar as ContentItem[];
    const holidays = (calendarContent || []).map((e: ContentItem) => ({
      ...e,
      isHoliday: true,
      isCustom: false,
    }));
    
    // Mark custom events
    const customEvents = (customData.events || []).map((e: Record<string, unknown>) => ({
      ...e,
      isCustom: true,
      isHoliday: false,
    }));
    
    // Merge all events
    const allEvents = [...customEvents, ...holidays];
    
    // Sort by date
    allEvents.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });
    
    return NextResponse.json({
      events: allEvents,
      customCount: customEvents.length,
      holidayCount: holidays.length,
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    // Fallback to just holidays if custom events fail
    const calendarContent = MENU_CONTENT.calendar as ContentItem[];
    const holidays = calendarContent || [];
    return NextResponse.json({
      events: holidays,
      customCount: 0,
      holidayCount: holidays.length,
    });
  }
}

// Get base URL for internal API calls
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
