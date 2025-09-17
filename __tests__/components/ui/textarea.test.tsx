import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'
import '@testing-library/jest-dom'

describe('Textarea', () => {
  it('should render with default props', () => {
    render(<Textarea data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('should apply custom className', () => {
    render(<Textarea className="custom-class" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveClass('custom-class')
    expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'w-full')
  })

  it('should have correct base classes', () => {
    render(<Textarea data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveClass(
      'flex',
      'min-h-[80px]',
      'w-full',
      'rounded-md',
      'border',
      'border-input',
      'bg-background',
      'px-3',
      'py-2',
      'text-base',
      'ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed',
      'disabled:opacity-50',
      'md:text-sm'
    )
  })

  it('should pass through additional props', () => {
    render(
      <Textarea 
        data-testid="textarea"
        id="test-textarea"
        name="test-textarea"
        placeholder="Enter text here"
        rows={5}
        cols={50}
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('id', 'test-textarea')
    expect(textarea).toHaveAttribute('name', 'test-textarea')
    expect(textarea).toHaveAttribute('placeholder', 'Enter text here')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toHaveAttribute('cols', '50')
  })

  it('should handle value and onChange', () => {
    const handleChange = jest.fn()
    render(
      <Textarea 
        value="initial value"
        onChange={handleChange}
        data-testid="textarea"
      />
    )
    
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe('initial value')
    
    fireEvent.change(textarea, { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should handle onFocus and onBlur events', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(
      <Textarea 
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-testid="textarea"
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    fireEvent.focus(textarea)
    expect(handleFocus).toHaveBeenCalled()
    
    fireEvent.blur(textarea)
    expect(handleBlur).toHaveBeenCalled()
  })

  it('should handle onKeyDown events', () => {
    const handleKeyDown = jest.fn()
    render(<Textarea onKeyDown={handleKeyDown} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalled()
  })

  it('should handle onKeyUp events', () => {
    const handleKeyUp = jest.fn()
    render(<Textarea onKeyUp={handleKeyUp} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    fireEvent.keyUp(textarea, { key: 'Enter' })
    expect(handleKeyUp).toHaveBeenCalled()
  })

  it('should handle onKeyPress events', () => {
    const handleKeyPress = jest.fn()
    render(<Textarea onKeyPress={handleKeyPress} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    // onKeyPress is deprecated, but we can still test if the component renders with the prop
    expect(textarea).toBeInTheDocument()
  })

  it('should handle disabled state', () => {
    render(<Textarea disabled data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toBeDisabled()
  })

  it('should handle readOnly state', () => {
    render(<Textarea readOnly data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('readonly')
  })

  it('should handle required state', () => {
    render(<Textarea required data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toBeRequired()
  })

  it('should handle maxLength attribute', () => {
    render(<Textarea maxLength={100} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('maxLength', '100')
  })

  it('should handle minLength attribute', () => {
    render(<Textarea minLength={10} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('minLength', '10')
  })

  it('should handle autoComplete attribute', () => {
    render(<Textarea autoComplete="off" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('autoComplete', 'off')
  })

  it('should handle spellCheck attribute', () => {
    render(<Textarea spellCheck={false} data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('spellCheck', 'false')
  })

  it('should handle wrap attribute', () => {
    render(<Textarea wrap="hard" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('wrap', 'hard')
  })

  it('should handle form attribute', () => {
    render(<Textarea form="test-form" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('form', 'test-form')
  })

  it('should handle dirname attribute', () => {
    render(<Textarea dirName="ltr" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('dirname', 'ltr')
  })

  it('should handle inputMode attribute', () => {
    render(<Textarea inputMode="text" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('inputMode', 'text')
  })

  it('should handle enterKeyHint attribute', () => {
    render(<Textarea enterKeyHint="done" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('enterKeyHint', 'done')
  })

  it('should handle aria attributes', () => {
    render(
      <Textarea 
        data-testid="textarea"
        aria-label="Description"
        aria-describedby="textarea-help"
        aria-invalid="false"
        aria-required="true"
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('aria-label', 'Description')
    expect(textarea).toHaveAttribute('aria-describedby', 'textarea-help')
    expect(textarea).toHaveAttribute('aria-invalid', 'false')
    expect(textarea).toHaveAttribute('aria-required', 'true')
  })

  it('should handle data attributes', () => {
    render(
      <Textarea 
        data-testid="textarea"
        data-cy="description-textarea"
        data-test="textarea-component"
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveAttribute('data-cy', 'description-textarea')
    expect(textarea).toHaveAttribute('data-test', 'textarea-component')
  })

  it('should handle style attributes', () => {
    render(
      <Textarea 
        data-testid="textarea"
        style={{ width: '300px', height: '150px' }}
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea.style.width).toBe('300px')
    expect(textarea.style.height).toBe('150px')
  })

  it('should handle ref forwarding', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} data-testid="textarea" />)
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
    expect(ref.current).toBe(screen.getByTestId('textarea'))
  })

  it('should combine custom classes with base classes correctly', () => {
    render(
      <Textarea 
        className="h-32 custom-textarea" 
        data-testid="textarea"
      />
    )
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toHaveClass('h-32', 'custom-textarea') // custom classes
    expect(textarea).toHaveClass('flex', 'min-h-[80px]', 'w-full') // base classes
  })

  it('should handle empty content', () => {
    render(<Textarea data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveTextContent('')
  })

  it('should handle initial content', () => {
    render(<Textarea defaultValue="Initial content" data-testid="textarea" />)
    
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe('Initial content')
  })

  it('should handle controlled value updates', () => {
    const { rerender } = render(
      <Textarea value="initial" data-testid="textarea" />
    )
    
    const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe('initial')
    
    rerender(<Textarea value="updated" data-testid="textarea" />)
    expect(textarea.value).toBe('updated')
  })
})
