import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Skeleton } from '@/components/ui/skeleton'
import '@testing-library/jest-dom'

describe('Skeleton', () => {
  it('should render with default props', () => {
    render(<Skeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('custom-class')
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted')
  })

  it('should have correct base classes', () => {
    render(<Skeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted')
  })

  it('should pass through additional props', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        id="test-skeleton"
        role="presentation"
        aria-label="Loading skeleton"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('id', 'test-skeleton')
    expect(skeleton).toHaveAttribute('role', 'presentation')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading skeleton')
  })

  it('should handle aria attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        aria-describedby="skeleton-help"
        aria-hidden="true"
        aria-live="polite"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('aria-describedby', 'skeleton-help')
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton).toHaveAttribute('aria-live', 'polite')
  })

  it('should handle data attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        data-cy="loading-skeleton"
        data-test="skeleton-component"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('data-cy', 'loading-skeleton')
    expect(skeleton).toHaveAttribute('data-test', 'skeleton-component')
  })

  it('should handle style attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        style={{ width: '200px', height: '100px' }}
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton.style.width).toBe('200px')
    expect(skeleton.style.height).toBe('100px')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Skeleton onClick={handleClick} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    skeleton.click()
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should handle keyboard events', () => {
    const handleKeyDown = jest.fn()
    render(<Skeleton onKeyDown={handleKeyDown} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    fireEvent.keyDown(skeleton, { key: 'Enter' })
    
    expect(handleKeyDown).toHaveBeenCalled()
  })

  it('should handle focus events', () => {
    const handleFocus = jest.fn()
    render(<Skeleton onFocus={handleFocus} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    fireEvent.focus(skeleton)
    
    expect(handleFocus).toHaveBeenCalled()
  })

  it('should handle blur events', () => {
    const handleBlur = jest.fn()
    render(<Skeleton onBlur={handleBlur} data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    fireEvent.focus(skeleton)
    fireEvent.blur(skeleton)
    
    expect(handleBlur).toHaveBeenCalled()
  })

  it('should handle mouse events', () => {
    const handleMouseEnter = jest.fn()
    const handleMouseLeave = jest.fn()
    
    render(
      <Skeleton 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid="skeleton"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    fireEvent.mouseEnter(skeleton)
    fireEvent.mouseLeave(skeleton)
    
    expect(handleMouseEnter).toHaveBeenCalled()
    expect(handleMouseLeave).toHaveBeenCalled()
  })

  it('should handle form attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        form="test-form"
        name="test-skeleton"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('form', 'test-form')
    expect(skeleton).toHaveAttribute('name', 'test-skeleton')
  })

  it('should handle accessibility attributes', () => {
    render(
      <Skeleton 
        data-testid="skeleton"
        tabIndex={0}
        aria-label="Loading indicator"
        aria-describedby="skeleton-description"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveAttribute('tabIndex', '0')
    expect(skeleton).toHaveAttribute('aria-label', 'Loading indicator')
    expect(skeleton).toHaveAttribute('aria-describedby', 'skeleton-description')
  })

  it('should combine custom classes with base classes correctly', () => {
    render(
      <Skeleton 
        className="w-32 h-8 custom-skeleton" 
        data-testid="skeleton"
      />
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveClass('w-32', 'h-8', 'custom-skeleton') // custom classes
    expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-muted') // base classes
  })

  it('should handle empty content', () => {
    render(<Skeleton data-testid="skeleton" />)
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveTextContent('')
  })

  it('should handle children content', () => {
    render(
      <Skeleton data-testid="skeleton">
        <span>Loading...</span>
      </Skeleton>
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveTextContent('Loading...')
  })

  it('should handle multiple children', () => {
    render(
      <Skeleton data-testid="skeleton">
        <div>Loading</div>
        <div>Please wait</div>
      </Skeleton>
    )
    
    const skeleton = screen.getByTestId('skeleton')
    expect(skeleton).toHaveTextContent('Loading')
    expect(skeleton).toHaveTextContent('Please wait')
  })
})
