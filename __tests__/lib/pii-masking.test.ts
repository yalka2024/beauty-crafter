import { maskPII } from '@/lib/pii-masking'

describe('maskPII function', () => {
  describe('email masking', () => {
    it('should mask email addresses correctly', () => {
      expect(maskPII('john.doe@example.com', 'email')).toBe('j***e@example.com')
      expect(maskPII('user@domain.org', 'email')).toBe('u***r@domain.org')
      expect(maskPII('a@b.com', 'email')).toBe('a***a@b.com')
    })

    it('should handle short usernames', () => {
      expect(maskPII('ab@example.com', 'email')).toBe('a***b@example.com')
      expect(maskPII('x@test.org', 'email')).toBe('x***x@test.org')
    })

    it('should handle long usernames', () => {
      expect(maskPII('verylongusername@example.com', 'email')).toBe('v***e@example.com')
      expect(maskPII('superlongname@test.org', 'email')).toBe('s***e@test.org')
    })

    it('should handle special characters in usernames', () => {
      expect(maskPII('user.name@example.com', 'email')).toBe('u***e@example.com')
      expect(maskPII('user-name@test.org', 'email')).toBe('u***e@test.org')
      expect(maskPII('user_name@domain.com', 'email')).toBe('u***e@domain.com')
    })
  })

  describe('phone masking', () => {
    it('should mask phone numbers correctly', () => {
      expect(maskPII('1234567890', 'phone')).toBe('******7890')
      expect(maskPII('555-123-4567', 'phone')).toBe('********4567')
      expect(maskPII('(555) 123-4567', 'phone')).toBe('**********4567')
    })

    it('should handle short phone numbers', () => {
      expect(maskPII('1234', 'phone')).toBe('1234')
      expect(maskPII('12345', 'phone')).toBe('*2345')
      expect(maskPII('123456', 'phone')).toBe('**3456')
    })

    it('should handle phone numbers with letters', () => {
      expect(maskPII('1-800-FLOWERS', 'phone')).toBe('*********WERS')
      expect(maskPII('555-ABC-1234', 'phone')).toBe('********1234')
    })

    it('should handle international formats', () => {
      expect(maskPII('+1-555-123-4567', 'phone')).toBe('***********4567')
      expect(maskPII('44 20 7946 0958', 'phone')).toBe('***********0958')
    })
  })

  describe('name masking', () => {
    it('should mask names correctly', () => {
      expect(maskPII('John', 'name')).toBe('J***')
      expect(maskPII('Jane', 'name')).toBe('J***')
      expect(maskPII('Bob', 'name')).toBe('B***')
    })

    it('should handle single character names', () => {
      expect(maskPII('A', 'name')).toBe('A***')
      expect(maskPII('Z', 'name')).toBe('Z***')
    })

    it('should handle long names', () => {
      expect(maskPII('Christopher', 'name')).toBe('C***')
      expect(maskPII('Elizabeth', 'name')).toBe('E***')
    })

    it('should handle names with spaces', () => {
      expect(maskPII('John Doe', 'name')).toBe('J***')
      expect(maskPII('Mary Jane', 'name')).toBe('M***')
    })

    it('should handle names with special characters', () => {
      expect(maskPII('Jean-Pierre', 'name')).toBe('J***')
      expect(maskPII('O\'Connor', 'name')).toBe('O***')
      expect(maskPII('van der Berg', 'name')).toBe('v***')
    })
  })

  describe('generic masking', () => {
    it('should return generic mask for unknown types', () => {
      expect(maskPII('any value', 'unknown' as any)).toBe('***')
      expect(maskPII('test', 'invalid' as any)).toBe('***')
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(maskPII('', 'email')).toBe('')
      expect(maskPII('', 'phone')).toBe('')
      expect(maskPII('', 'name')).toBe('')
    })

    it('should handle null and undefined values', () => {
      expect(maskPII(null as any, 'email')).toBe('')
      expect(maskPII(undefined as any, 'phone')).toBe('')
    })

    it('should handle very short values', () => {
      expect(maskPII('a', 'email')).toBe('a***a@undefined')
      expect(maskPII('1', 'phone')).toBe('1')
      expect(maskPII('x', 'name')).toBe('x***')
    })

    it('should handle whitespace', () => {
      expect(maskPII('  john@example.com  ', 'email')).toBe(' ***n@example.com  ')
      expect(maskPII('  John  ', 'name')).toBe(' ***')
    })
  })
})
