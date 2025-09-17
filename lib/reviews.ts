import { prisma } from './prisma';
import { z } from 'zod';
import { createNotification, NotificationType } from './notifications';

// Review validation schema
export const ReviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(1000).optional(),
  categories: z.array(z.enum([
    'QUALITY',
    'PROFESSIONALISM',
    'PUNCTUALITY',
    'CLEANLINESS',
    'COMMUNICATION',
    'VALUE',
    'OVERALL_EXPERIENCE'
  ])).optional(),
  isAnonymous: z.boolean().default(false),
});

export type ReviewData = z.infer<typeof ReviewSchema>;

// Review categories with weights for overall rating calculation
export const REVIEW_CATEGORIES = {
  QUALITY: { weight: 0.25, label: 'Service Quality' },
  PROFESSIONALISM: { weight: 0.20, label: 'Professionalism' },
  PUNCTUALITY: { weight: 0.15, label: 'Punctuality' },
  CLEANLINESS: { weight: 0.15, label: 'Cleanliness' },
  COMMUNICATION: { weight: 0.10, label: 'Communication' },
  VALUE: { weight: 0.10, label: 'Value for Money' },
  OVERALL_EXPERIENCE: { weight: 0.05, label: 'Overall Experience' },
} as const;

// Create a new review
export async function createReview(reviewData: ReviewData, userId: string) {
  try {
    // Validate the review data
    const validatedData = ReviewSchema.parse(reviewData);

    // Check if the user has a completed booking for this service
    const booking = await prisma.booking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        client: { include: { user: true } },
        provider: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.client.userId !== userId) {
      throw new Error('You can only review your own bookings');
    }

    if (booking.status !== 'COMPLETED') {
      throw new Error('You can only review completed bookings');
    }

    // Check if review already exists for this booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: validatedData.bookingId },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this booking');
    }

    // Check if the review period is still valid (within 30 days of completion)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (booking.updatedAt < thirtyDaysAgo) {
      throw new Error('Review period has expired (30 days after service completion)');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        bookingId: validatedData.bookingId,
        clientId: userId,
        providerId: booking.providerId,
        rating: validatedData.rating,
        comment: validatedData.comment,
        isPublic: true,
      },
    });

    // Update provider's rating and review count
    await updateProviderRating(booking.providerId);

    // Send notification to provider about new review
    await createNotification({
      userId: booking.provider.userId,
      type: NotificationType.REVIEW_RECEIVED,
      data: {
        rating: validatedData.rating,
        clientName: validatedData.isAnonymous ? 'Anonymous' : booking.client.user.name,
        serviceName: booking.service.name,
        comment: validatedData.comment || '',
        reviewId: review.id,
      },
    });

    return review;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

// Update provider's overall rating
async function updateProviderRating(providerId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        providerId,
        isPublic: true,
      },
      select: {
        rating: true,
      },
    });

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await prisma.provider.update({
      where: { id: providerId },
      data: {
        rating: averageRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error('Error updating provider rating:', error);
  }
}

// Get reviews for a provider
export async function getProviderReviews(
  providerId: string,
  limit = 20,
  offset = 0,
  filters?: {
    rating?: number;
    sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  }
) {
  try {
    const whereClause: any = {
      providerId,
      isPublic: true,
    };

    if (filters?.rating) {
      whereClause.rating = filters.rating;
    }

    let orderBy: any = { createdAt: 'desc' };

    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'highest':
          orderBy = { rating: 'desc' };
          break;
        case 'lowest':
          orderBy = { rating: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        client: { include: { user: { select: { name: true, avatar: true } } } },
        booking: { include: { service: { select: { name: true } } } },
      },
      orderBy,
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.review.count({
      where: whereClause,
    });

    // Calculate rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { providerId, isPublic: true },
      _count: { rating: true },
    });

    const distribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const count = ratingDistribution.find(d => d.rating === rating)?._count.rating || 0;
      return { rating, count, percentage: (count / totalCount) * 100 };
    });

    return {
      reviews,
      totalCount,
      ratingDistribution: distribution,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching provider reviews:', error);
    throw error;
  }
}

// Get user's reviews
export async function getUserReviews(userId: string, limit = 20, offset = 0) {
  try {
    const reviews = await prisma.review.findMany({
      where: { clientId: userId },
      include: {
        provider: { include: { user: { select: { name: true, avatar: true } } } },
        booking: { include: { service: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.review.count({
      where: { clientId: userId },
    });

    return {
      reviews,
      totalCount,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    throw error;
  }
}

// Update a review
export async function updateReview(
  reviewId: string,
  userId: string,
  updateData: Partial<Pick<ReviewData, 'rating' | 'comment'>>
) {
  try {
    // Verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { provider: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.clientId !== userId) {
      throw new Error('You can only update your own reviews');
    }

    // Check if review is within editable period (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (review.createdAt < sevenDaysAgo) {
      throw new Error('Review can only be edited within 7 days of creation');
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    // Update provider's rating if rating changed
    if (updateData.rating) {
      await updateProviderRating(review.providerId);
    }

    return updatedReview;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
}

// Delete a review
export async function deleteReview(reviewId: string, userId: string) {
  try {
    // Verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { provider: true },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    if (review.clientId !== userId) {
      throw new Error('You can only delete your own reviews');
    }

    // Check if review is within deletable period (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (review.createdAt < sevenDaysAgo) {
      throw new Error('Review can only be deleted within 7 days of creation');
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update provider's rating
    await updateProviderRating(review.providerId);

    return { message: 'Review deleted successfully' };
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
}

// Report a review (for moderation)
export async function reportReview(
  reviewId: string,
  userId: string,
  reason: string,
  description?: string
) {
  try {
    // Check if user has already reported this review
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reportedBy: userId,
      },
    });

    if (existingReport) {
      throw new Error('You have already reported this review');
    }

    // Create the report
    const report = await prisma.reviewReport.create({
      data: {
        reviewId,
        reportedBy: userId,
        reason,
        description,
        status: 'PENDING',
      },
    });

    // TODO: Send notification to moderators
    // await notifyModerators(report);

    return report;
  } catch (error) {
    console.error('Error reporting review:', error);
    throw error;
  }
}

// Get review analytics for a provider
export async function getProviderReviewAnalytics(providerId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        providerId,
        isPublic: true,
      },
      select: {
        rating: true,
        createdAt: true,
        comment: true,
      },
    });

    if (reviews.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: [],
        recentTrend: [],
        responseRate: 0,
        sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
      };
    }

    // Calculate basic metrics
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    // Rating distribution
    const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const count = reviews.filter(r => r.rating === rating).length;
      return { rating, count, percentage: (count / totalReviews) * 100 };
    });

    // Recent trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentReviews = reviews.filter(r => r.createdAt >= sixMonthsAgo);
    const monthlyRatings = Array.from({ length: 6 }, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthReviews = recentReviews.filter(r => 
        r.createdAt >= monthStart && r.createdAt <= monthEnd
      );
      
      const avgRating = monthReviews.length > 0 
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length 
        : 0;
      
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        averageRating: avgRating,
        reviewCount: monthReviews.length,
      };
    }).reverse();

    // Sentiment analysis (simple keyword-based)
    const positiveKeywords = ['great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'fantastic'];
    const negativeKeywords = ['terrible', 'awful', 'horrible', 'disappointing', 'bad', 'hate', 'worst'];
    
    let positive = 0, neutral = 0, negative = 0;
    
    reviews.forEach(review => {
      if (review.comment) {
        const comment = review.comment.toLowerCase();
        const hasPositive = positiveKeywords.some(keyword => comment.includes(keyword));
        const hasNegative = negativeKeywords.some(keyword => comment.includes(keyword));
        
        if (hasPositive && !hasNegative) positive++;
        else if (hasNegative && !hasPositive) negative++;
        else neutral++;
      } else {
        neutral++;
      }
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      recentTrend: monthlyRatings,
      responseRate: 0, // TODO: Implement provider response tracking
      sentimentAnalysis: {
        positive: Math.round((positive / totalReviews) * 100),
        neutral: Math.round((neutral / totalReviews) * 100),
        negative: Math.round((negative / totalReviews) * 100),
      },
    };
  } catch (error) {
    console.error('Error calculating review analytics:', error);
    throw error;
  }
}

// Get review statistics for admin dashboard
export async function getReviewStatistics() {
  try {
    const [
      totalReviews,
      reviewsThisMonth,
      averageRating,
      reportedReviews,
      pendingModeration,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
      }),
      prisma.reviewReport.count({
        where: { status: 'PENDING' },
      }),
      prisma.review.count({
        where: { isPublic: false },
      }),
    ]);

    return {
      totalReviews,
      reviewsThisMonth,
      averageRating: averageRating._avg.rating || 0,
      reportedReviews,
      pendingModeration,
    };
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    throw error;
  }
} 