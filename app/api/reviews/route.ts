import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createReview, 
  getProviderReviews, 
  getUserReviews,
  updateReview,
  deleteReview,
  reportReview,
  ReviewData
} from '@/lib/reviews';
import { z } from 'zod';

// GET /api/reviews - Get reviews (provider or user)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined;
    const sortBy = searchParams.get('sortBy') as 'newest' | 'oldest' | 'highest' | 'lowest' | undefined;

    let result;

    if (providerId) {
      // Get reviews for a specific provider
      result = await getProviderReviews(providerId, limit, offset, { rating, sortBy });
    } else if (userId) {
      // Get reviews by a specific user
      result = await getUserReviews(userId, limit, offset);
    } else {
      // Get current user's reviews
      result = await getUserReviews(session.user.id, limit, offset);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate review data
    const reviewData: ReviewData = {
      bookingId: body.bookingId,
      rating: body.rating,
      comment: body.comment,
      categories: body.categories,
      isAnonymous: body.isAnonymous || false,
    };

    const review = await createReview(reviewData, session.user.id);

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating review:', error);
    
    if (error.message.includes('already reviewed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('only review completed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message.includes('expired')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews - Update a review
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, rating, comment } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const updateData: Partial<Pick<ReviewData, 'rating' | 'comment'>> = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    const review = await updateReview(reviewId, session.user.id, updateData);

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error('Error updating review:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('only update your own')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error.message.includes('within 7 days')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews - Delete a review
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteReview(reviewId, session.user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error deleting review:', error);
    
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message.includes('only delete your own')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error.message.includes('within 7 days')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
} 