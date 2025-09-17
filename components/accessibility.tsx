"use client"

import React, { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  MousePointer, 
  Monitor, 
  Sun,
  Moon,
  Contrast,
  Accessibility,
  ZoomIn,
  ZoomOut
} from "lucide-react"

// Accessibility context
interface AccessibilityContextType {
  highContrast: boolean
  fontSize: number
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  colorBlindMode: boolean
  toggleHighContrast: () => void
  setFontSize: (size: number) => void
  toggleReducedMotion: () => void
  toggleScreenReader: () => void
  toggleKeyboardNavigation: () => void
  toggleColorBlindMode: () => void
}

const AccessibilityContext = React.createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = React.useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// Accessibility provider component
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [screenReader, setScreenReader] = useState(false)
  const [keyboardNavigation, setKeyboardNavigation] = useState(false)
  const [colorBlindMode, setColorBlindMode] = useState(false)

  useEffect(() => {
    // Load accessibility preferences from localStorage
    const savedHighContrast = localStorage.getItem('accessibility-highContrast') === 'true'
    const savedFontSize = parseInt(localStorage.getItem('accessibility-fontSize') || '16')
    const savedReducedMotion = localStorage.getItem('accessibility-reducedMotion') === 'true'
    const savedScreenReader = localStorage.getItem('accessibility-screenReader') === 'true'
    const savedKeyboardNavigation = localStorage.getItem('accessibility-keyboardNavigation') === 'true'
    const savedColorBlindMode = localStorage.getItem('accessibility-colorBlindMode') === 'true'

    setHighContrast(savedHighContrast)
    setFontSize(savedFontSize)
    setReducedMotion(savedReducedMotion)
    setScreenReader(savedScreenReader)
    setKeyboardNavigation(savedKeyboardNavigation)
    setColorBlindMode(savedColorBlindMode)
  }, [])

  useEffect(() => {
    // Apply accessibility settings to document
    document.documentElement.style.setProperty('--font-size', `${fontSize}px`)
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }

    if (colorBlindMode) {
      document.documentElement.classList.add('color-blind-mode')
    } else {
      document.documentElement.classList.remove('color-blind-mode')
    }
  }, [highContrast, fontSize, reducedMotion, colorBlindMode])

  const toggleHighContrast = () => {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('accessibility-highContrast', newValue.toString())
  }

  const toggleReducedMotion = () => {
    const newValue = !reducedMotion
    setReducedMotion(newValue)
    localStorage.setItem('accessibility-reducedMotion', newValue.toString())
  }

  const toggleScreenReader = () => {
    const newValue = !screenReader
    setScreenReader(newValue)
    localStorage.setItem('accessibility-screenReader', newValue.toString())
  }

  const toggleKeyboardNavigation = () => {
    const newValue = !keyboardNavigation
    setKeyboardNavigation(newValue)
    localStorage.setItem('accessibility-keyboardNavigation', newValue.toString())
  }

  const toggleColorBlindMode = () => {
    const newValue = !colorBlindMode
    setColorBlindMode(newValue)
    localStorage.setItem('accessibility-colorBlindMode', newValue.toString())
  }

  const contextValue: AccessibilityContextType = {
    highContrast,
    fontSize,
    reducedMotion,
    screenReader,
    keyboardNavigation,
    colorBlindMode,
    toggleHighContrast,
    setFontSize,
    toggleReducedMotion,
    toggleScreenReader,
    toggleKeyboardNavigation,
    toggleColorBlindMode,
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  )
}

// Accessibility toolbar component
export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const accessibility = useAccessibility()

  useEffect(() => {
    // Show toolbar after 5 seconds
    const timer = setTimeout(() => setIsVisible(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-12 h-12 p-0 shadow-lg"
        aria-label="Accessibility settings"
      >
        <Accessibility className="w-5 h-5" />
      </Button>

      {isOpen && (
        <Card className="absolute top-16 left-0 w-80 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Accessibility Settings</CardTitle>
            <CardDescription>
              Customize your experience for better accessibility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="high-contrast" className="flex items-center space-x-2">
                  <Contrast className="w-4 h-4" />
                  <span>High Contrast</span>
                </Label>
                <Switch
                  id="high-contrast"
                  checked={accessibility.highContrast}
                  onCheckedChange={accessibility.toggleHighContrast}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reduced-motion" className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Reduced Motion</span>
                </Label>
                <Switch
                  id="reduced-motion"
                  checked={accessibility.reducedMotion}
                  onCheckedChange={accessibility.toggleReducedMotion}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="screen-reader" className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span>Screen Reader</span>
                </Label>
                <Switch
                  id="screen-reader"
                  checked={accessibility.screenReader}
                  onCheckedChange={accessibility.toggleScreenReader}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="keyboard-nav" className="flex items-center space-x-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Keyboard Navigation</span>
                </Label>
                <Switch
                  id="keyboard-nav"
                  checked={accessibility.keyboardNavigation}
                  onCheckedChange={accessibility.toggleKeyboardNavigation}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="color-blind" className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Color Blind Mode</span>
                </Label>
                <Switch
                  id="color-blind"
                  checked={accessibility.colorBlindMode}
                  onCheckedChange={accessibility.toggleColorBlindMode}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size" className="flex items-center space-x-2">
                <ZoomIn className="w-4 h-4" />
                <span>Font Size: {accessibility.fontSize}px</span>
              </Label>
              <Slider
                id="font-size"
                min={12}
                max={24}
                step={1}
                value={[accessibility.fontSize]}
                onValueChange={([value]) => {
                  accessibility.setFontSize(value)
                  localStorage.setItem('accessibility-fontSize', value.toString())
                }}
                className="w-full"
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Keyboard navigation hook
export function useKeyboardNavigation() {
  const accessibility = useAccessibility()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const focusableRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!accessibility.keyboardNavigation) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const focusableElements = focusableRefs.current.filter(Boolean) as HTMLElement[]
      
      switch (event.key) {
        case 'Tab':
          event.preventDefault()
          if (event.shiftKey) {
            setFocusedIndex(prev => 
              prev > 0 ? prev - 1 : focusableElements.length - 1
            )
          } else {
            setFocusedIndex(prev => 
              prev < focusableElements.length - 1 ? prev + 1 : 0
            )
          }
          break
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev < focusableElements.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : focusableElements.length - 1
          )
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          focusableElements[focusedIndex]?.click()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [accessibility.keyboardNavigation, focusedIndex])

  useEffect(() => {
    const focusableElements = focusableRefs.current.filter(Boolean) as HTMLElement[]
    if (focusableElements[focusedIndex]) {
      focusableElements[focusedIndex].focus()
    }
  }, [focusedIndex])

  const registerFocusable = (element: HTMLElement | null, index: number) => {
    focusableRefs.current[index] = element
  }

  return { registerFocusable, focusedIndex }
}

// Screen reader announcement component
export function ScreenReaderAnnouncement({ message }: { message: string }) {
  const accessibility = useAccessibility()
  const [announcements, setAnnouncements] = useState<string[]>([])

  useEffect(() => {
    if (accessibility.screenReader && message) {
      setAnnouncements(prev => [...prev, message])
      
      // Remove announcement after 5 seconds
      const timer = setTimeout(() => {
        setAnnouncements(prev => prev.filter(announcement => announcement !== message))
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [message, accessibility.screenReader])

  if (!accessibility.screenReader || announcements.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  )
}

// Focus trap component for modals
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const accessibility = useAccessibility()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessibility.keyboardNavigation) return

    const container = containerRef.current
    if (!container) return

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [accessibility.keyboardNavigation])

  return (
    <div ref={containerRef} tabIndex={-1}>
      {children}
    </div>
  )
}

// Skip link component
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Skip to main content
    </a>
  )
}

// High contrast theme toggle
export function HighContrastToggle() {
  const accessibility = useAccessibility()
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={accessibility.toggleHighContrast}
      className="flex items-center space-x-2"
      aria-label={`${accessibility.highContrast ? 'Disable' : 'Enable'} high contrast mode`}
    >
      {accessibility.highContrast ? (
        <>
          <EyeOff className="w-4 h-4" />
          <span>High Contrast</span>
        </>
      ) : (
        <>
          <Eye className="w-4 h-4" />
          <span>High Contrast</span>
        </>
      )}
    </Button>
  )
}

// Font size controls
export function FontSizeControls() {
  const accessibility = useAccessibility()
  
  const increaseFontSize = () => {
    const newSize = Math.min(accessibility.fontSize + 2, 24)
    accessibility.setFontSize(newSize)
    localStorage.setItem('accessibility-fontSize', newSize.toString())
  }
  
  const decreaseFontSize = () => {
    const newSize = Math.max(accessibility.fontSize - 2, 12)
    accessibility.setFontSize(newSize)
    localStorage.setItem('accessibility-fontSize', newSize.toString())
  }
  
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={decreaseFontSize}
        aria-label="Decrease font size"
        disabled={accessibility.fontSize <= 12}
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <span className="text-sm font-medium min-w-[3rem] text-center">
        {accessibility.fontSize}px
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={increaseFontSize}
        aria-label="Increase font size"
        disabled={accessibility.fontSize >= 24}
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
    </div>
  )
}
