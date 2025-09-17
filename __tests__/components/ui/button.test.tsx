import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '@/components/ui/button'
import '@testing-library/jest-dom'

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button data-testid="button">Click me</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    expect(button.tagName).toBe('BUTTON')
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class" data-testid="button">Button</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toHaveClass('custom-class')
    expect(button).toHaveClass('bg-primary')
  })

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="destructive" data-testid="button">Destructive</Button>)
    
    let button = screen.getByTestId('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')

    rerender(<Button variant="outline" data-testid="button">Outline</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background')

    rerender(<Button variant="secondary" data-testid="button">Secondary</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground')

    rerender(<Button variant="ghost" data-testid="button">Ghost</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground')

    rerender(<Button variant="link" data-testid="button">Link</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('text-primary', 'underline-offset-4')
  })

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="sm" data-testid="button">Small</Button>)
    
    let button = screen.getByTestId('button')
    expect(button).toHaveClass('h-9', 'rounded-md', 'px-3')

    rerender(<Button size="lg" data-testid="button">Large</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8')

    rerender(<Button size="icon" data-testid="button">Icon</Button>)
    button = screen.getByTestId('button')
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('should render as child when asChild is true', () => {
    render(
      <Button asChild data-testid="button">
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const button = screen.getByTestId('button')
    expect(button.tagName).toBe('A')
    expect(button).toHaveAttribute('href', '/test')
    expect(button).toHaveTextContent('Link Button')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Button ref={ref} data-testid="button">Button</Button>)
    
    expect(ref.current).toBe(screen.getByTestId('button'))
  })

  it('should pass through additional props', () => {
    render(
      <Button 
        data-testid="button"
        id="test-button"
        disabled
        type="submit"
        onClick={() => {}}
      >
        Submit
      </Button>
    )
    
    const button = screen.getByTestId('button')
    expect(button).toHaveAttribute('id', 'test-button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('type', 'submit')
  })

  it('should have correct base classes', () => {
    render(<Button data-testid="button">Button</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toHaveClass(
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'whitespace-nowrap',
      'rounded-md',
      'text-sm',
      'font-medium'
    )
  })

  it('should have focus and disabled states', () => {
    render(<Button data-testid="button">Button</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'disabled:pointer-events-none',
      'disabled:opacity-50'
    )
  })

  it('should have SVG styling classes', () => {
    render(<Button data-testid="button">Button</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toHaveClass(
      '[&_svg]:pointer-events-none',
      '[&_svg]:size-4',
      '[&_svg]:shrink-0'
    )
  })

  it('should combine variant and size classes correctly', () => {
    render(
      <Button 
        variant="outline" 
        size="lg" 
        data-testid="button"
      >
        Large Outline
      </Button>
    )
    
    const button = screen.getByTestId('button')
    expect(button).toHaveClass('border', 'border-input', 'bg-background') // variant
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8') // size
  })

  it('should handle disabled state correctly', () => {
    render(<Button disabled data-testid="button">Disabled</Button>)
    
    const button = screen.getByTestId('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
  })
})

describe('buttonVariants', () => {
  it('should generate correct class names for different variants', () => {
    const defaultClasses = buttonVariants()
    expect(defaultClasses).toContain('bg-primary')
    expect(defaultClasses).toContain('text-primary-foreground')

    const destructiveClasses = buttonVariants({ variant: 'destructive' })
    expect(destructiveClasses).toContain('bg-destructive')
    expect(destructiveClasses).toContain('text-destructive-foreground')

    const outlineClasses = buttonVariants({ variant: 'outline' })
    expect(outlineClasses).toContain('border')
    expect(outlineClasses).toContain('border-input')
  })

  it('should generate correct class names for different sizes', () => {
    const defaultSizeClasses = buttonVariants({ size: 'default' })
    expect(defaultSizeClasses).toContain('h-10')
    expect(defaultSizeClasses).toContain('px-4')
    expect(defaultSizeClasses).toContain('py-2')

    const smallSizeClasses = buttonVariants({ size: 'sm' })
    expect(smallSizeClasses).toContain('h-9')
    expect(smallSizeClasses).toContain('px-3')

    const largeSizeClasses = buttonVariants({ size: 'lg' })
    expect(largeSizeClasses).toContain('h-11')
    expect(largeSizeClasses).toContain('px-8')

    const iconSizeClasses = buttonVariants({ size: 'icon' })
    expect(iconSizeClasses).toContain('h-10')
    expect(iconSizeClasses).toContain('w-10')
  })

  it('should combine variant and size classes', () => {
    const combinedClasses = buttonVariants({ variant: 'secondary', size: 'lg' })
    expect(combinedClasses).toContain('bg-secondary')
    expect(combinedClasses).toContain('text-secondary-foreground')
    expect(combinedClasses).toContain('h-11')
    expect(combinedClasses).toContain('px-8')
  })
})
