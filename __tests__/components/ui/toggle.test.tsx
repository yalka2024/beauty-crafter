import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle, toggleVariants } from '@/components/ui/toggle'
import '@testing-library/jest-dom'

describe('Toggle', () => {
  it('should render with default props', () => {
    render(<Toggle data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toBeInTheDocument()
    expect(toggle).toHaveTextContent('Toggle')
    expect(toggle).toHaveClass('bg-transparent', 'h-10', 'px-3', 'min-w-10')
  })

  it('should apply variant classes correctly', () => {
    render(<Toggle variant="outline" data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toHaveClass('border', 'border-input', 'bg-transparent')
  })

  it('should apply size classes correctly', () => {
    render(<Toggle size="sm" data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toHaveClass('h-9', 'px-2.5', 'min-w-9')
  })

  it('should apply custom className', () => {
    render(<Toggle className="custom-class" data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toHaveClass('custom-class')
  })

  it('should pass through additional props', () => {
    render(<Toggle data-testid="toggle" id="test-id" aria-label="Toggle Button">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toHaveAttribute('id', 'test-id')
    expect(toggle).toHaveAttribute('aria-label', 'Toggle Button')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Toggle ref={ref} data-testid="toggle">Toggle</Toggle>)
    
    expect(ref.current).toBe(screen.getByTestId('toggle'))
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Toggle onClick={handleClick} data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    fireEvent.click(toggle)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Toggle disabled data-testid="toggle">Toggle</Toggle>)
    
    const toggle = screen.getByTestId('toggle')
    expect(toggle).toBeDisabled()
    expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })
})

describe('toggleVariants', () => {
  it('should return default classes when no variants specified', () => {
    const classes = toggleVariants({})
    expect(classes).toContain('bg-transparent')
    expect(classes).toContain('h-10')
    expect(classes).toContain('px-3')
  })

  it('should return outline variant classes', () => {
    const classes = toggleVariants({ variant: 'outline' })
    expect(classes).toContain('border')
    expect(classes).toContain('border-input')
    expect(classes).toContain('bg-transparent')
  })

  it('should return small size classes', () => {
    const classes = toggleVariants({ size: 'sm' })
    expect(classes).toContain('h-9')
    expect(classes).toContain('px-2.5')
    expect(classes).toContain('min-w-9')
  })

  it('should return large size classes', () => {
    const classes = toggleVariants({ size: 'lg' })
    expect(classes).toContain('h-11')
    expect(classes).toContain('px-5')
    expect(classes).toContain('min-w-11')
  })

  it('should combine multiple variants', () => {
    const classes = toggleVariants({ variant: 'outline', size: 'sm' })
    expect(classes).toContain('border')
    expect(classes).toContain('h-9')
    expect(classes).toContain('px-2.5')
  })
})
