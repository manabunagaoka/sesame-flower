import { NextResponse } from 'next/server';

// Eventbrite API endpoint for searching events
const EVENTBRITE_API_URL = 'https://www.eventbriteapi.com/v3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'Cancun, Mexico';
  const category = searchParams.get('category') || 'family_education';
  
  const apiKey = process.env.EVENTBRITE_API_KEY;
  
  if (!apiKey) {
    // Return mock data if no API key configured
    return NextResponse.json({
      events: getMockEvents(),
      source: 'mock',
      message: 'Using sample data. Add EVENTBRITE_API_KEY to enable live events.',
    });
  }

  try {
    // Search for events in the location
    const response = await fetch(
      `${EVENTBRITE_API_URL}/events/search/?location.address=${encodeURIComponent(location)}&categories=${category}&expand=venue,ticket_availability&token=${apiKey}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error(`Eventbrite API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Eventbrite events to our format
    const events = data.events?.map((event: any) => ({
      icon: getCategoryIcon(event.category_id),
      title: event.name?.text || 'Untitled Event',
      description: event.description?.text?.substring(0, 100) || '',
      time: formatEventTime(event.start?.local),
      eventUrl: event.url,
      thumbnail: event.logo?.url,
      venue: event.venue?.name,
      isFree: event.is_free,
    })) || [];

    return NextResponse.json({
      events,
      source: 'eventbrite',
      total: data.pagination?.object_count || 0,
    });

  } catch (error) {
    console.error('Eventbrite API error:', error);
    // Fallback to mock data on error
    return NextResponse.json({
      events: getMockEvents(),
      source: 'mock',
      error: 'Failed to fetch live events',
    });
  }
}

// Map Eventbrite category IDs to icons
function getCategoryIcon(categoryId: string): string {
  const iconMap: Record<string, string> = {
    '115': 'Palette', // Family & Education
    '110': 'Music',   // Music
    '105': 'Sparkles', // Performing Arts
    '113': 'Trees',   // Community
    '199': 'Book',    // Other
  };
  return iconMap[categoryId] || 'Calendar';
}

// Format event time
function formatEventTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  return date.toLocaleDateString('es-MX', options);
}

// Mock events for development/demo
function getMockEvents() {
  return [
    {
      icon: 'Trees',
      title: 'Xcaret Family Day',
      description: 'Explore nature, culture and wildlife with the whole family',
      time: 'Sáb, Dic 21, 9:00 AM',
      venue: 'Xcaret Park',
      isFree: false,
    },
    {
      icon: 'Palette',
      title: 'Taller de Arte para Niños',
      description: 'Creative art workshop for children ages 4-12',
      time: 'Dom, Dic 22, 10:00 AM',
      venue: 'Centro Cultural Cancún',
      isFree: true,
    },
    {
      icon: 'Music',
      title: 'Música en el Parque',
      description: 'Free family concert in the park',
      time: 'Sáb, Dic 21, 5:00 PM',
      venue: 'Parque de las Palapas',
      isFree: true,
    },
    {
      icon: 'Book',
      title: 'Hora del Cuento',
      description: 'Storytime in Spanish and English for kids',
      time: 'Vie, Dic 20, 11:00 AM',
      venue: 'Biblioteca Pública',
      isFree: true,
    },
    {
      icon: 'Sparkles',
      title: 'Show de Títeres',
      description: 'Puppet show for the whole family',
      time: 'Dom, Dic 22, 4:00 PM',
      venue: 'Plaza Las Américas',
      isFree: true,
    },
  ];
}
