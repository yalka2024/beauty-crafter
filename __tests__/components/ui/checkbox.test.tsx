import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/ui/checkbox'
import '@testing-library/jest-dom'

describe('Checkbox', () => {
  it('should render with default props', () => {
    render(<Checkbox data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.tagName).toBe('BUTTON') // Radix UI renders as button
  })

  it('should apply custom className', () => {
    render(<Checkbox className="custom-class" data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveClass('custom-class')
    expect(checkbox).toHaveClass('peer', 'h-4', 'w-4', 'shrink-0')
  })

  it('should have correct base classes', () => {
    render(<Checkbox data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveClass(
      'peer',
      'h-4',
      'w-4',
      'shrink-0',
      'rounded-sm',
      'border',
      'border-primary',
      'ring-offset-background',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'data-[state=checked]:bg-primary',
      'data-[state=checked]:text-primary-foreground'
    )
  })

  it('should pass through additional props', () => {
    render(
      <Checkbox 
        data-testid="checkbox"
        id="test-checkbox"
        name="test-checkbox"
        value="test-value"
      />
    )
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('id', 'test-checkbox')
    expect(checkbox).toHaveAttribute('name', 'test-checkbox')
    expect(checkbox).toHaveAttribute('value', 'test-value')
  })

  it('should handle checked state', () => {
    render(<Checkbox checked data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('should handle defaultChecked state', () => {
    render(<Checkbox defaultChecked data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('data-state', 'checked')
  })

  it('should handle disabled state', () => {
    render(<Checkbox disabled data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('should handle required state', () => {
    render(<Checkbox required data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('aria-required', 'true')
  })

  it('should handle aria attributes', () => {
    render(
      <Checkbox 
        data-testid="checkbox"
        aria-label="Test checkbox"
        aria-describedby="checkbox-help"
        aria-invalid="false"
      />
    )
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('aria-label', 'Test checkbox')
    expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox-help')
    expect(checkbox).toHaveAttribute('aria-invalid', 'false')
  })

  it('should handle data attributes', () => {
    render(
      <Checkbox 
        data-testid="checkbox"
        data-cy="test-checkbox"
        data-test="checkbox-component"
      />
    )
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('data-cy', 'test-checkbox')
    expect(checkbox).toHaveAttribute('data-test', 'checkbox-component')
  })

  it('should handle style attributes', () => {
    render(
      <Checkbox 
        data-testid="checkbox"
        style={{ width: '20px', height: '20px' }}
      />
    )
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox.style.width).toBe('20px')
    expect(checkbox.style.height).toBe('20px')
  })

  it('should handle ref forwarding', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Checkbox ref={ref} data-testid="checkbox" />)
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    expect(ref.current).toBe(screen.getByTestId('checkbox'))
  })

  it('should combine custom classes with base classes correctly', () => {
    render(
      <Checkbox 
        className="w-6 h-6 custom-checkbox" 
        data-testid="checkbox"
      />
    )
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveClass('w-6', 'h-6', 'custom-checkbox') // custom classes
    expect(checkbox).toHaveClass('peer', 'h-4', 'w-4', 'shrink-0') // base classes
  })

  it('should render indicator when checked', () => {
    render(<Checkbox checked data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    const indicator = checkbox.querySelector('[data-radix-collection-item]')
    expect(indicator).toBeInTheDocument()
  })

  it('should not render indicator when unchecked', () => {
    render(<Checkbox data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    const indicator = checkbox.querySelector('[data-radix-collection-item]')
    expect(indicator).not.toBeInTheDocument()
  })

  it('should handle form attribute', () => {
    render(<Checkbox form="test-form" data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('form', 'test-form')
  })

  it('should handle tabIndex attribute', () => {
    render(<Checkbox tabIndex={0} data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('tabIndex', '0')
  })

  it('should handle role attribute', () => {
    render(<Checkbox role="checkbox" data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('role', 'checkbox')
  })

  it('should handle type attribute', () => {
    render(<Checkbox type="button" data-testid="checkbox" />)
    
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).toHaveAttribute('type', 'button')
  })
})
