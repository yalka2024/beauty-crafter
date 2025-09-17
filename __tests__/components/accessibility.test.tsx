import React from 'react'
import { render, screen } from '@testing-library/react'
import { 
  AccessibilityProvider, 
  useAccessibility 
} from '@/components/accessibility'
import '@testing-library/jest-dom'

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('AccessibilityProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should provide accessibility context to children', () => {
    const TestComponent = () => {
      const context = useAccessibility()
      return (
        <div>
          <span data-testid="high-contrast">{context.highContrast ? 'enabled' : 'disabled'}</span>
          <span data-testid="font-size">{context.fontSize}</span>
          <span data-testid="reduced-motion">{context.reducedMotion ? 'enabled' : 'disabled'}</span>
        </div>
      )
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('high-contrast')).toBeInTheDocument()
    expect(screen.getByTestId('font-size')).toBeInTheDocument()
    expect(screen.getByTestId('reduced-motion')).toBeInTheDocument()
  })

  it('should initialize with default values', () => {
    const TestComponent = () => {
      const context = useAccessibility()
      return (
        <div>
          <span data-testid="high-contrast">{context.highContrast ? 'enabled' : 'disabled'}</span>
          <span data-testid="font-size">{context.fontSize}</span>
          <span data-testid="reduced-motion">{context.reducedMotion ? 'enabled' : 'disabled'}</span>
        </div>
      )
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('disabled')
    expect(screen.getByTestId('font-size')).toHaveTextContent('16')
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('disabled')
  })

  it('should load saved preferences from localStorage', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessibility-highContrast') return 'true'
      if (key === 'accessibility-fontSize') return '18'
      if (key === 'accessibility-reducedMotion') return 'true'
      return null
    })

    const TestComponent = () => {
      const context = useAccessibility()
      return (
        <div>
          <span data-testid="high-contrast">{context.highContrast ? 'enabled' : 'disabled'}</span>
          <span data-testid="font-size">{context.fontSize}</span>
          <span data-testid="reduced-motion">{context.reducedMotion ? 'enabled' : 'disabled'}</span>
        </div>
      )
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )

    expect(screen.getByTestId('high-contrast')).toHaveTextContent('enabled')
    expect(screen.getByTestId('font-size')).toHaveTextContent('18')
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('enabled')
  })
})

describe('useAccessibility', () => {
  it('should throw error when used outside provider', () => {
    const TestComponent = () => {
      const context = useAccessibility()
      return <div>{context.highContrast ? 'enabled' : 'disabled'}</div>
    }

    expect(() => render(<TestComponent />)).toThrow('useAccessibility must be used within AccessibilityProvider')
  })
})

describe('Component Exports', () => {
  it('should export AccessibilityToolbar component', () => {
    const { AccessibilityToolbar } = require('@/components/accessibility')
    expect(typeof AccessibilityToolbar).toBe('function')
  })

  it('should export useKeyboardNavigation hook', () => {
    const { useKeyboardNavigation } = require('@/components/accessibility')
    expect(typeof useKeyboardNavigation).toBe('function')
  })

  it('should export ScreenReaderAnnouncement component', () => {
    const { ScreenReaderAnnouncement } = require('@/components/accessibility')
    expect(typeof ScreenReaderAnnouncement).toBe('function')
  })

  it('should export FocusTrap component', () => {
    const { FocusTrap } = require('@/components/accessibility')
    expect(typeof FocusTrap).toBe('function')
  })

  it('should export SkipLink component', () => {
    const { SkipLink } = require('@/components/accessibility')
    expect(typeof SkipLink).toBe('function')
  })

  it('should export HighContrastToggle component', () => {
    const { HighContrastToggle } = require('@/components/accessibility')
    expect(typeof HighContrastToggle).toBe('function')
  })

  it('should export FontSizeControls component', () => {
    const { FontSizeControls } = require('@/components/accessibility')
    expect(typeof FontSizeControls).toBe('function')
  })
})

describe('SkipLink', () => {
  it('should render skip link', () => {
    const { SkipLink } = require('@/components/accessibility')
    render(<SkipLink />)
    
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeInTheDocument()
  })
})

describe('useKeyboardNavigation', () => {
  it('should provide keyboard navigation handlers', () => {
    const { useKeyboardNavigation } = require('@/components/accessibility')
    
    const TestComponent = () => {
      const handlers = useKeyboardNavigation()
      return (
        <div>
          <button data-testid="test-button" onKeyDown={handlers.handleKeyDown}>
            Test Button
          </button>
        </div>
      )
    }

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    )
    
    expect(screen.getByTestId('test-button')).toBeInTheDocument()
  })
})
