import { NextResponse } from 'next/server';

// Combined Activities API - merges custom events + external events
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'Cancun,Mexico';
  
  try {
    // Fetch both custom and external events in parallel
    const [customResponse, externalResponse] = await Promise.all([
      fetch(`${getBaseUrl(request)}/api/events`),
      fetch(`${getBaseUrl(request)}/api/eventbrite?location=${encodeURIComponent(location)}`),
    ]);
    
    const customData = await customResponse.json();
    const externalData = await externalResponse.json();
    
    // Mark custom events and external events
    const customEvents = (customData.events || []).map((e: Record<string, unknown>) => ({
      ...e,
      isCustom: true,
    }));
    
    const externalEvents = (externalData.events || []).map((e: Record<string, unknown>) => ({
      ...e,
      isCustom: false,
    }));
    
    // Merge and sort by date (custom events first, then by date)
    const allEvents = [...customEvents, ...externalEvents];
    
    // Sort: custom events first, then by date
    allEvents.sort((a, b) => {
      // Custom events come first
      if (a.isCustom && !b.isCustom) return -1;
      if (!a.isCustom && b.isCustom) return 1;
      // Then sort by date if available
      if (a.date && b.date) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });
    
    return NextResponse.json({
      events: allEvents,
      customCount: customEvents.length,
      externalCount: externalEvents.length,
      externalSource: externalData.source,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({
      events: [],
      error: 'Failed to fetch activities',
    });
  }
}

// Get base URL for internal API calls
function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
