import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportReview } from '@/lib/reviews';
import { z } from 'zod';

// Report schema
const ReportSchema = z.object({
  reviewId: z.string().cuid(),
  reason: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// POST /api/reviews/report - Report a review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ReportSchema.parse(body);

    const report = await reportReview(
      validatedData.reviewId,
      session.user.id,
      validatedData.reason,
      validatedData.description
    );

    return NextResponse.json({ 
      report,
      message: 'Review reported successfully. Our moderation team will review it.' 
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('already reported')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error('Error reporting review:', error);
    return NextResponse.json(
      { error: 'Failed to report review' },
      { status: 500 }
    );
  }
} 