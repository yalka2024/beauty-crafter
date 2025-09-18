"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafetyDisclaimer } from "@/components/legal/safety-disclaimer"
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function BookingSafetyDisclaimerPage() {
  const [safetyAccepted, setSafetyAccepted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get the booking details from URL params
  const providerId = searchParams.get('provider')
  const serviceId = searchParams.get('service')
  const returnUrl = searchParams.get('return') || '/booking'

  const handleProceedToBooking = async () => {
    if (!safetyAccepted) {
      return
    }

    setIsLoading(true)

    try {
      // Store the user's safety disclaimer acceptance
      const acceptance = {
        timestamp: new Date().toISOString(),
        providerId,
        serviceId,
        userAgent: navigator.userAgent,
        ipAddress: 'client-side' // Will be logged server-side
      }

      // Save to localStorage for immediate use
      localStorage.setItem('safety_disclaimer_accepted', JSON.stringify(acceptance))

      // Also save to server for permanent record
      await fetch('/api/user/safety-acceptance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(acceptance)
      })

      // Proceed to booking
      const bookingUrl = providerId && serviceId 
        ? `/booking/confirm?provider=${providerId}&service=${serviceId}`
        : returnUrl

      router.push(bookingUrl)
    } catch (error) {
      console.error('Error saving safety acceptance:', error)
      // Still allow them to proceed - safety acceptance is stored locally
      router.push(returnUrl)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/booking" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Booking
          </Link>
          
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-red-900">
                <Shield className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl font-bold">Health & Safety Disclaimer</h1>
                  <p className="text-sm font-normal text-red-700 mt-1">
                    Required before booking any beauty service
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 leading-relaxed">
                    <strong>Important:</strong> This disclaimer must be completed before your first booking. 
                    It covers important health and safety information that protects both you and your service provider.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Safety Disclaimer Component */}
        <SafetyDisclaimer 
          onAcceptance={setSafetyAccepted}
          required={true}
        />

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1 sm:flex-none"
          >
            Cancel Booking
          </Button>
          
          <Button
            onClick={handleProceedToBooking}
            disabled={!safetyAccepted || isLoading}
            className={`flex-1 ${
              safetyAccepted 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : safetyAccepted ? (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Proceed to Booking
              </>
            ) : (
              'Please Accept All Safety Information'
            )}
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why This Disclaimer is Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Legal Protection</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Clarifies platform vs. provider responsibilities</li>
                    <li>• Establishes informed consent for services</li>
                    <li>• Protects all parties from liability disputes</li>
                    <li>• Ensures compliance with health regulations</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Safety</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Ensures you understand potential risks</li>
                    <li>• Reminds you to disclose health conditions</li>
                    <li>• Provides clear emergency procedures</li>
                    <li>• Helps you make informed decisions</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-6">
                <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-800">
                  If you have questions about any of the safety information above, please contact our 
                  support team at <a href="mailto:support@beautycrafter.com" className="underline">support@beautycrafter.com</a> 
                  or call <a href="tel:+1-555-BEAUTY" className="underline">(555) BEAUTY-1</a> before proceeding.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
