import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logging'

export interface APIVersion {
  version: string
  status: 'current' | 'deprecated' | 'sunset'
  sunsetDate?: Date
  deprecationDate?: Date
  changelog: string[]
}

export interface VersionedRequest extends NextRequest {
  apiVersion: string
  versionInfo: APIVersion
}

// API version configuration
const API_VERSIONS: Record<string, APIVersion> = {
  'v1': {
    version: 'v1',
    status: 'current',
    changelog: [
      'Initial API version',
      'Basic CRUD operations',
      'Authentication and authorization',
      'User management',
      'Service booking system'
    ]
  },
  'v2': {
    version: 'v2',
    status: 'current',
    changelog: [
      'Enhanced error responses',
      'Improved pagination',
      'Additional filtering options',
      'Rate limiting improvements',
      'Better validation messages'
    ]
  },
  'v0': {
    version: 'v0',
    status: 'deprecated',
    deprecationDate: new Date('2024-01-01'),
    sunsetDate: new Date('2024-06-01'),
    changelog: [
      'Legacy API version',
      'Will be sunset on 2024-06-01'
    ]
  }
}

export class APIVersionManager {
  private static instance: APIVersionManager
  private versions: Record<string, APIVersion>

  private constructor() {
    this.versions = API_VERSIONS
  }

  public static getInstance(): APIVersionManager {
    if (!APIVersionManager.instance) {
      APIVersionManager.instance = new APIVersionManager()
    }
    return APIVersionManager.instance
  }

  /**
   * Extract API version from request
   */
  extractVersion(request: NextRequest): { version: string; versionInfo: APIVersion | null } {
    const pathname = request.nextUrl.pathname
    const versionMatch = pathname.match(/^\/api\/(v\d+)\//)
    
    if (!versionMatch) {
      return { version: 'v1', versionInfo: this.versions['v1'] }
    }
    
    const version = versionMatch[1]
    const versionInfo = this.versions[version] || null
    
    return { version, versionInfo }
  }

  /**
   * Validate API version
   */
  validateVersion(version: string): { valid: boolean; error?: string } {
    const versionInfo = this.versions[version]
    
    if (!versionInfo) {
      return { valid: false, error: `Unsupported API version: ${version}` }
    }
    
    if (versionInfo.status === 'sunset') {
      return { valid: false, error: `API version ${version} has been sunset` }
    }
    
    return { valid: true }
  }

  /**
   * Add version headers to response
   */
  addVersionHeaders(response: NextResponse, version: string, versionInfo: APIVersion): NextResponse {
    response.headers.set('API-Version', version)
    response.headers.set('API-Status', versionInfo.status)
    
    if (versionInfo.deprecationDate) {
      response.headers.set('API-Deprecation-Date', versionInfo.deprecationDate.toISOString())
    }
    
    if (versionInfo.sunsetDate) {
      response.headers.set('API-Sunset-Date', versionInfo.sunsetDate.toISOString())
    }
    
    // Add deprecation warning if applicable
    if (versionInfo.status === 'deprecated') {
      response.headers.set('Warning', `299 - "API version ${version} is deprecated"`)
    }
    
    return response
  }

  /**
   * Get all available versions
   */
  getAvailableVersions(): APIVersion[] {
    return Object.values(this.versions)
  }

  /**
   * Get current version
   */
  getCurrentVersion(): APIVersion | null {
    return Object.values(this.versions).find(v => v.status === 'current') || null
  }

  /**
   * Get deprecated versions
   */
  getDeprecatedVersions(): APIVersion[] {
    return Object.values(this.versions).filter(v => v.status === 'deprecated')
  }

  /**
   * Check if version is deprecated
   */
  isDeprecated(version: string): boolean {
    const versionInfo = this.versions[version]
    return versionInfo?.status === 'deprecated' || false
  }

  /**
   * Check if version is sunset
   */
  isSunset(version: string): boolean {
    const versionInfo = this.versions[version]
    return versionInfo?.status === 'sunset' || false
  }

  /**
   * Get version info
   */
  getVersionInfo(version: string): APIVersion | null {
    return this.versions[version] || null
  }
}

/**
 * API versioning middleware
 */
export function withAPIVersioning(handler: (request: VersionedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const versionManager = APIVersionManager.getInstance()
    const { version, versionInfo } = versionManager.extractVersion(request)
    
    // Validate version
    const validation = versionManager.validateVersion(version)
    if (!validation.valid) {
      logger.warn('Invalid API version requested', { 
        version, 
        path: request.nextUrl.pathname,
        error: validation.error 
      })
      
      return NextResponse.json(
        { 
          error: 'Invalid API version',
          message: validation.error,
          availableVersions: versionManager.getAvailableVersions().map(v => v.version)
        },
        { status: 400 }
      )
    }
    
    // Create versioned request
    const versionedRequest = request as VersionedRequest
    versionedRequest.apiVersion = version
    versionedRequest.versionInfo = versionInfo!
    
    // Log API version usage
    logger.info('API request with version', { 
      version, 
      path: request.nextUrl.pathname,
      status: versionInfo!.status 
    })
    
    // Call handler
    const response = await handler(versionedRequest)
    
    // Add version headers
    return versionManager.addVersionHeaders(response, version, versionInfo!)
  }
}

/**
 * Version-specific response helpers
 */
export class VersionedResponse {
  /**
   * Create a standardized error response
   */
  static error(
    message: string, 
    code: string, 
    statusCode: number = 400,
    version: string = 'v1'
  ): NextResponse {
    const response = NextResponse.json({
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        version
      }
    }, { status: statusCode })
    
    return response
  }

  /**
   * Create a standardized success response
   */
  static success(
    data: any,
    message?: string,
    statusCode: number = 200,
    version: string = 'v1'
  ): NextResponse {
    const response = NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      version
    }, { status: statusCode })
    
    return response
  }

  /**
   * Create a paginated response
   */
  static paginated(
    data: any[],
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    },
    version: string = 'v1'
  ): NextResponse {
    const response = NextResponse.json({
      success: true,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
        hasNext: pagination.page < pagination.totalPages,
        hasPrev: pagination.page > 1
      },
      timestamp: new Date().toISOString(),
      version
    })
    
    return response
  }
}

/**
 * API version info endpoint
 */
export async function getAPIVersionInfo(): Promise<NextResponse> {
  const versionManager = APIVersionManager.getInstance()
  const versions = versionManager.getAvailableVersions()
  const current = versionManager.getCurrentVersion()
  
  return NextResponse.json({
    current: current?.version,
    available: versions.map(v => ({
      version: v.version,
      status: v.status,
      deprecationDate: v.deprecationDate?.toISOString(),
      sunsetDate: v.sunsetDate?.toISOString(),
      changelog: v.changelog
    })),
    timestamp: new Date().toISOString()
  })
}
