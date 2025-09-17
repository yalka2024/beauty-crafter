import React from 'react'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'
import '@testing-library/jest-dom'

describe('Label', () => {
  it('should render with default props', () => {
    render(<Label data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent('Label Text')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('should apply custom className', () => {
    render(<Label className="custom-class" data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('custom-class')
    expect(label).toHaveClass('text-sm', 'font-medium')
  })

  it('should pass through additional props', () => {
    render(<Label data-testid="label" id="test-id" htmlFor="input-field">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('id', 'test-id')
    // Check both htmlFor and for attributes since some browsers use different ones
    expect(label.getAttribute('htmlFor') || label.getAttribute('for')).toBe('input-field')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(<Label ref={ref} data-testid="label">Label Text</Label>)
    
    expect(ref.current).toBe(screen.getByTestId('label'))
  })

  it('should have peer disabled classes', () => {
    render(<Label data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
  })

  it('should have correct typography classes', () => {
    render(<Label data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('should render with htmlFor attribute', () => {
    render(<Label htmlFor="input-id" data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    // Check both htmlFor and for attributes
    expect(label.getAttribute('htmlFor') || label.getAttribute('for')).toBe('input-id')
  })

  it('should render with id attribute', () => {
    render(<Label id="label-id" data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('id', 'label-id')
  })

  it('should render with aria-label attribute', () => {
    render(<Label aria-label="Accessible Label" data-testid="label">Label Text</Label>)
    
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('aria-label', 'Accessible Label')
  })
})
