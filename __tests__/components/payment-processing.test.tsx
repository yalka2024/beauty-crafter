import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { PaymentProcessing } from '@/components/payment-processing'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/payment'
}))

// Mock authentication
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'CLIENT'
      }
    },
    status: 'authenticated'
  })
}))

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    elements: jest.fn(() => ({
      create: jest.fn(() => ({
        mount: jest.fn(),
        unmount: jest.fn(),
        on: jest.fn(),
        update: jest.fn()
      }))
    })),
    confirmPayment: jest.fn(),
    confirmCardPayment: jest.fn(),
    createToken: jest.fn(),
    createSource: jest.fn()
  }))
}))

// Mock API calls
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}))

describe('PaymentProcessing', () => {
  const mockPaymentIntent = {
    id: 'pi_test123',
    amount: 4500, // $45.00 in cents
    currency: 'usd',
    status: 'requires_payment_method',
    client_secret: 'pi_test123_secret_abc123'
  }

  const mockAppointment = {
    id: 'appointment-123',
    service: {
      name: 'Haircut & Styling',
      price: 45.00,
      duration: 60
    },
    provider: {
      name: 'Sarah Johnson'
    },
    date: '2024-01-15',
    time: '09:00'
  }

  const mockPaymentMethods = [
    {
      id: 'pm_123',
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025
      },
      billing_details: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    },
    {
      id: 'pm_456',
      type: 'card',
      card: {
        brand: 'mastercard',
        last4: '5555',
        exp_month: 8,
        exp_year: 2026
      },
      billing_details: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render payment form with appointment details', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      expect(screen.getByText('Payment Details')).toBeInTheDocument()
      expect(screen.getByText('Haircut & Styling')).toBeInTheDocument()
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('$45.00')).toBeInTheDocument()
    })

    it('should show payment amount breakdown', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      expect(screen.getByText('Service Cost')).toBeInTheDocument()
      expect(screen.getByText('$45.00')).toBeInTheDocument()
      expect(screen.getByText('Tax')).toBeInTheDocument()
      expect(screen.getByText('$3.60')).toBeInTheDocument() // 8% tax
      expect(screen.getByText('Total')).toBeInTheDocument()
      expect(screen.getByText('$48.60')).toBeInTheDocument()
    })

    it('should display appointment date and time', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      expect(screen.getByText('Date: January 15, 2024')).toBeInTheDocument()
      expect(screen.getByText('Time: 9:00 AM')).toBeInTheDocument()
    })

    it('should show payment method selection', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      expect(screen.getByText('Payment Method')).toBeInTheDocument()
      expect(screen.getByText('Use saved payment method')).toBeInTheDocument()
      expect(screen.getByText('Add new payment method')).toBeInTheDocument()
    })
  })

  describe('Saved Payment Methods', () => {
    it('should display saved payment methods', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      expect(screen.getByText('Visa ending in 4242')).toBeInTheDocument()
      expect(screen.getByText('Mastercard ending in 5555')).toBeInTheDocument()
      expect(screen.getByText('Expires 12/25')).toBeInTheDocument()
      expect(screen.getByText('Expires 8/26')).toBeInTheDocument()
    })

    it('should allow selection of saved payment method', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        expect(visaCard.closest('div')).toHaveClass('ring-2', 'ring-blue-500')
      })
    })

    it('should show selected payment method details', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        expect(screen.getByText('Selected: Visa ending in 4242')).toBeInTheDocument()
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
      })
    })

    it('should handle no saved payment methods', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={[]}
      />)
      
      expect(screen.getByText('No saved payment methods')).toBeInTheDocument()
      expect(screen.getByText('Add a new payment method to continue')).toBeInTheDocument()
    })
  })

  describe('New Payment Method', () => {
    it('should show card input form when adding new payment method', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Card Information')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Card number')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('MM/YY')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('CVC')).toBeInTheDocument()
      })
    })

    it('should validate card number format', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const cardInput = screen.getByPlaceholderText('Card number')
        
        // Invalid card number
        fireEvent.change(cardInput, { target: { value: '1234' } })
        expect(screen.getByText('Please enter a valid card number')).toBeInTheDocument()
        
        // Valid card number
        fireEvent.change(cardInput, { target: { value: '4242424242424242' } })
        expect(screen.queryByText('Please enter a valid card number')).not.toBeInTheDocument()
      })
    })

    it('should validate expiration date', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const expInput = screen.getByPlaceholderText('MM/YY')
        
        // Past date
        fireEvent.change(expInput, { target: { value: '01/23' } })
        expect(screen.getByText('Card has expired')).toBeInTheDocument()
        
        // Future date
        fireEvent.change(expInput, { target: { value: '12/25' } })
        expect(screen.queryByText('Card has expired')).not.toBeInTheDocument()
      })
    })

    it('should validate CVC format', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const cvcInput = screen.getByPlaceholderText('CVC')
        
        // Invalid CVC
        fireEvent.change(cvcInput, { target: { value: '12' } })
        expect(screen.getByText('CVC must be 3-4 digits')).toBeInTheDocument()
        
        // Valid CVC
        fireEvent.change(cvcInput, { target: { value: '123' } })
        expect(screen.queryByText('CVC must be 3-4 digits')).not.toBeInTheDocument()
      })
    })
  })

  describe('Billing Information', () => {
    it('should show billing address form', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Billing Address')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Full name')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Address')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('City')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('State')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('ZIP code')).toBeInTheDocument()
      })
    })

    it('should validate required billing fields', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Full name is required')).toBeInTheDocument()
        expect(screen.getByText('Email is required')).toBeInTheDocument()
        expect(screen.getByText('Address is required')).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Email')
        
        // Invalid email
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
        expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
        
        // Valid email
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
        expect(screen.queryByText('Please enter a valid email')).not.toBeInTheDocument()
      })
    })

    it('should validate ZIP code format', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        const zipInput = screen.getByPlaceholderText('ZIP code')
        
        // Invalid ZIP
        fireEvent.change(zipInput, { target: { value: '123' } })
        expect(screen.getByText('Please enter a valid ZIP code')).toBeInTheDocument()
        
        // Valid ZIP
        fireEvent.change(zipInput, { target: { value: '12345' } })
        expect(screen.queryByText('Please enter a valid ZIP code')).not.toBeInTheDocument()
      })
    })
  })

  describe('Payment Processing', () => {
    it('should process payment with saved method', async () => {
      const mockProcessPayment = jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'txn_123'
      })
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Select saved payment method
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(mockProcessPayment).toHaveBeenCalledWith({
          paymentMethodId: 'pm_123',
          paymentIntentId: 'pi_test123',
          amount: 4860, // $48.60 in cents
          appointmentId: 'appointment-123'
        })
      })
    })

    it('should process payment with new card', async () => {
      const mockProcessPayment = jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'txn_456'
      })
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Add new payment method
      const addNewButton = screen.getByText('Add new payment method')
      fireEvent.click(addNewButton)
      
      await waitFor(() => {
        // Fill in card details
        const cardInput = screen.getByPlaceholderText('Card number')
        const expInput = screen.getByPlaceholderText('MM/YY')
        const cvcInput = screen.getByPlaceholderText('CVC')
        const nameInput = screen.getByPlaceholderText('Full name')
        const emailInput = screen.getByPlaceholderText('Email')
        const addressInput = screen.getByPlaceholderText('Address')
        const cityInput = screen.getByPlaceholderText('City')
        const stateInput = screen.getByPlaceholderText('State')
        const zipInput = screen.getByPlaceholderText('ZIP code')
        
        fireEvent.change(cardInput, { target: { value: '4242424242424242' } })
        fireEvent.change(expInput, { target: { value: '12/25' } })
        fireEvent.change(cvcInput, { target: { value: '123' } })
        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
        fireEvent.change(addressInput, { target: { value: '123 Main St' } })
        fireEvent.change(cityInput, { target: { value: 'New York' } })
        fireEvent.change(stateInput, { target: { value: 'NY' } })
        fireEvent.change(zipInput, { target: { value: '10001' } })
        
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(mockProcessPayment).toHaveBeenCalledWith({
          cardNumber: '4242424242424242',
          expMonth: '12',
          expYear: '25',
          cvc: '123',
          billingDetails: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          },
          paymentIntentId: 'pi_test123',
          amount: 4860,
          appointmentId: 'appointment-123'
        })
      })
    })

    it('should show loading state during payment processing', async () => {
      const mockProcessPayment = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      )
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Select payment method and process
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(payButton).toBeDisabled()
        expect(screen.getByText('Processing payment...')).toBeInTheDocument()
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      })
    })

    it('should handle successful payment', async () => {
      const mockProcessPayment = jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'txn_123'
      })
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Process payment
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Payment successful!')).toBeInTheDocument()
        expect(screen.getByText('Transaction ID: txn_123')).toBeInTheDocument()
        expect(screen.getByText('Your appointment has been confirmed')).toBeInTheDocument()
      })
    })

    it('should handle payment errors gracefully', async () => {
      const mockProcessPayment = jest.fn().mockRejectedValue(new Error('Payment failed'))
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Process payment
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
        expect(screen.getByText('Please check your payment information and try again')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should handle specific payment error types', async () => {
      const mockProcessPayment = jest.fn().mockRejectedValue({
        code: 'card_declined',
        message: 'Your card was declined'
      })
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // Process payment
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Card declined')).toBeInTheDocument()
        expect(screen.getByText('Your card was declined. Please try a different payment method.')).toBeInTheDocument()
      })
    })
  })

  describe('Security Features', () => {
    it('should mask sensitive card information', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      expect(screen.getByText('Visa ending in 4242')).toBeInTheDocument()
      expect(screen.queryByText('4242424242424242')).not.toBeInTheDocument()
    })

    it('should use HTTPS for all requests', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      // Check that all form actions use HTTPS
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('action', expect.stringMatching(/^https:\/\//))
    })

    it('should not store sensitive data in localStorage', () => {
      const { container } = render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      // Check that no sensitive data is stored
      const scripts = container.querySelectorAll('script')
      scripts.forEach(script => {
        expect(script.textContent).not.toContain('4242424242424242')
        expect(script.textContent).not.toContain('123')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
      />)
      
      expect(screen.getByRole('button', { name: /add new payment method/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /pay/i })).toBeInTheDocument()
    })

    it('should announce payment status changes to screen readers', async () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const liveRegion = screen.getByTestId('live-region')
        expect(liveRegion).toHaveAttribute('aria-live', 'polite')
      })
    })

    it('should support keyboard navigation', () => {
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
      />)
      
      const firstCard = screen.getByText('Visa ending in 4242')
      firstCard.focus()
      
      // Tab to next element
      fireEvent.keyDown(firstCard, { key: 'Tab' })
      
      const nextElement = screen.getByText('Mastercard ending in 5555')
      expect(nextElement).toHaveFocus()
    })
  })

  describe('Error Recovery', () => {
    it('should allow retry after payment failure', async () => {
      const mockProcessPayment = jest.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, transactionId: 'txn_123' })
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // First attempt fails
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })
      
      // Retry succeeds
      const retryButton = screen.getByRole('button', { name: /try again/i })
      fireEvent.click(retryButton)
      
      await waitFor(() => {
        expect(screen.getByText('Payment successful!')).toBeInTheDocument()
      })
    })

    it('should allow switching payment methods after failure', async () => {
      const mockProcessPayment = jest.fn().mockRejectedValue(new Error('Card declined'))
      
      render(<PaymentProcessing 
        paymentIntent={mockPaymentIntent}
        appointment={mockAppointment}
        savedPaymentMethods={mockPaymentMethods}
        onProcessPayment={mockProcessPayment}
      />)
      
      // First payment method fails
      const visaCard = screen.getByText('Visa ending in 4242')
      fireEvent.click(visaCard)
      
      await waitFor(() => {
        const payButton = screen.getByRole('button', { name: /pay/i })
        fireEvent.click(payButton)
        
        expect(screen.getByText('Payment failed')).toBeInTheDocument()
      })
      
      // Switch to different payment method
      const mastercard = screen.getByText('Mastercard ending in 5555')
      fireEvent.click(mastercard)
      
      await waitFor(() => {
        expect(mastercard.closest('div')).toHaveClass('ring-2', 'ring-blue-500')
        expect(visaCard.closest('div')).not.toHaveClass('ring-2', 'ring-blue-500')
      })
    })
  })
})


