"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Upload, Shield, CheckCircle, AlertCircle, FileText, Camera, Award } from "lucide-react"
import Link from "next/link"

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
]

const SERVICE_TYPES = [
  { id: "barber", label: "Barber Services", description: "Haircuts, shaves, beard grooming" },
  { id: "nail", label: "Nail Services", description: "Manicures, pedicures, nail art" },
  { id: "massage", label: "Massage Therapy", description: "Licensed massage therapy services" },
  { id: "multiple", label: "Multiple Services", description: "Combination of services" },
]

export default function ProviderRegistration() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    personalInfo: {},
    businessInfo: {},
    licensing: {},
    services: {},
    verification: {},
  })

  const steps = [
    { number: 1, title: "Personal Information", icon: FileText },
    { number: 2, title: "Business Details", icon: Award },
    { number: 3, title: "Licensing & Certification", icon: Shield },
    { number: 4, title: "Services & Pricing", icon: CheckCircle },
    { number: 5, title: "Verification", icon: Camera },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BeautyPro</span>
            <Badge variant="secondary">Provider Registration</Badge>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                    currentStep >= step.number
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {currentStep > step.number ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${currentStep >= step.number ? "text-primary" : "text-gray-400"}`}>
                    Step {step.number}
                  </p>
                  <p className={`text-xs ${currentStep >= step.number ? "text-gray-900" : "text-gray-400"}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${currentStep > step.number ? "bg-primary" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-primary" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>Please provide your personal details for account verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Enter your first name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Enter your last name" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" placeholder="your.email@example.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input id="phone" type="tel" placeholder="(555) 123-4567" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input id="address" placeholder="123 Main Street" required />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="City" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state} value={state.toLowerCase()}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input id="zip" placeholder="12345" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ssn">Social Security Number *</Label>
                  <Input id="ssn" type="password" placeholder="XXX-XX-XXXX" required />
                  <p className="text-sm text-gray-600">Required for background check and tax purposes</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-6 h-6 text-primary" />
                  <span>Business Information</span>
                </CardTitle>
                <CardDescription>Tell us about your business and service preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" placeholder="Your Business Name (if applicable)" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Structure</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual/Sole Proprietor</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
                  <Input id="ein" placeholder="XX-XXXXXXX (if applicable)" />
                </div>

                <div className="space-y-4">
                  <Label>Service Types *</Label>
                  {SERVICE_TYPES.map((service) => (
                    <div key={service.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox id={service.id} />
                      <div className="flex-1">
                        <Label htmlFor={service.id} className="font-medium cursor-pointer">
                          {service.label}
                        </Label>
                        <p className="text-sm text-gray-600">{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Label>Service Location Preferences *</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox id="homeService" />
                      <Label htmlFor="homeService">Home Service (Travel to clients)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox id="salonService" />
                      <Label htmlFor="salonService">Salon/Shop Service (Clients visit you)</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1">0-1 years</SelectItem>
                      <SelectItem value="2-5">2-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="11-15">11-15 years</SelectItem>
                      <SelectItem value="15+">15+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-primary" />
                  <span>Licensing & Certification</span>
                </CardTitle>
                <CardDescription>Upload your professional licenses and certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Real-Time License Verification Required</h4>
                      <p className="text-sm text-red-700 mt-1">
                        All licenses are verified in real-time with state licensing boards. Fake or invalid licenses
                        will be automatically rejected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseType">License Type *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your license type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barber">Barber License</SelectItem>
                      <SelectItem value="cosmetology">Cosmetology License</SelectItem>
                      <SelectItem value="nail">Nail Technician License</SelectItem>
                      <SelectItem value="massage">Licensed Massage Therapist (LMT)</SelectItem>
                      <SelectItem value="esthetician">Esthetician License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseState">License Issuing State *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state where license was issued" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state.toLowerCase()}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number *</Label>
                  <Input id="licenseNumber" placeholder="Enter your exact license number" required />
                  <p className="text-xs text-gray-600">
                    Must match exactly with state records. We verify with state licensing boards in real-time.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Automated Verification Process</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Real-time verification with state licensing boards</li>
                        <li>• Automatic status checking (active, suspended, expired)</li>
                        <li>• Disciplinary action history review</li>
                        <li>• Continuing education compliance check</li>
                        <li>• Periodic re-verification (monthly)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licenseIssued">License Issue Date *</Label>
                    <Input id="licenseIssued" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry">License Expiry Date *</Label>
                    <Input id="licenseExpiry" type="date" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Upload License Document *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload clear, high-resolution license document</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB • Must be legible and unaltered</p>
                    <Button variant="outline" className="mt-3 bg-transparent">
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-red-600">
                    Document will be cross-referenced with state records. Altered or fake documents will result in
                    permanent ban.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="boardWebsite">State Board Verification URL (Optional)</Label>
                  <Input
                    id="boardWebsite"
                    placeholder="Direct link to your license on state board website"
                    type="url"
                  />
                  <p className="text-xs text-gray-600">Providing this link speeds up verification process</p>
                </div>

                <div className="space-y-2">
                  <Label>Continuing Education Certificates</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload recent CE certificates (recommended)</p>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 5MB each</p>
                    <Button variant="outline" className="mt-3 bg-transparent">
                      Choose Files
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceProvider">Professional Liability Insurance *</Label>
                  <Input id="insuranceProvider" placeholder="Insurance provider name" required />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number *</Label>
                    <Input id="policyNumber" placeholder="Insurance policy number" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverageAmount">Coverage Amount *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500k">$500,000</SelectItem>
                        <SelectItem value="1m">$1,000,000</SelectItem>
                        <SelectItem value="2m">$2,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Massage Therapy Additional Requirements</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Massage therapists must provide additional documentation including NCBTMB certification (if
                        applicable) and local business permits.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-6 h-6 text-primary" />
                  <span>Services & Pricing</span>
                </CardTitle>
                <CardDescription>Define your services and set your pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Barber Services</Label>
                  <div className="space-y-3">
                    {[
                      { service: "Men's Haircut", duration: "30-45 min" },
                      { service: "Beard Trim", duration: "15-30 min" },
                      { service: "Hot Towel Shave", duration: "45-60 min" },
                      { service: "Hair Wash & Style", duration: "20-30 min" },
                    ].map((item, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{item.service}</p>
                            <p className="text-sm text-gray-600">{item.duration}</p>
                          </div>
                        </div>
                        <Input placeholder="$0.00" />
                        <Input placeholder="Home service price" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Nail Services</Label>
                  <div className="space-y-3">
                    {[
                      { service: "Basic Manicure", duration: "30-45 min" },
                      { service: "Gel Manicure", duration: "45-60 min" },
                      { service: "Basic Pedicure", duration: "45-60 min" },
                      { service: "Nail Art", duration: "60-90 min" },
                    ].map((item, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{item.service}</p>
                            <p className="text-sm text-gray-600">{item.duration}</p>
                          </div>
                        </div>
                        <Input placeholder="$0.00" />
                        <Input placeholder="Home service price" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Massage Therapy Services</Label>
                  <div className="space-y-3">
                    {[
                      { service: "Swedish Massage", duration: "60-90 min" },
                      { service: "Deep Tissue Massage", duration: "60-90 min" },
                      { service: "Hot Stone Massage", duration: "90 min" },
                      { service: "Sports Massage", duration: "60 min" },
                      { service: "Prenatal Massage", duration: "60 min" },
                      { service: "Chair Massage", duration: "15-30 min" },
                    ].map((item, index) => (
                      <div key={index} className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox />
                          <div>
                            <p className="font-medium">{item.service}</p>
                            <p className="text-sm text-gray-600">{item.duration}</p>
                          </div>
                        </div>
                        <Input placeholder="$0.00" />
                        <Input placeholder="Home service price" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceRadius">Service Radius (for home services)</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="15">15 miles</SelectItem>
                      <SelectItem value="20">20 miles</SelectItem>
                      <SelectItem value="25">25+ miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="travelFee">Travel Fee (for home services)</Label>
                  <Input id="travelFee" placeholder="$0.00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell potential clients about your experience, specialties, and what makes you unique..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-6 h-6 text-primary" />
                  <span>Verification & Photos</span>
                </CardTitle>
                <CardDescription>Complete your profile with photos and final verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Profile Photo *</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload a professional headshot</p>
                    <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
                    <Button variant="outline" className="mt-3 bg-transparent">
                      Choose Photo
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Work Portfolio</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload photos of your work (optional but recommended)</p>
                    <p className="text-xs text-gray-500">JPG, PNG up to 5MB each, max 10 photos</p>
                    <Button variant="outline" className="mt-3 bg-transparent">
                      Choose Photos
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Background Check Consent *</Label>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Background Check Required</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          All providers must pass a background check for customer safety. This includes criminal history
                          and sex offender registry checks.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="backgroundConsent" required />
                    <Label htmlFor="backgroundConsent" className="text-sm leading-relaxed">
                      I consent to a background check and understand that BeautyPro will verify my criminal history and
                      check sex offender registries. I certify that all information provided is accurate and complete.
                    </Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Terms and Conditions *</Label>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>
                      ,{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      , and{" "}
                      <Link href="/provider-agreement" className="text-primary hover:underline">
                        Provider Agreement
                      </Link>
                    </Label>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Next Steps</h4>
                      <p className="text-sm text-green-700 mt-1">
                        After submission, we&apos;ll verify your license, conduct a background check, and review your
                        application. This process typically takes 3-5 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 5 ? (
              <Button onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}>Next Step</Button>
            ) : (
              <Button className="bg-green-600 hover:bg-green-700">Submit Application</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
