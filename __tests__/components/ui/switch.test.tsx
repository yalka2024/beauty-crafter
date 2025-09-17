import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'
import '@testing-library/jest-dom'

describe('Switch', () => {
  it('should render with default props', () => {
    render(<Switch data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).toHaveClass('peer', 'inline-flex', 'h-6', 'w-11')
  })

  it('should apply custom className', () => {
    render(<Switch className="custom-class" data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toHaveClass('custom-class')
    expect(switchElement).toHaveClass('peer', 'inline-flex')
  })

  it('should pass through additional props', () => {
    render(<Switch data-testid="switch" id="test-id" aria-label="Toggle Switch" />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toHaveAttribute('id', 'test-id')
    expect(switchElement).toHaveAttribute('aria-label', 'Toggle Switch')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Switch ref={ref} data-testid="switch" />)
    
    expect(ref.current).toBe(screen.getByTestId('switch'))
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Switch onClick={handleClick} data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    fireEvent.click(switchElement)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Switch disabled data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toBeDisabled()
    expect(switchElement).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('should have thumb element', () => {
    render(<Switch data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    // Look for any child element that might be the thumb
    const children = switchElement.children
    expect(children.length).toBeGreaterThan(0)
    // Check if any child has the expected classes
    const hasThumbWithClasses = Array.from(children).some(child => 
      child.classList.contains('h-5') && 
      child.classList.contains('w-5') && 
      child.classList.contains('rounded-full')
    )
    expect(hasThumbWithClasses).toBe(true)
  })

  it('should have correct default state classes', () => {
    render(<Switch data-testid="switch" />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input')
    expect(switchElement).toHaveClass('data-[state=checked]:bg-primary')
  })

  it('should handle checked state change', () => {
    render(<Switch data-testid="switch" defaultChecked />)
    
    const switchElement = screen.getByTestId('switch')
    expect(switchElement).toHaveAttribute('data-state', 'checked')
  })
})
