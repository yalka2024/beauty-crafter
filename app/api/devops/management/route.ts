import { NextRequest, NextResponse } from 'next/server'
import { devopsManager } from '@/lib/devops-manager'
import { securityMiddleware } from '@/lib/security-middleware'
import { validationMiddleware } from '@/lib/validation-middleware'
import { apiResponse } from '@/lib/api-response'
import { logger } from '@/lib/logging'
import { monitoring } from '@/lib/monitoring'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      monitoring.recordMetric('devops_request_blocked', 1, { 
        reason: securityResult.blocked ? 'security_threat' : 'security_error' 
      })
      
      return apiResponse.error(
        'Request blocked for security reasons',
        403,
        { threats: securityResult.threats }
      )
    }

    // Validate deployment request
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'deployment.create',
      { sanitize: true, rateLimit: true, logValidation: true }
    )

    if (!validationResult.success) {
      monitoring.recordMetric('devops_validation_failed', 1, { 
        errorCount: validationResult.errors?.length.toString() || '0' 
      })
      
      return apiResponse.validationError(
        validationResult.errors || ['Validation failed']
      )
    }

    const { environment, version, strategy } = validationResult.data

    // Execute deployment
    try {
      const deploymentResult = await devopsManager.deploy(environment, version, strategy)
      
      const responseData = {
        deployment: {
          id: deploymentResult.deploymentId,
          environment,
          version,
          strategy,
          success: deploymentResult.success,
          message: deploymentResult.message,
          timestamp: new Date().toISOString()
        },
        details: deploymentResult.details
      }

      // Record successful deployment
      monitoring.recordMetric('devops_deployment_executed', 1, { 
        environment,
        strategy,
        success: deploymentResult.success.toString()
      })

      logger.info('DevOps deployment executed', {
        environment,
        version,
        strategy,
        success: deploymentResult.success,
        responseTime: Date.now() - startTime,
        platform: 'Beauty Crafter'
      })

      return apiResponse.success(responseData, 'Deployment executed successfully', {
        headers: securityResult.headers
      })

    } catch (deploymentError) {
      monitoring.recordError(deploymentError as Error, 'devops_deployment')
      logger.error('DevOps deployment failed', {
        error: deploymentError instanceof Error ? deploymentError.message : 'Unknown error',
        environment,
        version,
        strategy,
        platform: 'Beauty Crafter'
      })

      return apiResponse.error('Deployment execution failed', 500)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'devops_endpoint')
    logger.error('DevOps endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      platform: 'Beauty Crafter'
    })

    return apiResponse.serverError('DevOps system error')
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Validate rollback request
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'deployment.rollback',
      { sanitize: true, rateLimit: true }
    )

    if (!validationResult.success) {
      return apiResponse.validationError(
        validationResult.errors || ['Invalid rollback request']
      )
    }

    const { environment } = validationResult.data

    // Execute rollback
    try {
      const rollbackResult = await devopsManager.rollback(environment)
      
      const responseData = {
        rollback: {
          environment,
          success: rollbackResult.success,
          message: rollbackResult.message,
          rollbackVersion: rollbackResult.rollbackVersion,
          timestamp: new Date().toISOString()
        }
      }

      monitoring.recordMetric('devops_rollback_executed', 1, { 
        environment,
        success: rollbackResult.success.toString()
      })
      
      return apiResponse.success(responseData, 'Rollback executed successfully', {
        headers: securityResult.headers
      })

    } catch (rollbackError) {
      monitoring.recordError(rollbackError as Error, 'devops_rollback')
      return apiResponse.error('Rollback execution failed', 500)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'devops_rollback_endpoint')
    return apiResponse.serverError('Rollback system error')
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Get deployment status
    const deploymentStatus = devopsManager.getDeploymentStatus()
    
    const responseData = {
      deployment: {
        currentEnvironment: deploymentStatus.currentEnvironment,
        currentVersion: deploymentStatus.currentVersion,
        deploymentHistory: deploymentStatus.deploymentHistory
      },
      system: {
        health: deploymentStatus.systemHealth,
        performance: deploymentStatus.performanceMetrics
      },
      environment: {
        name: deploymentStatus.currentEnvironment,
        config: devopsManager.getEnvironmentConfig(deploymentStatus.currentEnvironment)
      },
      system: {
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        platform: 'Beauty Crafter Enterprise Platform'
      }
    }

    monitoring.recordMetric('devops_status_retrieved', 1)
    
    return apiResponse.success(responseData, 'DevOps status retrieved successfully', {
      headers: securityResult.headers
    })

  } catch (error) {
    monitoring.recordError(error as Error, 'devops_status_endpoint')
    return apiResponse.serverError('Status retrieval error')
  }
}

export async function PATCH(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Security check
    const securityResult = await securityMiddleware.processRequest(request)
    
    if (!securityResult.allowed) {
      return apiResponse.error('Request blocked for security reasons', 403)
    }

    // Validate configuration update request
    const validationResult = await validationMiddleware.validateRequest(
      request,
      'environment.update',
      { sanitize: true, rateLimit: true }
    )

    if (!validationResult.success) {
      return apiResponse.validationError(
        validationResult.errors || ['Invalid configuration update request']
      )
    }

    const { environment, config } = validationResult.data

    // Update environment configuration
    try {
      const updateResult = devopsManager.updateEnvironmentConfig(environment, config)
      
      if (updateResult) {
        const responseData = {
          update: {
            environment,
            success: true,
            changes: Object.keys(config),
            timestamp: new Date().toISOString()
          }
        }

        monitoring.recordMetric('devops_config_updated', 1, { 
          environment,
          changes: Object.keys(config).length.toString()
        })
        
        return apiResponse.success(responseData, 'Environment configuration updated successfully', {
          headers: securityResult.headers
        })
      } else {
        return apiResponse.error('Environment configuration update failed', 400)
      }

    } catch (updateError) {
      monitoring.recordError(updateError as Error, 'devops_config_update')
      return apiResponse.error('Configuration update failed', 500)
    }

  } catch (error) {
    monitoring.recordError(error as Error, 'devops_config_endpoint')
    return apiResponse.serverError('Configuration update error')
  }
} 