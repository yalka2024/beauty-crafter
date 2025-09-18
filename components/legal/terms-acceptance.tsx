"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, FileText, Shield, Scale } from "lucide-react"
import Link from "next/link"

interface TermsAcceptanceProps {
  userType: 'client' | 'provider'
  onAcceptance: (accepted: boolean) => void
  required?: boolean
}

export function TermsAcceptance({ userType, onAcceptance, required = true }: TermsAcceptanceProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [providerAgreementAccepted, setProviderAgreementAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showProviderModal, setShowProviderModal] = useState(false)

  const allAccepted = userType === 'client' 
    ? termsAccepted && privacyAccepted
    : termsAccepted && privacyAccepted && providerAgreementAccepted

  const handleAcceptanceChange = () => {
    onAcceptance(allAccepted)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Legal Agreement Required</h3>
          <p className="text-sm text-red-700 mt-1">
            You must accept all legal agreements to continue. Please read each document carefully.
          </p>
        </div>
      </div>

      {/* Terms of Service */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-600" />
            <span>Terms of Service</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => {
                setTermsAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <div className="space-y-2">
              <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I have read and agree to the{" "}
                <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-blue-600 underline">
                      Terms of Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Beauty Crafter Terms of Service</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <TermsOfServiceContent />
                    </ScrollArea>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowTermsModal(false)}>
                        Close
                      </Button>
                      <Button onClick={() => {
                        setTermsAccepted(true)
                        setShowTermsModal(false)
                        handleAcceptanceChange()
                      }}>
                        Accept Terms
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </label>
              <p className="text-xs text-gray-600">
                Includes liability limitations, dispute resolution, and platform usage rules.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Privacy Policy</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => {
                setPrivacyAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <div className="space-y-2">
              <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                I have read and agree to the{" "}
                <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="p-0 h-auto text-blue-600 underline">
                      Privacy Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Beauty Crafter Privacy Policy</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                      <PrivacyPolicyContent />
                    </ScrollArea>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowPrivacyModal(false)}>
                        Close
                      </Button>
                      <Button onClick={() => {
                        setPrivacyAccepted(true)
                        setShowPrivacyModal(false)
                        handleAcceptanceChange()
                      }}>
                        Accept Privacy Policy
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </label>
              <p className="text-xs text-gray-600">
                How we collect, use, and protect your personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Agreement (only for providers) */}
      {userType === 'provider' && (
        <Card className="border-2 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>Provider Service Agreement</span>
              {required && <span className="text-red-500">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="provider-agreement"
                checked={providerAgreementAccepted}
                onCheckedChange={(checked) => {
                  setProviderAgreementAccepted(checked as boolean)
                  handleAcceptanceChange()
                }}
                required={required}
              />
              <div className="space-y-2">
                <label htmlFor="provider-agreement" className="text-sm font-medium cursor-pointer">
                  I have read and agree to the{" "}
                  <Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-blue-600 underline">
                        Provider Service Agreement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Beauty Crafter Provider Service Agreement</DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh] pr-4">
                        <ProviderAgreementContent />
                      </ScrollArea>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowProviderModal(false)}>
                          Close
                        </Button>
                        <Button onClick={() => {
                          setProviderAgreementAccepted(true)
                          setShowProviderModal(false)
                          handleAcceptanceChange()
                        }}>
                          Accept Provider Agreement
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
                <p className="text-xs text-gray-600">
                  Independent contractor terms, insurance requirements, and service standards.
                </p>
              </div>
            </div>

            {/* Key Provider Requirements */}
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
              <h4 className="text-sm font-semibold text-orange-900 mb-2">Key Requirements:</h4>
              <ul className="text-xs text-orange-800 space-y-1">
                <li>• Professional liability insurance ($1M minimum)</li>
                <li>• Current professional licensing</li>
                <li>• Background check clearance</li>
                <li>• Independent contractor status</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acceptance Status */}
      <div className={`p-4 rounded-lg border-2 ${
        allAccepted 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {allAccepted ? (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-900">
                All legal agreements accepted ✓
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-900">
                Please accept all required agreements to continue
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Terms of Service Content Component
function TermsOfServiceContent() {
  return (
    <div className="prose prose-sm max-w-none">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">1. Platform Description</h3>
          <p className="text-sm leading-relaxed">
            Beauty Crafter is an online marketplace that connects clients with independent beauty service providers. 
            <strong className="text-red-600"> WE ARE NOT A BEAUTY SERVICE PROVIDER.</strong> We do not employ service providers, 
            and we do not provide beauty services directly.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">2. Limitation of Liability</h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-sm leading-relaxed font-medium text-red-900">
              <strong>IMPORTANT:</strong> Our total liability to you is limited to $100 or the amount you paid in the last 12 months, 
              whichever is less. We are not liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">3. Health and Safety Warnings</h3>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
            <p className="text-sm leading-relaxed font-medium text-yellow-900">
              <strong>HEALTH WARNING:</strong> Beauty services carry inherent risks including allergic reactions, 
              skin irritation, and injury. Consult your physician before receiving services if pregnant, nursing, 
              or have medical conditions. <strong>IN CASE OF EMERGENCY, CALL 911 IMMEDIATELY.</strong>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">4. Dispute Resolution</h3>
          <p className="text-sm leading-relaxed">
            <strong>ALL DISPUTES MUST BE RESOLVED THROUGH BINDING ARBITRATION, NOT COURTS.</strong> 
            You waive your right to participate in class action lawsuits.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">5. User Responsibilities</h3>
          <ul className="text-sm space-y-2">
            <li>• Provide accurate health and contact information</li>
            <li>• Disclose allergies, medical conditions, and medications</li>
            <li>• Verify provider qualifications before booking</li>
            <li>• Follow all platform rules and guidelines</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Privacy Policy Content Component  
function PrivacyPolicyContent() {
  return (
    <div className="prose prose-sm max-w-none">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Information We Collect</h3>
          <ul className="text-sm space-y-2">
            <li>• Account information (name, email, phone)</li>
            <li>• Service booking and payment data</li>
            <li>• Location data for service matching</li>
            <li>• Communication records</li>
            <li>• Usage analytics and preferences</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">How We Use Your Information</h3>
          <ul className="text-sm space-y-2">
            <li>• Facilitate service bookings and payments</li>
            <li>• Verify provider credentials and background</li>
            <li>• Improve platform functionality and user experience</li>
            <li>• Send important notifications and updates</li>
            <li>• Comply with legal and regulatory requirements</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Data Sharing</h3>
          <p className="text-sm leading-relaxed">
            We share your information with service providers for booking purposes, payment processors (Stripe), 
            and AI services (OpenAI) for recommendations. We do not sell your personal information to third parties.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Your Rights</h3>
          <ul className="text-sm space-y-2">
            <li>• Access your personal data</li>
            <li>• Correct inaccurate information</li>
            <li>• Delete your account and data</li>
            <li>• Export your data</li>
            <li>• Opt out of marketing communications</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// Provider Agreement Content Component
function ProviderAgreementContent() {
  return (
    <div className="prose prose-sm max-w-none">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Independent Contractor Relationship</h3>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded">
            <p className="text-sm leading-relaxed font-medium text-blue-900">
              <strong>IMPORTANT:</strong> You are an independent contractor, not an employee of Beauty Crafter. 
              We do not control your work methods, provide training, or offer employee benefits.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Required Insurance Coverage</h3>
          <ul className="text-sm space-y-2">
            <li>• <strong>Professional Liability:</strong> Minimum $1,000,000 per occurrence</li>
            <li>• <strong>General Liability:</strong> Minimum $1,000,000 per occurrence</li>
            <li>• <strong>Property Insurance:</strong> If providing services at client locations</li>
            <li>• <strong>Auto Insurance:</strong> If traveling to client locations</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Service Standards</h3>
          <ul className="text-sm space-y-2">
            <li>• Maintain current professional licensing</li>
            <li>• Provide services in a professional manner</li>
            <li>• Follow health and safety protocols</li>
            <li>• Respond to client inquiries within 4 hours</li>
            <li>• Maintain client confidentiality</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Your Liability</h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded">
            <p className="text-sm leading-relaxed font-medium text-red-900">
              <strong>YOU ARE FULLY LIABLE FOR:</strong> All services you provide, any injuries or damages, 
              professional negligence claims, and regulatory violations. You agree to indemnify Beauty Crafter 
              against all claims related to your services.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Commission Structure</h3>
          <p className="text-sm leading-relaxed">
            Beauty Crafter charges a 15% commission on completed bookings. You receive 85% of the service fee 
            (minus payment processing fees). Commission is automatically deducted from payments.
          </p>
        </div>
      </div>
    </div>
  )
}
