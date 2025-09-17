import React from 'react'
import { render, screen } from '@testing-library/react'
import { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card'
import '@testing-library/jest-dom'

describe('Card', () => {
  it('should render with default props', () => {
    render(<Card data-testid="card">Card content</Card>)
    
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveTextContent('Card content')
    expect(card.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<Card className="custom-class" data-testid="card">Card content</Card>)
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Card ref={ref} data-testid="card">Card content</Card>)
    
    expect(ref.current).toBe(screen.getByTestId('card'))
  })

  it('should have correct base classes', () => {
    render(<Card data-testid="card">Card content</Card>)
    
    const card = screen.getByTestId('card')
    expect(card).toHaveClass(
      'rounded-lg',
      'border',
      'bg-card',
      'text-card-foreground',
      'shadow-sm'
    )
  })

  it('should pass through additional props', () => {
    render(
      <Card 
        data-testid="card"
        id="test-card"
        role="article"
        aria-label="Test card"
      >
        Card content
      </Card>
    )
    
    const card = screen.getByTestId('card')
    expect(card).toHaveAttribute('id', 'test-card')
    expect(card).toHaveAttribute('role', 'article')
    expect(card).toHaveAttribute('aria-label', 'Test card')
  })
})

describe('CardHeader', () => {
  it('should render with default props', () => {
    render(<CardHeader data-testid="header">Header content</CardHeader>)
    
    const header = screen.getByTestId('header')
    expect(header).toBeInTheDocument()
    expect(header).toHaveTextContent('Header content')
    expect(header.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<CardHeader className="custom-header" data-testid="header">Header content</CardHeader>)
    
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardHeader ref={ref} data-testid="header">Header content</CardHeader>)
    
    expect(ref.current).toBe(screen.getByTestId('header'))
  })

  it('should have correct base classes', () => {
    render(<CardHeader data-testid="header">Header content</CardHeader>)
    
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })
})

describe('CardTitle', () => {
  it('should render with default props', () => {
    render(<CardTitle data-testid="title">Card Title</CardTitle>)
    
    const title = screen.getByTestId('title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Card Title')
    expect(title.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<CardTitle className="custom-title" data-testid="title">Card Title</CardTitle>)
    
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('custom-title')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardTitle ref={ref} data-testid="title">Card Title</CardTitle>)
    
    expect(ref.current).toBe(screen.getByTestId('title'))
  })

  it('should have correct base classes', () => {
    render(<CardTitle data-testid="title">Card Title</CardTitle>)
    
    const title = screen.getByTestId('title')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })
})

describe('CardDescription', () => {
  it('should render with default props', () => {
    render(<CardDescription data-testid="description">Card description</CardDescription>)
    
    const description = screen.getByTestId('description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveTextContent('Card description')
    expect(description.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<CardDescription className="custom-desc" data-testid="description">Card description</CardDescription>)
    
    const description = screen.getByTestId('description')
    expect(description).toHaveClass('custom-desc')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardDescription ref={ref} data-testid="description">Card description</CardDescription>)
    
    expect(ref.current).toBe(screen.getByTestId('description'))
  })

  it('should have correct base classes', () => {
    render(<CardDescription data-testid="description">Card description</CardDescription>)
    
    const description = screen.getByTestId('description')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })
})

describe('CardContent', () => {
  it('should render with default props', () => {
    render(<CardContent data-testid="content">Card content</CardContent>)
    
    const content = screen.getByTestId('content')
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent('Card content')
    expect(content.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<CardContent className="custom-content" data-testid="content">Card content</CardContent>)
    
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('custom-content')
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardContent ref={ref} data-testid="content">Card content</CardContent>)
    
    expect(ref.current).toBe(screen.getByTestId('content'))
  })

  it('should have correct base classes', () => {
    render(<CardContent data-testid="content">Card content</CardContent>)
    
    const content = screen.getByTestId('content')
    expect(content).toHaveClass('p-6', 'pt-0')
  })
})

describe('CardFooter', () => {
  it('should render with default props', () => {
    render(<CardFooter data-testid="footer">Footer content</CardFooter>)
    
    const footer = screen.getByTestId('footer')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveTextContent('Footer content')
    expect(footer.tagName).toBe('DIV')
  })

  it('should apply custom className', () => {
    render(<CardFooter className="custom-footer" data-testid="footer">Footer content</CardFooter>)
    
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('custom-footer')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<CardFooter ref={ref} data-testid="footer">Footer content</CardFooter>)
    
    expect(ref.current).toBe(screen.getByTestId('footer'))
  })

  it('should have correct base classes', () => {
    render(<CardFooter data-testid="footer">Footer content</CardFooter>)
    
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })
})

describe('Card Composition', () => {
  it('should render a complete card with all components', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Card Title</CardTitle>
          <CardDescription data-testid="description">Card description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">Main content goes here</CardContent>
        <CardFooter data-testid="footer">Footer actions</CardFooter>
      </Card>
    )
    
    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('title')).toBeInTheDocument()
    expect(screen.getByTestId('description')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    
    expect(screen.getByTestId('title')).toHaveTextContent('Card Title')
    expect(screen.getByTestId('description')).toHaveTextContent('Card description')
    expect(screen.getByTestId('content')).toHaveTextContent('Main content goes here')
    expect(screen.getByTestId('footer')).toHaveTextContent('Footer actions')
  })

  it('should handle nested content correctly', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle data-testid="title">Nested Card</CardTitle>
        </CardHeader>
        <CardContent data-testid="content">
          <div data-testid="nested-content">Nested div content</div>
        </CardContent>
      </Card>
    )
    
    expect(screen.getByTestId('nested-content')).toBeInTheDocument()
    expect(screen.getByTestId('nested-content')).toHaveTextContent('Nested div content')
  })

  it('should handle multiple children in footer', () => {
    render(
      <Card data-testid="card">
        <CardFooter data-testid="footer">
          <button data-testid="btn1">Cancel</button>
          <button data-testid="btn2">Save</button>
        </CardFooter>
      </Card>
    )
    
    expect(screen.getByTestId('btn1')).toBeInTheDocument()
    expect(screen.getByTestId('btn2')).toBeInTheDocument()
    expect(screen.getByTestId('btn1')).toHaveTextContent('Cancel')
    expect(screen.getByTestId('btn2')).toHaveTextContent('Save')
  })
})
