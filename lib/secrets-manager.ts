import { logger } from './logging'
import { monitoring } from './monitoring'

// Environment variable fallbacks
const DEFAULT_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long'
const DEFAULT_SECRETS_REGION = process.env.AWS_REGION || 'us-east-1'

// Secret configuration interface
interface SecretConfig {
  name: string
  description: string
  required: boolean
  encrypted: boolean
  rotationEnabled: boolean
  rotationDays?: number
  tags?: Record<string, string>
}

// Secret metadata
interface SecretMetadata {
  name: string
  version: string
  createdAt: Date
  lastModified: Date
  lastRotated?: Date
  nextRotation?: Date
  tags: Record<string, string>
}

// Secret value with metadata
interface SecretValue {
  value: string
  metadata: SecretMetadata
}

// Encryption interface
interface EncryptionProvider {
  encrypt(data: string): Promise<string>
  decrypt(encryptedData: string): Promise<string>
  generateKey(): Promise<string>
}

// AWS Secrets Manager interface
interface AWSSecretsManager {
  getSecret(secretName: string): Promise<SecretValue>
  putSecret(secretName: string, secretValue: string, metadata?: Partial<SecretMetadata>): Promise<void>
  deleteSecret(secretName: string): Promise<void>
  listSecrets(): Promise<string[]>
  rotateSecret(secretName: string): Promise<void>
}

// Local encryption provider using AES-256-GCM
class LocalEncryptionProvider implements EncryptionProvider {
  private algorithm = 'aes-256-gcm'
  private keyLength = 32
  private ivLength = 16
  private tagLength = 16

  async encrypt(data: string): Promise<string> {
    try {
      const key = await this.deriveKey(DEFAULT_ENCRYPTION_KEY)
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength))
      
      const encodedData = new TextEncoder().encode(data)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: this.algorithm, length: 256 },
        false,
        ['encrypt']
      )
      
      const encrypted = await crypto.subtle.encrypt(
        { name: this.algorithm, iv },
        cryptoKey,
        encodedData
      )
      
      // Combine IV, encrypted data, and auth tag
      const result = new Uint8Array(iv.length + encrypted.byteLength + this.tagLength)
      result.set(iv, 0)
      result.set(new Uint8Array(encrypted), iv.length)
      
      return Buffer.from(result).toString('base64')
    } catch (error) {
      logger.error('Encryption failed:', error)
      throw new Error('Failed to encrypt secret')
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.deriveKey(DEFAULT_ENCRYPTION_KEY)
      const data = Buffer.from(encryptedData, 'base64')
      
      const iv = data.slice(0, this.ivLength)
      const encrypted = data.slice(this.ivLength, -this.tagLength)
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: this.algorithm, length: 256 },
        false,
        ['decrypt']
      )
      
      const decrypted = await crypto.subtle.decrypt(
        { name: this.algorithm, iv },
        cryptoKey,
        encrypted
      )
      
      return new TextDecoder().decode(decrypted)
    } catch (error) {
      logger.error('Decryption failed:', error)
      throw new Error('Failed to decrypt secret')
    }
  }

  async generateKey(): Promise<string> {
    const key = crypto.getRandomValues(new Uint8Array(this.keyLength))
    return Buffer.from(key).toString('base64')
  }

  private async deriveKey(password: string): Promise<ArrayBuffer> {
    const salt = new TextEncoder().encode('beauty-crafter-salt')
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    return crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      this.keyLength * 8
    )
  }
}

// AWS Secrets Manager implementation
class AWSSecretsManagerProvider implements AWSSecretsManager {
  private client: any
  private region: string

  constructor() {
    this.region = DEFAULT_SECRETS_REGION
    this.initializeClient()
  }

  private async initializeClient() {
    try {
      // Dynamic import to avoid bundling AWS SDK in client
      const { SecretsManager } = await import('@aws-sdk/client-secrets-manager')
      this.client = new SecretsManager({ region: this.region })
    } catch (error) {
      logger.warn('AWS SDK not available, falling back to local secrets:', error)
      this.client = null
    }
  }

  async getSecret(secretName: string): Promise<SecretValue> {
    if (!this.client) {
      throw new Error('AWS Secrets Manager not available')
    }

    try {
      const response = await this.client.getSecretValue({ SecretId: secretName })
      
      if (response.SecretString) {
        const secret = JSON.parse(response.SecretString)
        return {
          value: secret.value || secret,
          metadata: {
            name: secretName,
            version: response.VersionId || '1',
            createdAt: response.CreatedDate || new Date(),
            lastModified: response.LastModifiedDate || new Date(),
            lastRotated: secret.lastRotated ? new Date(secret.lastRotated) : undefined,
            nextRotation: secret.nextRotation ? new Date(secret.nextRotation) : undefined,
            tags: secret.tags || {}
          }
        }
      }
      
      throw new Error('Secret not found or invalid')
    } catch (error) {
      logger.error('Failed to get secret from AWS:', error)
      throw new Error(`Failed to retrieve secret: ${secretName}`)
    }
  }

  async putSecret(secretName: string, secretValue: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    if (!this.client) {
      throw new Error('AWS Secrets Manager not available')
    }

    try {
      const secretData = {
        value: secretValue,
        ...metadata,
        lastModified: new Date().toISOString()
      }

      await this.client.putSecretValue({
        SecretId: secretName,
        SecretString: JSON.stringify(secretData)
      })

      logger.info(`Secret updated: ${secretName}`)
    } catch (error) {
      logger.error('Failed to put secret to AWS:', error)
      throw new Error(`Failed to store secret: ${secretName}`)
    }
  }

  async deleteSecret(secretName: string): Promise<void> {
    if (!this.client) {
      throw new Error('AWS Secrets Manager not available')
    }

    try {
      await this.client.deleteSecret({ SecretId: secretName })
      logger.info(`Secret deleted: ${secretName}`)
    } catch (error) {
      logger.error('Failed to delete secret from AWS:', error)
      throw new Error(`Failed to delete secret: ${secretName}`)
    }
  }

  async listSecrets(): Promise<string[]> {
    if (!this.client) {
      throw new Error('AWS Secrets Manager not available')
    }

    try {
      const response = await this.client.listSecrets()
      return response.SecretList?.map((secret: any) => secret.Name) || []
    } catch (error) {
      logger.error('Failed to list secrets from AWS:', error)
      throw new Error('Failed to list secrets')
    }
  }

  async rotateSecret(secretName: string): Promise<void> {
    if (!this.client) {
      throw new Error('AWS Secrets Manager not available')
    }

    try {
      await this.client.rotateSecret({ SecretId: secretName })
      logger.info(`Secret rotation initiated: ${secretName}`)
    } catch (error) {
      logger.error('Failed to rotate secret in AWS:', error)
      throw new Error(`Failed to rotate secret: ${secretName}`)
    }
  }
}

// Main secrets manager class
export class SecretsManager {
  private static instance: SecretsManager
  private encryptionProvider: EncryptionProvider
  private awsProvider: AWSSecretsManagerProvider
  private localSecrets: Map<string, SecretValue> = new Map()
  private secretConfigs: Map<string, SecretConfig> = new Map()
  private rotationScheduler: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.encryptionProvider = new LocalEncryptionProvider()
    this.awsProvider = new AWSSecretsManagerProvider()
    this.initializeDefaultSecrets()
    this.startRotationScheduler()
  }

  public static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager()
    }
    return SecretsManager.instance
  }

  private initializeDefaultSecrets(): void {
    // Define required secrets configuration
    const defaultSecrets: SecretConfig[] = [
      {
        name: 'DATABASE_URL',
        description: 'Database connection string',
        required: true,
        encrypted: true,
        rotationEnabled: false
      },
      {
        name: 'JWT_SECRET',
        description: 'JWT signing secret',
        required: true,
        encrypted: true,
        rotationEnabled: true,
        rotationDays: 90
      },
      {
        name: 'STRIPE_SECRET_KEY',
        description: 'Stripe API secret key',
        required: true,
        encrypted: true,
        rotationEnabled: false
      },
      {
        name: 'OPENAI_SECRET_KEY',
        description: 'OpenAI API secret key',
        required: true,
        encrypted: true,
        rotationEnabled: false
      },
      {
        name: 'TWILIO_AUTH_TOKEN',
        description: 'Twilio authentication token',
        required: true,
        encrypted: true,
        rotationEnabled: true,
        rotationDays: 365
      },
      {
        name: 'SENTRY_DSN',
        description: 'Sentry DSN for error tracking',
        required: false,
        encrypted: false,
        rotationEnabled: false
      },
      {
        name: 'REDIS_URL',
        description: 'Redis connection string',
        required: false,
        encrypted: true,
        rotationEnabled: false
      }
    ]

    defaultSecrets.forEach(config => {
      this.secretConfigs.set(config.name, config)
    })
  }

  /**
   * Get a secret value
   */
  async getSecret(secretName: string): Promise<string> {
    try {
      // Check if secret is configured
      const config = this.secretConfigs.get(secretName)
      if (!config) {
        logger.warn(`Secret not configured: ${secretName}`)
        return process.env[secretName] || ''
      }

      // Try AWS Secrets Manager first
      try {
        const secret = await this.awsProvider.getSecret(secretName)
        this.localSecrets.set(secretName, secret)
        return secret.value
      } catch (awsError) {
        logger.debug(`AWS Secrets Manager failed for ${secretName}, using local fallback`)
      }

      // Fallback to local secrets
      const localSecret = this.localSecrets.get(secretName)
      if (localSecret) {
        return localSecret.value
      }

      // Fallback to environment variables
      const envValue = process.env[secretName]
      if (envValue) {
        if (config.encrypted) {
          try {
            const decrypted = await this.encryptionProvider.decrypt(envValue)
            const secret: SecretValue = {
              value: decrypted,
              metadata: {
                name: secretName,
                version: '1',
                createdAt: new Date(),
                lastModified: new Date(),
                tags: {}
              }
            }
            this.localSecrets.set(secretName, secret)
            return decrypted
          } catch (decryptError) {
            logger.warn(`Failed to decrypt secret ${secretName}, using as-is`)
            return envValue
          }
        }
        return envValue
      }

      // Check if secret is required
      if (config.required) {
        throw new Error(`Required secret not found: ${secretName}`)
      }

      return ''
    } catch (error) {
      monitoring.recordError(error as Error, 'secrets_manager')
      logger.error(`Failed to get secret: ${secretName}`, error)
      throw error
    }
  }

  /**
   * Set a secret value
   */
  async setSecret(secretName: string, value: string, metadata?: Partial<SecretMetadata>): Promise<void> {
    try {
      const config = this.secretConfigs.get(secretName)
      if (!config) {
        logger.warn(`Setting unconfigured secret: ${secretName}`)
      }

      // Encrypt if required
      let secretValue = value
      if (config?.encrypted) {
        secretValue = await this.encryptionProvider.encrypt(value)
      }

      // Store in AWS Secrets Manager
      try {
        await this.awsProvider.putSecret(secretName, secretValue, metadata)
      } catch (awsError) {
        logger.warn(`Failed to store secret in AWS, using local storage: ${secretName}`)
      }

      // Store locally
      const secret: SecretValue = {
        value,
        metadata: {
          name: secretName,
          version: metadata?.version || '1',
          createdAt: metadata?.createdAt || new Date(),
          lastModified: new Date(),
          lastRotated: metadata?.lastRotated,
          nextRotation: metadata?.nextRotation,
          tags: metadata?.tags || {}
        }
      }

      this.localSecrets.set(secretName, secret)

      // Update environment variable for compatibility
      if (config?.encrypted) {
        process.env[secretName] = secretValue
      } else {
        process.env[secretName] = value
      }

      logger.info(`Secret stored: ${secretName}`)
      monitoring.recordMetric('secret_stored', 1, { name: secretName })
    } catch (error) {
      monitoring.recordError(error as Error, 'secrets_manager')
      logger.error(`Failed to set secret: ${secretName}`, error)
      throw error
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(secretName: string): Promise<void> {
    try {
      // Remove from AWS
      try {
        await this.awsProvider.deleteSecret(secretName)
      } catch (awsError) {
        logger.warn(`Failed to delete secret from AWS: ${secretName}`)
      }

      // Remove locally
      this.localSecrets.delete(secretName)
      
      // Remove from environment
      delete process.env[secretName]

      logger.info(`Secret deleted: ${secretName}`)
      monitoring.recordMetric('secret_deleted', 1, { name: secretName })
    } catch (error) {
      monitoring.recordError(error as Error, 'secrets_manager')
      logger.error(`Failed to delete secret: ${secretName}`, error)
      throw error
    }
  }

  /**
   * List all available secrets
   */
  async listSecrets(): Promise<string[]> {
    try {
      const awsSecrets = await this.awsProvider.listSecrets()
      const localSecrets = Array.from(this.localSecrets.keys())
      const envSecrets = Object.keys(process.env).filter(key => 
        this.secretConfigs.has(key)
      )
      
      const allSecrets = new Set([...awsSecrets, ...localSecrets, ...envSecrets])
      return Array.from(allSecrets)
    } catch (error) {
      logger.error('Failed to list secrets:', error)
      return Array.from(this.localSecrets.keys())
    }
  }

  /**
   * Rotate a secret
   */
  async rotateSecret(secretName: string): Promise<void> {
    try {
      const config = this.secretConfigs.get(secretName)
      if (!config?.rotationEnabled) {
        throw new Error(`Secret rotation not enabled: ${secretName}`)
      }

      // Generate new value based on secret type
      const newValue = await this.generateSecretValue(secretName)
      
      // Store new value
      await this.setSecret(secretName, newValue, {
        lastRotated: new Date(),
        nextRotation: new Date(Date.now() + (config.rotationDays || 90) * 24 * 60 * 60 * 1000)
      })

      // Trigger AWS rotation if available
      try {
        await this.awsProvider.rotateSecret(secretName)
      } catch (awsError) {
        logger.warn(`AWS rotation failed for ${secretName}`)
      }

      logger.info(`Secret rotated: ${secretName}`)
      monitoring.recordMetric('secret_rotated', 1, { name: secretName })
    } catch (error) {
      monitoring.recordError(error as Error, 'secrets_manager')
      logger.error(`Failed to rotate secret: ${secretName}`, error)
      throw error
    }
  }

  /**
   * Generate a new secret value
   */
  private async generateSecretValue(secretName: string): Promise<string> {
    if (secretName.includes('JWT') || secretName.includes('SECRET')) {
      return await this.encryptionProvider.generateKey()
    }
    
    if (secretName.includes('KEY')) {
      return await this.encryptionProvider.generateKey()
    }
    
    if (secretName.includes('TOKEN')) {
      return await this.encryptionProvider.generateKey()
    }
    
    // Default: generate random string
    return crypto.randomUUID()
  }

  /**
   * Start rotation scheduler
   */
  private startRotationScheduler(): void {
    setInterval(() => {
      this.checkRotationSchedule()
    }, 60 * 60 * 1000) // Check every hour
  }

  /**
   * Check and execute scheduled rotations
   */
  private async checkRotationSchedule(): Promise<void> {
    for (const [secretName, secret] of this.localSecrets.entries()) {
      const config = this.secretConfigs.get(secretName)
      if (config?.rotationEnabled && secret.metadata.nextRotation) {
        if (new Date() >= secret.metadata.nextRotation) {
          try {
            await this.rotateSecret(secretName)
          } catch (error) {
            logger.error(`Scheduled rotation failed for ${secretName}:`, error)
          }
        }
      }
    }
  }

  /**
   * Get secret configuration
   */
  getSecretConfig(secretName: string): SecretConfig | undefined {
    return this.secretConfigs.get(secretName)
  }

  /**
   * Add custom secret configuration
   */
  addSecretConfig(config: SecretConfig): void {
    this.secretConfigs.set(config.name, config)
    logger.info(`Secret configuration added: ${config.name}`)
  }

  /**
   * Validate all required secrets are present
   */
  async validateSecrets(): Promise<{ valid: boolean; missing: string[] }> {
    const missing: string[] = []
    
    for (const [name, config] of this.secretConfigs.entries()) {
      if (config.required) {
        try {
          const value = await this.getSecret(name)
          if (!value) {
            missing.push(name)
          }
        } catch (error) {
          missing.push(name)
        }
      }
    }
    
    return {
      valid: missing.length === 0,
      missing
    }
  }

  /**
   * Get secrets health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    totalSecrets: number
    configuredSecrets: number
    encryptedSecrets: number
    rotationEnabled: number
    lastError?: string
  }> {
    try {
      const validation = await this.validateSecrets()
      const totalSecrets = this.secretConfigs.size
      const configuredSecrets = totalSecrets - validation.missing.length
      const encryptedSecrets = Array.from(this.secretConfigs.values()).filter(c => c.encrypted).length
      const rotationEnabled = Array.from(this.secretConfigs.values()).filter(c => c.rotationEnabled).length
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      if (validation.missing.length > 0) {
        status = validation.missing.length < totalSecrets * 0.5 ? 'degraded' : 'unhealthy'
      }
      
      return {
        status,
        totalSecrets,
        configuredSecrets,
        encryptedSecrets,
        rotationEnabled
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        totalSecrets: 0,
        configuredSecrets: 0,
        encryptedSecrets: 0,
        rotationEnabled: 0,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const secretsManager = SecretsManager.getInstance()

// Export convenience functions
export const getSecret = (name: string) => secretsManager.getSecret(name)
export const setSecret = (name: string, value: string) => secretsManager.setSecret(name, value)
export const deleteSecret = (name: string) => secretsManager.deleteSecret(name)
export const listSecrets = () => secretsManager.listSecrets()
export const rotateSecret = (name: string) => secretsManager.rotateSecret(name)
export const validateSecrets = () => secretsManager.validateSecrets()
export const getSecretsHealth = () => secretsManager.getHealthStatus()

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  // Validate critical secrets on startup
  secretsManager.validateSecrets().then(validation => {
    if (!validation.valid) {
      logger.error('Critical secrets missing:', validation.missing)
      monitoring.recordMetric('secrets_validation_failed', 1)
    } else {
      logger.info('All critical secrets validated successfully')
      monitoring.recordMetric('secrets_validation_success', 1)
    }
  }).catch(error => {
    logger.error('Secrets validation failed:', error)
    monitoring.recordError(error, 'secrets_validation')
  })
}
