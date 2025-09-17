import React from 'react'
import { render, screen } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'
import '@testing-library/jest-dom'

describe('Separator', () => {
  it('should render with default props', () => {
    render(<Separator data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toBeInTheDocument()
    expect(separator.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<Separator className="custom-class" data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('custom-class')
    expect(separator).toHaveClass('shrink-0', 'bg-border')
  })

  it('should render with horizontal orientation by default', () => {
    render(<Separator data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('h-[1px]', 'w-full')
  })

  it('should render with vertical orientation', () => {
    render(<Separator orientation="vertical" data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('h-full', 'w-[1px]')
  })

  it('should have correct base classes', () => {
    render(<Separator data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('shrink-0', 'bg-border')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Separator ref={ref} data-testid="separator" />)
    
    expect(ref.current).toBe(screen.getByTestId('separator'))
  })

  it('should pass through additional props', () => {
    render(
      <Separator 
        data-testid="separator"
        id="test-separator"
        role="separator"
        aria-label="Content separator"
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('id', 'test-separator')
    expect(separator).toHaveAttribute('role', 'separator')
    expect(separator).toHaveAttribute('aria-label', 'Content separator')
  })

  it('should combine orientation and custom classes correctly', () => {
    render(
      <Separator 
        orientation="vertical" 
        className="custom-margin" 
        data-testid="separator"
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveClass('custom-margin')
    expect(separator).toHaveClass('h-full', 'w-[1px]')
    expect(separator).toHaveClass('shrink-0', 'bg-border')
  })

  it('should handle aria attributes', () => {
    render(
      <Separator 
        data-testid="separator"
        aria-describedby="separator-help"
        aria-hidden="true"
        aria-orientation="vertical"
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('aria-describedby', 'separator-help')
    expect(separator).toHaveAttribute('aria-hidden', 'true')
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('should handle data attributes', () => {
    render(
      <Separator 
        data-testid="separator"
        data-cy="content-separator"
        data-test="separator-component"
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('data-cy', 'content-separator')
    expect(separator).toHaveAttribute('data-test', 'separator-component')
  })

  it('should handle style attributes', () => {
    render(
      <Separator 
        data-testid="separator"
        style={{ margin: '20px 0' }}
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator.style.margin).toBe('20px 0px')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Separator onClick={handleClick} data-testid="separator" />)
    
    const separator = screen.getByTestId('separator')
    separator.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle accessibility attributes', () => {
    render(
      <Separator 
        data-testid="separator"
        tabIndex={0}
        aria-label="Section separator"
        aria-describedby="separator-description"
      />
    )
    
    const separator = screen.getByTestId('separator')
    expect(separator).toHaveAttribute('tabIndex', '0')
    expect(separator).toHaveAttribute('aria-label', 'Section separator')
    expect(separator).toHaveAttribute('aria-describedby', 'separator-description')
  })
})
