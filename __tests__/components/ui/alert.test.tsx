import React from 'react'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import '@testing-library/jest-dom'

describe('Alert', () => {
  it('should render with default props', () => {
    render(<Alert data-testid="alert">Alert content</Alert>)
    
    const alert = screen.getByTestId('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Alert content')
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4')
    expect(alert).toHaveAttribute('role', 'alert')
  })

  it('should apply custom className', () => {
    render(<Alert className="custom-class" data-testid="alert">Alert content</Alert>)
    
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveClass('custom-class')
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg')
  })

  it('should render with default variant', () => {
    render(<Alert data-testid="alert">Alert content</Alert>)
    
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveClass('bg-background', 'text-foreground')
  })

  it('should render with destructive variant', () => {
    render(<Alert variant="destructive" data-testid="alert">Destructive alert</Alert>)
    
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
  })

  it('should pass through additional props', () => {
    render(<Alert data-testid="alert" id="test-id" aria-label="Test Alert">Alert content</Alert>)
    
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveAttribute('id', 'test-id')
    expect(alert).toHaveAttribute('aria-label', 'Test Alert')
  })
})

describe('AlertTitle', () => {
  it('should render with default props', () => {
    render(<AlertTitle data-testid="alert-title">Alert Title</AlertTitle>)
    
    const title = screen.getByTestId('alert-title')
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Alert Title')
    expect(title.tagName).toBe('H5')
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
  })

  it('should apply custom className', () => {
    render(<AlertTitle className="custom-title" data-testid="alert-title">Alert Title</AlertTitle>)
    
    const title = screen.getByTestId('alert-title')
    expect(title).toHaveClass('custom-title')
    expect(title).toHaveClass('mb-1', 'font-medium')
  })

  it('should pass through additional props', () => {
    render(<AlertTitle data-testid="alert-title" id="title-id" aria-label="Test Title">Alert Title</AlertTitle>)
    
    const title = screen.getByTestId('alert-title')
    expect(title).toHaveAttribute('id', 'title-id')
    expect(title).toHaveAttribute('aria-label', 'Test Title')
  })
})

describe('AlertDescription', () => {
  it('should render with default props', () => {
    render(<AlertDescription data-testid="alert-description">Alert description text</AlertDescription>)
    
    const description = screen.getByTestId('alert-description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveTextContent('Alert description text')
    expect(description.tagName).toBe('DIV')
    expect(description).toHaveClass('text-sm')
  })

  it('should apply custom className', () => {
    render(<AlertDescription className="custom-description" data-testid="alert-description">Alert description</AlertDescription>)
    
    const description = screen.getByTestId('alert-description')
    expect(description).toHaveClass('custom-description')
    expect(description).toHaveClass('text-sm')
  })

  it('should pass through additional props', () => {
    render(<AlertDescription data-testid="alert-description" id="desc-id" aria-label="Test Description">Alert description</AlertDescription>)
    
    const description = screen.getByTestId('alert-description')
    expect(description).toHaveAttribute('id', 'desc-id')
    expect(description).toHaveAttribute('aria-label', 'Test Description')
  })
})

describe('Alert composition', () => {
  it('should render complete alert with title and description', () => {
    render(
      <Alert data-testid="alert">
        <AlertTitle data-testid="alert-title">Important Notice</AlertTitle>
        <AlertDescription data-testid="alert-description">
          This is an important message that requires your attention.
        </AlertDescription>
      </Alert>
    )
    
    const alert = screen.getByTestId('alert')
    const title = screen.getByTestId('alert-title')
    const description = screen.getByTestId('alert-description')
    
    expect(alert).toBeInTheDocument()
    expect(title).toBeInTheDocument()
    expect(description).toBeInTheDocument()
    
    expect(alert).toContainElement(title)
    expect(alert).toContainElement(description)
  })

  it('should render destructive alert with title and description', () => {
    render(
      <Alert variant="destructive" data-testid="alert">
        <AlertTitle data-testid="alert-title">Error Occurred</AlertTitle>
        <AlertDescription data-testid="alert-description">
          Something went wrong. Please try again.
        </AlertDescription>
      </Alert>
    )
    
    const alert = screen.getByTestId('alert')
    expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
    
    const title = screen.getByTestId('alert-title')
    const description = screen.getByTestId('alert-description')
    
    expect(title).toHaveTextContent('Error Occurred')
    expect(description).toHaveTextContent('Something went wrong. Please try again.')
  })
})
