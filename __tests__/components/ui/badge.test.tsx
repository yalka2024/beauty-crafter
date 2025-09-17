import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Badge, badgeVariants } from '@/components/ui/badge'
import '@testing-library/jest-dom'

describe('Badge', () => {
  it('should render with default props', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Default Badge')
    expect(badge.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<Badge className="custom-class" data-testid="badge">Custom Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('custom-class')
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full')
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="secondary" data-testid="badge">Secondary Badge</Badge>)
    
    let badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('border-transparent', 'bg-secondary', 'text-secondary-foreground')

    rerender(<Badge variant="destructive" data-testid="badge">Destructive Badge</Badge>)
    badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('border-transparent', 'bg-destructive', 'text-destructive-foreground')

    rerender(<Badge variant="outline" data-testid="badge">Outline Badge</Badge>)
    badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('text-foreground')
  })

  it('should have correct base classes', () => {
    render(<Badge data-testid="badge">Base Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'transition-colors'
    )
  })

  it('should have focus states', () => {
    render(<Badge data-testid="badge">Focus Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass(
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-ring',
      'focus:ring-offset-2'
    )
  })

  it('should have hover states for variants', () => {
    const { rerender } = render(<Badge variant="default" data-testid="badge">Default Badge</Badge>)
    
    let badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('hover:bg-primary/80')

    rerender(<Badge variant="secondary" data-testid="badge">Secondary Badge</Badge>)
    badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('hover:bg-secondary/80')

    rerender(<Badge variant="destructive" data-testid="badge">Destructive Badge</Badge>)
    badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('hover:bg-destructive/80')
  })

  it('should pass through additional props', () => {
    render(
      <Badge 
        data-testid="badge"
        id="test-badge"
        role="status"
        aria-label="Status badge"
      >
        Status Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('id', 'test-badge')
    expect(badge).toHaveAttribute('role', 'status')
    expect(badge).toHaveAttribute('aria-label', 'Status badge')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Badge onClick={handleClick} data-testid="badge">Clickable Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    badge.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard events', () => {
    const handleKeyDown = jest.fn()
    render(<Badge onKeyDown={handleKeyDown} data-testid="badge">Keyboard Badge</Badge>)
    
    const badge = screen.getByTestId('badge')
    fireEvent.keyDown(badge, { key: 'Enter' })
    
    expect(handleKeyDown).toHaveBeenCalled()
  })

  it('should handle aria attributes', () => {
    render(
      <Badge 
        data-testid="badge"
        aria-describedby="badge-help"
        aria-invalid="false"
        aria-live="polite"
      >
        Accessible Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('aria-describedby', 'badge-help')
    expect(badge).toHaveAttribute('aria-invalid', 'false')
    expect(badge).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle data attributes', () => {
    render(
      <Badge 
        data-testid="badge"
        data-cy="status-badge"
        data-test="badge-component"
      >
        Data Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('data-cy', 'status-badge')
    expect(badge).toHaveAttribute('data-test', 'badge-component')
  })

  it('should combine variant and custom classes correctly', () => {
    render(
      <Badge 
        variant="secondary" 
        className="custom-padding" 
        data-testid="badge"
      >
        Combined Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('custom-padding') // custom class
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground') // variant classes
    expect(badge).toHaveClass('inline-flex', 'items-center') // base classes
  })

  it('should handle empty content', () => {
    render(<Badge data-testid="badge" />)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('')
  })

  it('should handle numeric content', () => {
    render(<Badge data-testid="badge">42</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveTextContent('42')
  })

  it('should handle special characters', () => {
    render(<Badge data-testid="badge">🚀 New!</Badge>)
    
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveTextContent('🚀 New!')
  })
})

describe('badgeVariants', () => {
  it('should generate correct class names for different variants', () => {
    const defaultClasses = badgeVariants()
    expect(defaultClasses).toContain('border-transparent')
    expect(defaultClasses).toContain('bg-primary')
    expect(defaultClasses).toContain('text-primary-foreground')

    const secondaryClasses = badgeVariants({ variant: 'secondary' })
    expect(secondaryClasses).toContain('border-transparent')
    expect(secondaryClasses).toContain('bg-secondary')
    expect(secondaryClasses).toContain('text-secondary-foreground')

    const destructiveClasses = badgeVariants({ variant: 'destructive' })
    expect(destructiveClasses).toContain('border-transparent')
    expect(destructiveClasses).toContain('bg-destructive')
    expect(destructiveClasses).toContain('text-destructive-foreground')

    const outlineClasses = badgeVariants({ variant: 'outline' })
    expect(outlineClasses).toContain('text-foreground')
  })

  it('should include base classes in all variants', () => {
    const defaultClasses = badgeVariants()
    expect(defaultClasses).toContain('inline-flex')
    expect(defaultClasses).toContain('items-center')
    expect(defaultClasses).toContain('rounded-full')
    expect(defaultClasses).toContain('border')
    expect(defaultClasses).toContain('px-2.5')
    expect(defaultClasses).toContain('py-0.5')
    expect(defaultClasses).toContain('text-xs')
    expect(defaultClasses).toContain('font-semibold')
    expect(defaultClasses).toContain('transition-colors')
  })

  it('should include focus classes in all variants', () => {
    const defaultClasses = badgeVariants()
    expect(defaultClasses).toContain('focus:outline-none')
    expect(defaultClasses).toContain('focus:ring-2')
    expect(defaultClasses).toContain('focus:ring-ring')
    expect(defaultClasses).toContain('focus:ring-offset-2')
  })

  it('should combine variant and base classes correctly', () => {
    const secondaryClasses = badgeVariants({ variant: 'secondary' })
    expect(secondaryClasses).toContain('bg-secondary') // variant
    expect(secondaryClasses).toContain('inline-flex') // base
    expect(secondaryClasses).toContain('focus:ring-2') // focus
  })
})
