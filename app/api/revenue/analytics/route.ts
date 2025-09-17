import { NextRequest, NextResponse } from 'next/server'
import { revenueAnalytics } from '@/lib/revenue-analytics'
import { securityMiddleware } from '@/lib/security-middleware'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

// GET - Get revenue overview and analytics
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Check if user is admin (in production, this would be proper auth)
    const isAdmin = request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
    
    if (!isAdmin) {
      return apiResponse.error('Admin access required for revenue analytics', 403)
    }

    // Get timeframe from query params
    const timeframe = request.nextUrl.searchParams.get('timeframe') as 'day' | 'week' | 'month' | 'quarter' | 'year' || 'month'
    
    // Get revenue overview
    const overview = await revenueAnalytics.getRevenueOverview(timeframe)
    
    // Get revenue insights
    const insights = await revenueAnalytics.getRevenueInsights()
    
    const responseData = {
      overview,
      insights,
      timeframe,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('revenue_analytics_retrieved', 1, { 
      timeframe,
      hasInsights: !!insights
    })

    return apiResponse.success(responseData, 'Revenue analytics retrieved successfully', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'revenue_analytics_endpoint')
    return apiResponse.serverError('Failed to retrieve revenue analytics')
  }
}

// POST - Generate custom revenue reports
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Check if user is admin
    const isAdmin = request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
    
    if (!isAdmin) {
      return apiResponse.error('Admin access required for custom reports', 403)
    }

    // Parse request body
    const body = await request.json()
    const { reportType, parameters, format = 'json' } = body

    let reportData: any
    let message: string

    switch (reportType) {
      case 'revenue_forecast':
        reportData = await generateRevenueForecast(parameters)
        message = 'Revenue forecast generated successfully'
        break
        
      case 'subscription_analysis':
        reportData = await generateSubscriptionAnalysis(parameters)
        message = 'Subscription analysis generated successfully'
        break
        
      case 'ai_service_performance':
        reportData = await generateAIServicePerformance(parameters)
        message = 'AI service performance report generated successfully'
        break
        
      case 'provider_revenue':
        reportData = await generateProviderRevenueReport(parameters)
        message = 'Provider revenue report generated successfully'
        break
        
      case 'customer_segmentation':
        reportData = await generateCustomerSegmentation(parameters)
        message = 'Customer segmentation report generated successfully'
        break
        
      default:
        return apiResponse.error('Invalid report type', 400)
    }

    const responseData = {
      reportType,
      parameters,
      data: reportData,
      format,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('custom_revenue_report_generated', 1, { 
      reportType,
      format
    })

    return apiResponse.success(responseData, message, {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'custom_revenue_report_endpoint')
    return apiResponse.serverError('Failed to generate custom revenue report')
  }
}

// PUT - Export revenue data
export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Check if user is admin
    const isAdmin = request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
    
    if (!isAdmin) {
      return apiResponse.error('Admin access required for data export', 403)
    }

    // Parse request body
    const body = await request.json()
    const { exportType, timeframe, format = 'csv' } = body

    let exportData: any
    let message: string

    switch (exportType) {
      case 'revenue_summary':
        exportData = await exportRevenueSummary(timeframe, format)
        message = 'Revenue summary exported successfully'
        break
        
      case 'subscription_data':
        exportData = await exportSubscriptionData(timeframe, format)
        message = 'Subscription data exported successfully'
        break
        
      case 'ai_service_data':
        exportData = await exportAIServiceData(timeframe, format)
        message = 'AI service data exported successfully'
        break
        
      case 'provider_data':
        exportData = await exportProviderData(timeframe, format)
        message = 'Provider data exported successfully'
        break
        
      default:
        return apiResponse.error('Invalid export type', 400)
    }

    const responseData = {
      exportType,
      timeframe,
      format,
      data: exportData,
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime
    }

    // Record metrics
    monitoring.recordMetric('revenue_data_exported', 1, { 
      exportType,
      format
    })

    return apiResponse.success(responseData, message, {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'revenue_export_endpoint')
    return apiResponse.serverError('Failed to export revenue data')
  }
}

// Helper functions for custom reports
async function generateRevenueForecast(parameters: any) {
  try {
    const { periods = 6, confidence = 0.95 } = parameters
    
    // Get historical data and generate forecast
    const overview = await revenueAnalytics.getRevenueOverview('month')
    const forecast = overview.projections
    
    return {
      forecast,
      confidence,
      assumptions: [
        'Linear growth trend continues',
        'No major market disruptions',
        'Current pricing strategy maintained'
      ],
      riskFactors: [
        'Economic downturn',
        'Competition changes',
        'Regulatory changes'
      ]
    }
  } catch (error) {
    logger.error('Failed to generate revenue forecast', { error: String(error) })
    throw error
  }
}

async function generateSubscriptionAnalysis(parameters: any) {
  try {
    const { includeChurn = true, includeGrowth = true } = parameters
    
    const overview = await revenueAnalytics.getRevenueOverview('month')
    
    return {
      totalSubscriptions: overview.metrics.monthlyRecurringRevenue > 0 ? 'Active' : 'No active subscriptions',
      subscriptionBreakdown: overview.breakdown.byTier,
      churnAnalysis: includeChurn ? {
        currentChurnRate: overview.metrics.churnRate,
        churnTrend: 'Stable', // This would be calculated from historical data
        retentionStrategies: [
          'Improve onboarding experience',
          'Implement loyalty programs',
          'Regular check-ins and support'
        ]
      } : null,
      growthAnalysis: includeGrowth ? {
        conversionRate: overview.metrics.conversionRate,
        growthOpportunities: [
          'Referral programs',
          'Free trial offers',
          'Content marketing'
        ]
      } : null
    }
  } catch (error) {
    logger.error('Failed to generate subscription analysis', { error: String(error) })
    throw error
  }
}

async function generateAIServicePerformance(parameters: any) {
  try {
    const { includeTrends = true, includeRecommendations = true } = parameters
    
    // This would integrate with the AI monetization manager
    // For now, return placeholder data
    return {
      totalServices: 0,
      revenueGenerated: 0,
      popularServices: [],
      serviceQuality: {
        averageRating: 0,
        completionRate: 0,
        customerSatisfaction: 0
      },
      trends: includeTrends ? {
        growthRate: 0,
        seasonalPatterns: [],
        emergingServices: []
      } : null,
      recommendations: includeRecommendations ? [
        'Expand AI consultation offerings',
        'Improve response quality',
        'Reduce processing time'
      ] : null
    }
  } catch (error) {
    logger.error('Failed to generate AI service performance report', { error: String(error) })
    throw error
  }
}

async function generateProviderRevenueReport(parameters: any) {
  try {
    const { topProviders = 10, includeTrends = true } = parameters
    
    const overview = await revenueAnalytics.getRevenueOverview('month')
    const providerRevenue = overview.breakdown.byProvider
    
    // Sort providers by revenue
    const sortedProviders = Object.entries(providerRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, topProviders)
    
    return {
      topProviders: sortedProviders.map(([name, revenue]) => ({ name, revenue })),
      totalProviderRevenue: Object.values(providerRevenue).reduce((sum, val) => sum + val, 0),
      averageProviderRevenue: Object.values(providerRevenue).reduce((sum, val) => sum + val, 0) / Object.keys(providerRevenue).length,
      trends: includeTrends ? {
        topPerformers: sortedProviders.slice(0, 3).map(([name]) => name),
        growthLeaders: [], // This would be calculated from historical data
        opportunities: [
          'Support underperforming providers',
          'Expand provider base',
          'Improve provider tools'
        ]
      } : null
    }
  } catch (error) {
    logger.error('Failed to generate provider revenue report', { error: String(error) })
    throw error
  }
}

async function generateCustomerSegmentation(parameters: any) {
  try {
    const { segments = ['subscription_tier', 'usage_pattern', 'geographic'] } = parameters
    
    // This would analyze customer data and create segments
    // For now, return placeholder data
    return {
      totalCustomers: 0,
      segments: segments.map(segment => ({
        type: segment,
        count: 0,
        revenue: 0,
        characteristics: [],
        opportunities: []
      })),
      insights: [
        'High-value customers prefer premium tiers',
        'Geographic clustering in urban areas',
        'Seasonal usage patterns detected'
      ]
    }
  } catch (error) {
    logger.error('Failed to generate customer segmentation report', { error: String(error) })
    throw error
  }
}

// Helper functions for data export
async function exportRevenueSummary(timeframe: string, format: string) {
  try {
    const overview = await revenueAnalytics.getRevenueOverview(timeframe as any)
    
    if (format === 'csv') {
      return convertToCSV(overview)
    }
    
    return overview
  } catch (error) {
    logger.error('Failed to export revenue summary', { error: String(error) })
    throw error
  }
}

async function exportSubscriptionData(timeframe: string, format: string) {
  try {
    // This would export detailed subscription data
    // For now, return placeholder
    const data = {
      timeframe,
      subscriptions: [],
      metrics: {}
    }
    
    if (format === 'csv') {
      return convertToCSV(data)
    }
    
    return data
  } catch (error) {
    logger.error('Failed to export subscription data', { error: String(error) })
    throw error
  }
}

async function exportAIServiceData(timeframe: string, format: string) {
  try {
    // This would export AI service data
    // For now, return placeholder
    const data = {
      timeframe,
      services: [],
      performance: {}
    }
    
    if (format === 'csv') {
      return convertToCSV(data)
    }
    
    return data
  } catch (error) {
    logger.error('Failed to export AI service data', { error: String(error) })
    throw error
  }
}

async function exportProviderData(timeframe: string, format: string) {
  try {
    // This would export provider data
    // For now, return placeholder
    const data = {
      timeframe,
      providers: [],
      revenue: {}
    }
    
    if (format === 'csv') {
      return convertToCSV(data)
    }
    
    return data
  } catch (error) {
    logger.error('Failed to export provider data', { error: String(error) })
    throw error
  }
}

// Utility function to convert data to CSV format
function convertToCSV(data: any): string {
  try {
    // Simple CSV conversion - in production, use a proper CSV library
    if (Array.isArray(data)) {
      if (data.length === 0) return ''
      
      const headers = Object.keys(data[0])
      const csvRows = [headers.join(',')]
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header]
          return typeof value === 'string' ? `"${value}"` : value
        })
        csvRows.push(values.join(','))
      }
      
      return csvRows.join('\n')
    }
    
    // For non-array data, create a simple key-value CSV
    const rows = Object.entries(data).map(([key, value]) => `${key},${value}`)
    return rows.join('\n')
  } catch (error) {
    logger.error('Failed to convert data to CSV', { error: String(error) })
    return ''
  }
} 