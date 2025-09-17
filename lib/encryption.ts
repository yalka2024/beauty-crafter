import crypto from 'crypto'

interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
  salt: string
}

export class DatabaseEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32
  private static readonly IV_LENGTH = 16
  private static readonly TAG_LENGTH = 16
  private static readonly SALT_LENGTH = 32

  /**
   * Get encryption key from environment or generate one
   */
  private static getEncryptionKey(): Buffer {
    const masterKey = process.env.ENCRYPTION_MASTER_KEY
    if (!masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required')
    }
    
    // Convert hex string to buffer
    return Buffer.from(masterKey, 'hex')
  }

  /**
   * Derive key from master key and salt
   */
  private static deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, this.KEY_LENGTH, 'sha256')
  }

  /**
   * Encrypt a field value
   */
  static async encryptField(value: string): Promise<string> {
    try {
      if (!value) return value

      const masterKey = this.getEncryptionKey()
      const salt = crypto.randomBytes(this.SALT_LENGTH)
      const key = this.deriveKey(masterKey, salt)
      const iv = crypto.randomBytes(this.IV_LENGTH)
      
      const cipher = crypto.createCipher(this.ALGORITHM, key)
      cipher.setAAD(salt)
      
      let encrypted = cipher.update(value, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const tag = cipher.getAuthTag()
      
      const encryptedData: EncryptedData = {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        salt: salt.toString('hex')
      }
      
      return JSON.stringify(encryptedData)
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`)
    }
  }

  /**
   * Decrypt a field value
   */
  static async decryptField(encryptedValue: string): Promise<string> {
    try {
      if (!encryptedValue) return encryptedValue

      const encryptedData: EncryptedData = JSON.parse(encryptedValue)
      const masterKey = this.getEncryptionKey()
      const salt = Buffer.from(encryptedData.salt, 'hex')
      const key = this.deriveKey(masterKey, salt)
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')
      
      const decipher = crypto.createDecipher(this.ALGORITHM, key)
      decipher.setAAD(salt)
      decipher.setAuthTag(tag)
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`)
    }
  }

  /**
   * Encrypt PII data
   */
  static async encryptPII(data: string): Promise<string> {
    return this.encryptField(data)
  }

  /**
   * Decrypt PII data
   */
  static async decryptPII(encryptedData: string): Promise<string> {
    return this.decryptField(encryptedData)
  }

  /**
   * Hash password with salt
   */
  static async hashPassword(password: string): Promise<{ hash: string; salt: string }> {
    const salt = crypto.randomBytes(32).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
    return { hash, salt }
  }

  /**
   * Verify password hash
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex')
    return hash === testHash
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Generate API key
   */
  static generateApiKey(): string {
    const prefix = 'bck_'
    const randomPart = crypto.randomBytes(24).toString('hex')
    return prefix + randomPart
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

// Export convenience functions
export const encryption = DatabaseEncryption
export const encryptField = DatabaseEncryption.encryptField
export const decryptField = DatabaseEncryption.decryptField
export const encryptPII = DatabaseEncryption.encryptPII
export const decryptPII = DatabaseEncryption.decryptPII