import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Path to local events storage (in production, use a real database)
const EVENTS_FILE = path.join(process.cwd(), 'data', 'custom-events.json');

export interface CustomEvent {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: string;      // ISO date string
  time: string;      // Formatted display time
  venue: string;
  isFree: boolean;
  eventUrl?: string;
  isCustom: true;    // Flag to identify custom events
  createdAt: string;
  createdBy?: string;
}

// Ensure data directory and file exist
async function ensureDataFile() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  try {
    await fs.access(EVENTS_FILE);
  } catch {
    await fs.writeFile(EVENTS_FILE, JSON.stringify({ events: [] }, null, 2));
  }
}

// GET - Retrieve all custom events
export async function GET() {
  try {
    await ensureDataFile();
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    const { events } = JSON.parse(data);
    
    // Filter out past events and sort by date
    const now = new Date();
    const upcomingEvents = events
      .filter((event: CustomEvent) => new Date(event.date) >= now)
      .sort((a: CustomEvent, b: CustomEvent) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    
    return NextResponse.json({ events: upcomingEvents });
  } catch (error) {
    console.error('Error reading events:', error);
    return NextResponse.json({ events: [], error: 'Failed to load events' });
  }
}

// POST - Create a new custom event
export async function POST(request: Request) {
  try {
    await ensureDataFile();
    
    const body = await request.json();
    const { title, description, date, time, venue, isFree, eventUrl, icon } = body;
    
    // Validate required fields
    if (!title || !date || !venue) {
      return NextResponse.json(
        { error: 'Title, date, and venue are required' },
        { status: 400 }
      );
    }
    
    // Read existing events
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    const { events } = JSON.parse(data);
    
    // Create new event
    const newEvent: CustomEvent = {
      id: `custom-${Date.now()}`,
      icon: icon || 'Calendar',
      title,
      description: description || '',
      date,
      time: formatEventTime(date, time),
      venue,
      isFree: isFree ?? true,
      eventUrl,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    
    // Add to events array
    events.push(newEvent);
    
    // Save back to file
    await fs.writeFile(EVENTS_FILE, JSON.stringify({ events }, null, 2));
    
    return NextResponse.json({ event: newEvent, success: true });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a custom event
export async function DELETE(request: Request) {
  try {
    await ensureDataFile();
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }
    
    // Read existing events
    const data = await fs.readFile(EVENTS_FILE, 'utf-8');
    const { events } = JSON.parse(data);
    
    // Filter out the event to delete
    const filteredEvents = events.filter((e: CustomEvent) => e.id !== eventId);
    
    if (filteredEvents.length === events.length) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Save back to file
    await fs.writeFile(EVENTS_FILE, JSON.stringify({ events: filteredEvents }, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

// Format event time for display
function formatEventTime(dateString: string, timeString?: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };
  
  let formatted = date.toLocaleDateString('es-MX', options);
  
  if (timeString) {
    formatted += `, ${timeString}`;
  }
  
  return formatted;
}
