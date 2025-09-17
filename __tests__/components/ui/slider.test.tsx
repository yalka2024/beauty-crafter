import React from 'react'
import { render, screen } from '@testing-library/react'
import { Slider } from '@/components/ui/slider'
import '@testing-library/jest-dom'

describe('Slider', () => {
  it('should render with default props', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveClass('relative', 'flex', 'w-full', 'touch-none', 'select-none', 'items-center')
  })

  it('should apply custom className', () => {
    render(<Slider className="custom-class" data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    expect(slider).toHaveClass('custom-class')
    expect(slider).toHaveClass('relative', 'flex', 'w-full')
  })

  it('should pass through additional props', () => {
    render(<Slider data-testid="slider" id="test-id" aria-label="Slider Control" />)
    
    const slider = screen.getByTestId('slider')
    expect(slider).toHaveAttribute('id', 'test-id')
    expect(slider).toHaveAttribute('aria-label', 'Slider Control')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLSpanElement>()
    render(<Slider ref={ref} data-testid="slider" />)
    
    expect(ref.current).toBe(screen.getByTestId('slider'))
  })

  it('should have track element', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const track = slider.querySelector('[data-radix-slider-track]')
    expect(track).toBeInTheDocument()
    expect(track).toHaveClass('relative', 'h-2', 'w-full', 'grow', 'overflow-hidden', 'rounded-full', 'bg-secondary')
  })

  it('should have range element', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const range = slider.querySelector('[data-radix-slider-range]')
    expect(range).toBeInTheDocument()
    expect(range).toHaveClass('absolute', 'h-full', 'bg-primary')
  })

  it('should have thumb element', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const thumb = slider.querySelector('[data-radix-slider-thumb]')
    expect(thumb).toBeInTheDocument()
    expect(thumb).toHaveClass('block', 'h-5', 'w-5', 'rounded-full', 'border-2', 'border-primary', 'bg-background')
  })

  it('should have disabled state classes when disabled', () => {
    render(<Slider disabled data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const thumb = slider.querySelector('[data-radix-slider-thumb]')
    expect(thumb).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })

  it('should have focus visible classes', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const thumb = slider.querySelector('[data-radix-slider-thumb]')
    expect(thumb).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2')
  })

  it('should have transition classes', () => {
    render(<Slider data-testid="slider" />)
    
    const slider = screen.getByTestId('slider')
    const thumb = slider.querySelector('[data-radix-slider-thumb]')
    expect(thumb).toHaveClass('transition-colors')
  })
})
