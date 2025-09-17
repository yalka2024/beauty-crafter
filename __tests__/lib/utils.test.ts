import { cn } from '@/lib/utils'

describe('cn utility function', () => {
  it('should combine multiple class strings', () => {
    const result = cn('class1', 'class2', 'class3')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle empty strings', () => {
    const result = cn('class1', '', 'class3')
    expect(result).toBe('class1 class3')
  })

  it('should handle undefined values', () => {
    const result = cn('class1', undefined, 'class3')
    expect(result).toBe('class1 class3')
  })

  it('should handle null values', () => {
    const result = cn('class1', null, 'class3')
    expect(result).toBe('class1 class3')
  })

  it('should handle false values', () => {
    const result = cn('class1', false, 'class3')
    expect(result).toBe('class1 class3')
  })

  it('should handle arrays of classes', () => {
    const result = cn('class1', ['class2', 'class3'], 'class4')
    expect(result).toBe('class1 class2 class3 class4')
  })

  it('should handle nested arrays', () => {
    const result = cn('class1', [['class2', 'class3'], 'class4'])
    expect(result).toBe('class1 class2 class3 class4')
  })

  it('should handle objects with conditional classes', () => {
    const result = cn('class1', { 'class2': true, 'class3': false, 'class4': true })
    expect(result).toBe('class1 class2 class4')
  })

  it('should handle mixed types', () => {
    const result = cn('class1', ['class2', 'class3'], { 'class4': true, 'class5': false }, 'class6')
    expect(result).toBe('class1 class2 class3 class4 class6')
  })

  it('should handle no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle single class', () => {
    const result = cn('single-class')
    expect(result).toBe('single-class')
  })

  it('should handle complex conditional logic', () => {
    const isActive = true
    const isDisabled = false
    const size = 'large'
    
    const result = cn(
      'base-class',
      isActive && 'active',
      isDisabled && 'disabled',
      size === 'large' && 'text-lg'
    )
    
    expect(result).toBe('base-class active text-lg')
  })

  it('should handle Tailwind CSS conflicts properly', () => {
    // This tests that tailwind-merge is working correctly
    const result = cn('p-4', 'p-8', 'px-6')
    // Should resolve to the last conflicting class
    expect(result).toBe('p-8 px-6')
  })

  it('should handle whitespace properly', () => {
    const result = cn('  class1  ', '  class2  ', '  class3  ')
    expect(result).toBe('class1 class2 class3')
  })

  it('should handle numbers', () => {
    const result = cn('class1', 42, 'class3')
    expect(result).toBe('class1 42 class3')
  })

  it('should handle functions that return strings', () => {
    const getClass = () => 'dynamic-class'
    const result = cn('class1', getClass(), 'class3')
    expect(result).toBe('class1 dynamic-class class3')
  })
})



