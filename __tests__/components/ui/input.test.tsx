import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'
import '@testing-library/jest-dom'

describe('Input', () => {
  it('should render with default props', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
    // HTML input elements don't have a default type attribute when not specified
    expect(input).not.toHaveAttribute('type')
  })

  it('should apply custom className', () => {
    render(<Input className="custom-class" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
    expect(input).toHaveClass('flex', 'h-10', 'w-full')
  })

  it('should render with different types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />)
    
    let input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'password')

    rerender(<Input type="number" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'number')

    rerender(<Input type="search" data-testid="input" />)
    input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'search')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} data-testid="input" />)
    
    expect(ref.current).toBe(screen.getByTestId('input'))
  })

  it('should pass through additional props', () => {
    render(
      <Input 
        data-testid="input"
        id="test-input"
        name="test-name"
        placeholder="Enter text"
        value="test value"
        disabled
        required
        maxLength={50}
      />
    )
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('id', 'test-input')
    expect(input).toHaveAttribute('name', 'test-name')
    expect(input).toHaveAttribute('placeholder', 'Enter text')
    expect(input).toHaveAttribute('value', 'test value')
    expect(input).toBeDisabled()
    expect(input).toBeRequired()
    expect(input).toHaveAttribute('maxLength', '50')
  })

  it('should have correct base classes', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-base'
    )
  })

  it('should have focus and disabled states', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50'
    )
  })

  it('should have file input styling', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass(
      'file:border-0',
      'file:bg-transparent',
      'file:text-sm',
      'file:font-medium',
      'file:text-foreground'
    )
  })

  it('should have placeholder styling', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('placeholder:text-muted-foreground')
  })

  it('should have responsive text sizing', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('text-base', 'md:text-sm')
  })

  it('should handle onChange events', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} data-testid="input" />)
    
    const input = screen.getByTestId('input') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'new value' } })
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should handle onFocus events', () => {
    const handleFocus = jest.fn()
    render(<Input onFocus={handleFocus} data-testid="input" />)
    
    const input = screen.getByTestId('input')
    input.focus()
    
    expect(handleFocus).toHaveBeenCalled()
  })

  it('should handle onBlur events', () => {
    const handleBlur = jest.fn()
    render(<Input onBlur={handleBlur} data-testid="input" />)
    
    const input = screen.getByTestId('input')
    input.focus()
    input.blur()
    
    expect(handleBlur).toHaveBeenCalled()
  })

  it('should handle onKeyDown events', () => {
    const handleKeyDown = jest.fn()
    render(<Input onKeyDown={handleKeyDown} data-testid="input" />)
    
    const input = screen.getByTestId('input') as HTMLInputElement
    fireEvent.keyDown(input, { key: 'Enter' })
    
    expect(handleKeyDown).toHaveBeenCalled()
  })

  it('should handle aria attributes', () => {
    render(
      <Input 
        data-testid="input"
        aria-label="Search input"
        aria-describedby="search-help"
        aria-invalid="false"
      />
    )
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('aria-label', 'Search input')
    expect(input).toHaveAttribute('aria-describedby', 'search-help')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('should handle data attributes', () => {
    render(
      <Input 
        data-testid="input"
        data-cy="search-input"
        data-test="search-field"
      />
    )
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('data-cy', 'search-input')
    expect(input).toHaveAttribute('data-test', 'search-field')
  })

  it('should handle form attributes', () => {
    render(
      <Input 
        data-testid="input"
        form="test-form"
        formAction="/submit"
        formMethod="post"
        formTarget="_blank"
      />
    )
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('form', 'test-form')
    expect(input).toHaveAttribute('formAction', '/submit')
    expect(input).toHaveAttribute('formMethod', 'post')
    expect(input).toHaveAttribute('formTarget', '_blank')
  })
})
