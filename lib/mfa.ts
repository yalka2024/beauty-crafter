import { prisma } from './prisma'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'
import crypto from 'crypto'

export class MFA {
  /**
   * Generate MFA secret for a user
   */
  static async generateSecret(userId: string): Promise<{
    secret: string
    qrCodeUrl: string
    backupCodes: string[]
  }> {
    try {
      // Generate TOTP secret
      const secret = authenticator.generateSecret()
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      )
      
      // Create QR code URL
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')
      
      const serviceName = 'Beauty Crafter'
      const accountName = user.email
      const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret)
      const qrCodeUrl = await QRCode.toDataURL(otpAuthUrl)
      
      // Store secret and backup codes in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret,
          mfaBackupCodes: backupCodes
        }
      })
      
      return {
        secret,
        qrCodeUrl,
        backupCodes
      }
    } catch (error) {
      throw new Error(`Failed to generate MFA secret: ${error}`)
    }
  }
  
  /**
   * Verify MFA token
   */
  static async verifyToken(userId: string, token: string): Promise<{
    isValid: boolean
    isBackupCode?: boolean
  }> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { mfaSecret: true, mfaBackupCodes: true }
      })
      
      if (!user || !user.mfaSecret) {
        return { isValid: false }
      }
      
      // Check if it's a backup code
      if (user.mfaBackupCodes.includes(token)) {
        // Remove used backup code
        const updatedBackupCodes = user.mfaBackupCodes.filter(code => code !== token)
        await prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: updatedBackupCodes }
        })
        
        return { isValid: true, isBackupCode: true }
      }
      
      // Verify TOTP token
      const isValid = authenticator.verify({ 
        token, 
        secret: user.mfaSecret 
      })
      
      return { isValid, isBackupCode: false }
    } catch (error) {
      return { isValid: false }
    }
  }
  
  /**
   * Enable MFA for user
   */
  static async enableMFA(userId: string, token: string): Promise<boolean> {
    try {
      const verification = await this.verifyToken(userId, token)
      
      if (!verification.isValid) {
        return false
      }
      
      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true }
      })
      
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Disable MFA for user
   */
  static async disableMFA(userId: string, password: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { password: true }
      })
      
      if (!user) return false
      
      // Verify password before disabling MFA
      const bcrypt = require('bcryptjs')
      const isPasswordValid = await bcrypt.compare(password, user.password)
      
      if (!isPasswordValid) return false
      
      await prisma.user.update({
        where: { id: userId },
        data: { 
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: []
        }
      })
      
      return true
    } catch (error) {
      return false
    }
  }
  
  /**
   * Check if MFA is enabled for user
   */
  static async isEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { mfaEnabled: true }
      })
      
      return user?.mfaEnabled || false
    } catch (error) {
      return false
    }
  }
}

// Export convenience functions
export const generateMFASecret = MFA.generateSecret
export const verifyMFAToken = MFA.verifyToken
export const enableMFA = MFA.enableMFA
export const disableMFA = MFA.disableMFA
export const isMFAEnabled = MFA.isEnabled