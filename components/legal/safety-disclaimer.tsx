"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Heart, Phone, Shield } from "lucide-react"

interface SafetyDisclaimerProps {
  onAcceptance: (accepted: boolean) => void
  required?: boolean
}

export function SafetyDisclaimer({ onAcceptance, required = true }: SafetyDisclaimerProps) {
  const [healthWarningAccepted, setHealthWarningAccepted] = useState(false)
  const [allergyDisclaimerAccepted, setAllergyDisclaimerAccepted] = useState(false)
  const [emergencyProceduresAccepted, setEmergencyProceduresAccepted] = useState(false)
  const [serviceQualityAccepted, setServiceQualityAccepted] = useState(false)

  const allAccepted = healthWarningAccepted && allergyDisclaimerAccepted && 
                     emergencyProceduresAccepted && serviceQualityAccepted

  const handleAcceptanceChange = () => {
    onAcceptance(allAccepted)
  }

  return (
    <div className="space-y-4">
      {/* Header Warning */}
      <div className="flex items-start space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
        <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-900 text-lg">Important Health & Safety Information</h3>
          <p className="text-sm text-red-700 mt-2 leading-relaxed">
            Beauty services carry inherent risks. Please read and acknowledge all safety information below 
            before proceeding with your booking.
          </p>
        </div>
      </div>

      {/* Health Warnings */}
      <Card className="border-2 border-red-200">
        <CardHeader className="pb-3 bg-red-50">
          <CardTitle className="flex items-center space-x-2 text-red-900">
            <Heart className="w-5 h-5" />
            <span>Health Warnings</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Consult Your Doctor First If You:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Are pregnant or nursing</li>
                <li>• Have chronic medical conditions (diabetes, heart disease, etc.)</li>
                <li>• Take blood thinning medications</li>
                <li>• Have compromised immune system</li>
                <li>• Have history of keloid scarring</li>
                <li>• Are undergoing cancer treatment</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">🚨 Potential Risks Include:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Allergic reactions and skin irritation</li>
                <li>• Infection if proper sanitation is not followed</li>
                <li>• Scarring or permanent skin changes</li>
                <li>• Burns from heat styling or chemical treatments</li>
                <li>• Eye injury from beauty treatments near face</li>
                <li>• Adverse reactions to products or chemicals</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="health-warning"
              checked={healthWarningAccepted}
              onCheckedChange={(checked) => {
                setHealthWarningAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <label htmlFor="health-warning" className="text-sm font-medium cursor-pointer">
              I acknowledge the health warnings above and confirm that I have consulted with my healthcare 
              provider if any of the conditions apply to me.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Allergy Disclaimer */}
      <Card className="border-2 border-orange-200">
        <CardHeader className="pb-3 bg-orange-50">
          <CardTitle className="flex items-center space-x-2 text-orange-900">
            <AlertTriangle className="w-5 h-5" />
            <span>Allergy & Sensitivity Disclosure</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-2">Your Responsibility:</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Inform your provider of ALL known allergies</li>
              <li>• Disclose sensitivity to chemicals, fragrances, or latex</li>
              <li>• Request patch tests for new products when possible</li>
              <li>• Stop treatment immediately if you feel discomfort</li>
              <li>• Bring your own products if you have severe sensitivities</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="allergy-disclaimer"
              checked={allergyDisclaimerAccepted}
              onCheckedChange={(checked) => {
                setAllergyDisclaimerAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <label htmlFor="allergy-disclaimer" className="text-sm font-medium cursor-pointer">
              I understand that I must disclose all allergies and sensitivities to my service provider, 
              and that Beauty Crafter is not responsible for allergic reactions.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Procedures */}
      <Card className="border-2 border-blue-200">
        <CardHeader className="pb-3 bg-blue-50">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Phone className="w-5 h-5" />
            <span>Emergency Procedures</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h4 className="font-bold text-red-900 mb-2 text-lg">🚨 IN CASE OF EMERGENCY:</h4>
            <div className="space-y-2">
              <p className="text-red-800 font-semibold">
                1. CALL 911 IMMEDIATELY for serious allergic reactions, injuries, or medical emergencies
              </p>
              <p className="text-red-800">
                2. For non-emergency issues, contact your healthcare provider
              </p>
              <p className="text-red-800">
                3. Report the incident to Beauty Crafter within 24 hours
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Platform Limitations:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Beauty Crafter provides contact information only</li>
              <li>• We cannot provide medical advice or emergency response</li>
              <li>• You are responsible for your own emergency decisions</li>
              <li>• Providers are independent contractors, not our employees</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="emergency-procedures"
              checked={emergencyProceduresAccepted}
              onCheckedChange={(checked) => {
                setEmergencyProceduresAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <label htmlFor="emergency-procedures" className="text-sm font-medium cursor-pointer">
              I understand the emergency procedures and acknowledge that Beauty Crafter cannot provide 
              emergency medical response or advice.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Service Quality Disclaimer */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="pb-3 bg-purple-50">
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <Shield className="w-5 h-5" />
            <span>Service Quality Disclaimer</span>
            {required && <span className="text-red-500">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-2">Important Disclaimers:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Results may vary significantly by individual</li>
              <li>• Beauty Crafter does not guarantee service outcomes</li>
              <li>• Providers are independent professionals, not our employees</li>
              <li>• We do not control or supervise service delivery</li>
              <li>• You assume all risks of service participation</li>
              <li>• Our liability is limited to $100 maximum</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Your Rights:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Verify provider credentials before booking</li>
              <li>• Ask questions about procedures and products</li>
              <li>• Stop treatment if uncomfortable</li>
              <li>• Report concerns through our platform</li>
              <li>• Request refunds according to our policy</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox 
              id="service-quality"
              checked={serviceQualityAccepted}
              onCheckedChange={(checked) => {
                setServiceQualityAccepted(checked as boolean)
                handleAcceptanceChange()
              }}
              required={required}
            />
            <label htmlFor="service-quality" className="text-sm font-medium cursor-pointer">
              I understand that Beauty Crafter is a marketplace platform only and does not guarantee 
              service quality or outcomes. I assume all risks of service participation.
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Final Acceptance Status */}
      <div className={`p-4 rounded-lg border-2 ${
        allAccepted 
          ? 'bg-green-50 border-green-200' 
          : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-center space-x-2">
          {allAccepted ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-bold text-green-900">
                All safety disclaimers acknowledged ✓
              </span>
              <span className="text-xs text-green-700 ml-2">
                You may proceed with booking
              </span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-bold text-yellow-900">
                Please acknowledge all safety information above
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
