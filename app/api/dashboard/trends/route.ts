// API route for user dashboard trends
import { NextRequest, NextResponse } from 'next/server';

// TODO: Replace with real DB/storage
const trends = [
  {
    summary: 'Facials and skincare routines are trending in your area. Consider offering new facial packages.',
    details: ['Hydrating facials', 'LED light therapy', 'Personalized skincare plans'],
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(trends);
}
