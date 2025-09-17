"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Star, Clock, Home, Building2, User, CreditCard, Shield, CheckCircle } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

const MOCK_PROVIDER = {
  id: "1",
  name: "Sarah Johnson",
  rating: 4.9,
  reviewCount: 156,
  image: "/professional-female-barber.png",
  specialties: ["Haircuts", "Beard Grooming", "Massage Therapy", "Hot Towel Shaves"],
  licenseNumber: "CA-12345 / LMT-67890",
  state: "California",
  experience: "8 years",
  bio: "Professional barber with 8 years of experience specializing in modern cuts and traditional grooming. Licensed in California with expertise in both classic and contemporary styles.",
  services: [
    {
      id: "1",
      name: "Men's Haircut",
      duration: 45,
      salonPrice: 35,
      homePrice: 50,
      description: "Professional haircut with consultation and styling",
    },
    {
      id: "2",
      name: "Beard Trim & Shape",
      duration: 30,
      salonPrice: 25,
      homePrice: 35,
      description: "Precision beard trimming and shaping",
    },
    {
      id: "3",
      name: "Swedish Massage",
      duration: 60,
      salonPrice: 80,
      homePrice: 120,
      description: "Relaxing full-body Swedish massage therapy",
    },
    {
      id: "4",
      name: "Deep Tissue Massage",
      duration: 90,
      salonPrice: 110,
      homePrice: 150,
      description: "Therapeutic deep tissue massage for muscle tension",
    },
  ],
  availability: {
    "2024-08-15": ["9:00 AM", "10:30 AM", "2:00 PM", "3:30 PM"],
    "2024-08-16": ["10:00 AM", "11:30 AM", "1:00 PM", "4:00 PM"],
    "2024-08-17": ["9:30 AM", "2:30 PM", "4:00 PM"],
  } as Record<string, string[]>,
  location: {
    salon: "Downtown Barbershop, 123 Main St, Los Angeles, CA",
    serviceRadius: "15 miles",
  },
}

export default function BookingPage() {
  const [selectedService, setSelectedService] = useState("")
  const [serviceType, setServiceType] = useState("") // "salon" or "home"
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [currentStep, setCurrentStep] = useState(1)

  const selectedServiceData = MOCK_PROVIDER.services.find((s) => s.id === selectedService)
  const price =
    selectedServiceData && serviceType === "home" ? selectedServiceData.homePrice : selectedServiceData?.salonPrice || 0

  const steps = [
    { number: 1, title: "Select Service" },
    { number: 2, title: "Choose Date & Time" },
    { number: 3, title: "Your Information" },
    { number: 4, title: "Payment & Confirmation" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Book Your Service</h1>
            <Badge variant="secondary">Secure Booking</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Provider Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Image
                    src={MOCK_PROVIDER.image || "/placeholder.svg"}
                    alt={MOCK_PROVIDER.name}
                    width={120}
                    height={120}
                    className="rounded-full mx-auto mb-4"
                  />
                  <h2 className="text-xl font-bold">{MOCK_PROVIDER.name}</h2>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{MOCK_PROVIDER.rating}</span>
                    </div>
                    <span className="text-gray-600">({MOCK_PROVIDER.reviewCount} reviews)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Licensed Professional</p>
                      <p className="text-sm text-gray-600">
                        {MOCK_PROVIDER.licenseNumber} • {MOCK_PROVIDER.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{MOCK_PROVIDER.experience} Experience</p>
                      <p className="text-sm text-gray-600">Verified Background Check</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {MOCK_PROVIDER.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">About</p>
                    <p className="text-sm text-gray-600">{MOCK_PROVIDER.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                        currentStep >= step.number
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.number}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.number ? "text-primary" : "text-gray-400"
                        }`}
                      >
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

            {/* Step 1: Select Service */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Service</CardTitle>
                  <CardDescription>Choose the service you&apos;d like to book</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Service Type Selection */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Service Location</Label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card
                        className={`cursor-pointer transition-all ${
                          serviceType === "salon" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                        }`}
                        onClick={() => setServiceType("salon")}
                      >
                        <CardContent className="p-4 text-center">
                          <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium">Visit Salon</h3>
                          <p className="text-sm text-gray-600 mt-1">{MOCK_PROVIDER.location.salon}</p>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all ${
                          serviceType === "home" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                        }`}
                        onClick={() => setServiceType("home")}
                      >
                        <CardContent className="p-4 text-center">
                          <Home className="w-8 h-8 text-primary mx-auto mb-2" />
                          <h3 className="font-medium">Home Service</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Service within {MOCK_PROVIDER.location.serviceRadius}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Service Selection */}
                  {serviceType && (
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Available Services</Label>
                      <div className="space-y-3">
                        {MOCK_PROVIDER.services.map((service) => (
                          <Card
                            key={service.id}
                            className={`cursor-pointer transition-all ${
                              selectedService === service.id ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                            }`}
                            onClick={() => setSelectedService(service.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-medium">{service.name}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                                      <Clock className="w-4 h-4" />
                                      <span>{service.duration} min</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-primary">
                                    ${serviceType === "home" ? service.homePrice : service.salonPrice}
                                  </div>
                                  {serviceType === "home" && service.homePrice > service.salonPrice && (
                                    <div className="text-xs text-gray-500">
                                      +${service.homePrice - service.salonPrice} home service
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Date & Time */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Date & Time</CardTitle>
                  <CardDescription>Select your preferred appointment time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Select Date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                        className="rounded-md border"
                      />
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Available Times</Label>
                      {selectedDate ? (
                        <div className="grid grid-cols-2 gap-2">
                          {MOCK_PROVIDER.availability[format(selectedDate, "yyyy-MM-dd")]?.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              className="justify-center"
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          )) || <p className="text-gray-600 col-span-2">No available times for this date</p>}
                        </div>
                      ) : (
                        <p className="text-gray-600">Please select a date first</p>
                      )}
                    </div>
                  </div>

                  {selectedServiceData && selectedDate && selectedTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>
                          <strong>Service:</strong> {selectedServiceData.name}
                        </p>
                        <p>
                          <strong>Date:</strong> {format(selectedDate, "EEEE, MMMM d, yyyy")}
                        </p>
                        <p>
                          <strong>Time:</strong> {selectedTime}
                        </p>
                        <p>
                          <strong>Duration:</strong> {selectedServiceData.duration} minutes
                        </p>
                        <p>
                          <strong>Location:</strong> {serviceType === "home" ? "Your Location" : "Salon"}
                        </p>
                        <p>
                          <strong>Price:</strong> ${price}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Customer Information */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>Please provide your contact details</CardDescription>
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

                  {serviceType === "home" && (
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Service Address</Label>
                      <div className="space-y-2">
                        <Input placeholder="Street Address" required />
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <Input placeholder="City" required />
                        <Input placeholder="State" required />
                        <Input placeholder="ZIP Code" required />
                      </div>
                      <Textarea placeholder="Special instructions (parking, entrance, etc.)" rows={3} />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Special Requests (Optional)</Label>
                    <Textarea id="notes" placeholder="Any specific requests or preferences..." rows={3} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Payment & Confirmation */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment & Confirmation</CardTitle>
                  <CardDescription>Review your booking and complete payment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Booking Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span>{selectedServiceData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Provider:</span>
                        <span>{MOCK_PROVIDER.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date & Time:</span>
                        <span>
                          {selectedDate && format(selectedDate, "MMM d, yyyy")} at {selectedTime}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Location:</span>
                        <span>{serviceType === "home" ? "Your Location" : "Salon"}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total:</span>
                          <span>${price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Payment Method</Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">Credit/Debit Card</p>
                          <p className="text-sm text-gray-600">Secure payment processing</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number *</Label>
                      <Input id="cardNumber" placeholder="1234 5678 9012 3456" required />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date *</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV *</Label>
                        <Input id="cvv" placeholder="123" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code *</Label>
                        <Input id="zip" placeholder="12345" required />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Secure & Protected</p>
                        <p>
                          Your payment is processed securely. You can cancel up to 24 hours before your appointment for
                          a full refund.
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

              {currentStep < 4 ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                  disabled={
                    (currentStep === 1 && (!selectedService || !serviceType)) ||
                    (currentStep === 2 && (!selectedDate || !selectedTime))
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700">Confirm Booking & Pay ${price}</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
