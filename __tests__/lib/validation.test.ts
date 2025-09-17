import { 
  emailSchema, 
  passwordSchema, 
  phoneSchema, 
  nameSchema,
  userRegistrationSchema,
  userLoginSchema,
  serviceSchema,
  bookingSchema,
  validateRequest,
  sanitizeString,
  sanitizeObject
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org'
      ]

      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow()
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow()
      })
    })
  })

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123',
        'MySecurePass1',
        'ComplexP@ss1'
      ]

      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow()
      })
    })

    it('should reject weak passwords', () => {
      const invalidPasswords = [
        'password', // no uppercase, no number
        'PASSWORD', // no lowercase, no number
        'Password', // no number
        'pass123', // no uppercase
        'PASS123', // no lowercase
        '12345678', // no letters
        'short' // too short
      ]

      invalidPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).toThrow()
      })
    })
  })

  describe('phoneSchema', () => {
    it('should validate phone numbers', () => {
      const validPhones = [
        '+1-555-123-4567',
        '(555) 123-4567',
        '555.123.4567',
        '555 123 4567',
        '+44 20 7946 0958'
      ]

      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow()
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        'not-a-phone',
        '123',
        'abc-def-ghij',
        '555-123-4567-extra'
      ]

      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow()
      })
    })
  })

  describe('nameSchema', () => {
    it('should validate names', () => {
      const validNames = [
        'John',
        'Mary Jane',
        'José',
        'O\'Connor',
        'van der Berg'
      ]

      validNames.forEach(name => {
        expect(() => nameSchema.parse(name)).not.toThrow()
      })
    })

    it('should reject invalid names', () => {
      const invalidNames = [
        'A', // too short
        'This is a very long name that exceeds the maximum allowed length of fifty characters', // too long
        '', // empty
        '   ' // only spaces
      ]

      invalidNames.forEach(name => {
        expect(() => nameSchema.parse(name)).toThrow()
      })
    })
  })

  describe('userRegistrationSchema', () => {
    it('should validate complete user registration data', () => {
      const validUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        password: 'SecurePass123',
        role: 'client' as const,
        termsAccepted: true
      }

      expect(() => userRegistrationSchema.parse(validUser)).not.toThrow()
    })

    it('should reject incomplete user registration data', () => {
      const invalidUser = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'weak',
        role: 'client' as const,
        termsAccepted: false
      }

      expect(() => userRegistrationSchema.parse(invalidUser)).toThrow()
    })

    it('should require terms acceptance', () => {
      const userWithoutTerms = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        role: 'client' as const,
        termsAccepted: false
      }

      expect(() => userRegistrationSchema.parse(userWithoutTerms)).toThrow('You must accept the terms and conditions')
    })
  })

  describe('userLoginSchema', () => {
    it('should validate login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'password123'
      }

      expect(() => userLoginSchema.parse(validLogin)).not.toThrow()
    })

    it('should reject empty password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: ''
      }

      expect(() => userLoginSchema.parse(invalidLogin)).toThrow('Password is required')
    })
  })

  describe('serviceSchema', () => {
    it('should validate service data', () => {
      const validService = {
        name: 'Haircut',
        description: 'Professional haircut service with consultation',
        price: 50.00,
        duration: 60,
        category: 'Hair',
        location: 'onsite' as const,
        isActive: true
      }

      expect(() => serviceSchema.parse(validService)).not.toThrow()
    })

    it('should reject negative prices', () => {
      const invalidService = {
        name: 'Haircut',
        description: 'Professional haircut service',
        price: -50.00,
        duration: 60,
        category: 'Hair',
        location: 'onsite' as const
      }

      expect(() => serviceSchema.parse(invalidService)).toThrow('Price must be positive')
    })
  })

  describe('bookingSchema', () => {
    it('should validate booking data', () => {
      const validBooking = {
        serviceId: '123e4567-e89b-12d3-a456-426614174000',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        clientId: '123e4567-e89b-12d3-a456-426614174002',
        scheduledAt: '2024-01-15T10:00:00Z',
        notes: 'Please arrive 10 minutes early',
        addOns: ['123e4567-e89b-12d3-a456-426614174003']
      }

      expect(() => bookingSchema.parse(validBooking)).not.toThrow()
    })

    it('should reject invalid UUIDs', () => {
      const invalidBooking = {
        serviceId: 'invalid-uuid',
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        clientId: '123e4567-e89b-12d3-a456-426614174002',
        scheduledAt: '2024-01-15T10:00:00Z'
      }

      expect(() => bookingSchema.parse(invalidBooking)).toThrow('Invalid service ID')
    })
  })
})

describe('validateRequest function', () => {
  it('should validate JSON requests', async () => {
    const mockRequest = {
      headers: new Map([['content-type', 'application/json']]),
      json: jest.fn().mockResolvedValue({
        email: 'test@example.com',
        password: 'password123'
      })
    } as any

    const result = await validateRequest(mockRequest, userLoginSchema)
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@example.com')
      expect(result.data.password).toBe('password123')
    }
  })

  it('should reject invalid data', async () => {
    const mockRequest = {
      headers: new Map([['content-type', 'application/json']]),
      json: jest.fn().mockResolvedValue({
        email: 'invalid-email',
        password: ''
      })
    } as any

    const result = await validateRequest(mockRequest, userLoginSchema)
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors).toContain('email: Invalid email format')
      expect(result.errors).toContain('password: Password is required')
    }
  })

  it('should handle form data', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')

    const mockRequest = {
      headers: new Map([['content-type', 'application/x-www-form-urlencoded']]),
      formData: jest.fn().mockResolvedValue(formData)
    } as any

    const result = await validateRequest(mockRequest, userLoginSchema)
    
    expect(result.success).toBe(true)
  })
})

describe('Sanitization functions', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script')
    })

    it('should remove javascript protocol', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick="alert(\'xss\')"')).toBe('alert(\'xss\')"')
    })

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test')
    })
  })

  describe('sanitizeObject', () => {
    it('should sanitize nested objects', () => {
      const input = {
        name: '  <script>alert("xss")</script>  ',
        profile: {
          bio: 'javascript:alert("xss")',
          website: 'http://example.com'
        }
      }

      const sanitized = sanitizeObject(input)
      
      expect(sanitized.name).toBe('scriptalert("xss")/script')
      expect(sanitized.profile.bio).toBe('alert("xss")')
      expect(sanitized.profile.website).toBe('http://example.com')
    })

    it('should handle arrays', () => {
      const input = {
        tags: ['<script>', 'javascript:alert("xss")', 'normal-tag']
      }

      const sanitized = sanitizeObject(input)
      
      expect(sanitized.tags[0]).toBe('script')
      expect(sanitized.tags[1]).toBe('alert("xss")')
      expect(sanitized.tags[2]).toBe('normal-tag')
    })
  })
}) 