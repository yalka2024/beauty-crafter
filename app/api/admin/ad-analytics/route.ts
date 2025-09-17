// API route for ad analytics events (stub: in-memory for demo)
import { NextRequest, NextResponse } from 'next/server';

const adEvents: any[] = [];

export async function GET() {
  return NextResponse.json(adEvents);
}

export async function POST(request: NextRequest) {
  const event = await request.json();
  adEvents.push(event);
  return NextResponse.json({ success: true });
}
