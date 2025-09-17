"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  CalendarIcon,
  MapPin,
  Star,
  Shield,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  User,
  Phone,
  Mail,
} from "lucide-react"
import { format, addDays, isAfter, isBefore } from "date-fns"

const MOCK_PROVIDER = {
  id: "1",
  name: "Sarah Johnson",
  rating: 4.9,
  reviewCount: 156,
  image: "/professional-female-barber.png",
  specialties: ["Haircuts", "Massage Therapy", "Beard Grooming"],
  licenseNumber: "CA-12345 / LMT-67890",
  state: "California",
  phone: "(555) 123-4567",
  email: "sarah.j@beautypro.com",
  cancellationPolicy: {
    clientCancellation: {
      "24hours": { fee: 0, refund: 100 },
      "12hours": { fee: 25, refund: 75 },
      "6hours": { fee: 50, refund: 50 },
      "2hours": { fee: 75, refund: 25 },
      noshow: { fee: 100, refund: 0 },
    },
    providerCancellation: {
      "24hours": { penalty: 0, compensation: 0 },
      "12hours": { penalty: 50, compensation: 25 },
      "6hours": { penalty: 100, compensation: 50 },
      "2hours": { penalty: 150, compensation: 75 },
      noshow: { penalty: 200, compensation: 100 },
    },
  },
}

const SERVICES = [
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
    name: "Swedish Massage",
    duration: 60,
    salonPrice: 80,
    homePrice: 120,
    description: "Relaxing full-body Swedish massage therapy",
  },
  {
    id: "3",
    name: "Deep Tissue Massage",
    duration: 90,
    salonPrice: 110,
    homePrice: 150,
    description: "Therapeutic deep tissue massage for muscle tension",
  },
]

// Generate availability for next 30 days
const generateAvailability = () => {
  const availability: { [key: string]: string[] } = {}
  const today = new Date()

  for (let i = 1; i <= 30; i++) {
    const date = addDays(today, i)
    const dateStr = format(date, "yyyy-MM-dd")

    // Skip Sundays (day 0)
    if (date.getDay() === 0) continue

    // Generate random availability
    const timeSlots = [
      "9:00 AM",
      "9:30 AM",
      "10:00 AM",
      "10:30 AM",
      "11:00 AM",
      "11:30 AM",
      "1:00 PM",
      "1:30 PM",
      "2:00 PM",
      "2:30 PM",
      "3:00 PM",
      "3:30 PM",
      "4:00 PM",
      "4:30 PM",
    ]

    // Randomly remove some slots to simulate bookings
    const availableSlots = timeSlots.filter(() => Math.random() > 0.3)
    availability[dateStr] = availableSlots
  }

  return availability
}

const AVAILABILITY = generateAvailability()

const MOCK_BOOKINGS = [
  {
    id: "1",
    clientName: "John Doe",
    service: "Men's Haircut",
    date: "2024-08-15",
    time: "10:00 AM",
    status: "confirmed",
    price: 35,
    location: "salon",
  },
  {
    id: "2",
    clientName: "Jane Smith",
    service: "Swedish Massage",
    date: "2024-08-16",
    time: "2:00 PM",
    status: "pending",
    price: 120,
    location: "home",
  },
]

export default function BookingCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [serviceLocation, setServiceLocation] = useState("")
  const [showCancellationPolicy, setShowCancellationPolicy] = useState(false)
  const [activeTab, setActiveTab] = useState("book")

  const selectedServiceData = SERVICES.find((s) => s.id === selectedService)
  const price =
    selectedServiceData && serviceLocation === "home"
      ? selectedServiceData.homePrice
      : selectedServiceData?.salonPrice || 0

  const availableDates = Object.keys(AVAILABILITY).map((dateStr) => new Date(dateStr))
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""
  const availableTimes = selectedDateStr ? AVAILABILITY[selectedDateStr] || [] : []

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return AVAILABILITY[dateStr] && AVAILABILITY[dateStr].length > 0
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Service Calendar</h1>
                <p className="text-sm text-gray-600">Book appointments with real-time availability</p>
              </div>
            </div>
            <Badge variant="secondary">Live Availability</Badge>
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
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-12 h-12 text-primary" />
                  </div>
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
                      <p className="text-sm text-gray-600">{MOCK_PROVIDER.licenseNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{MOCK_PROVIDER.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-600">{MOCK_PROVIDER.email}</p>
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
                </div>

                {/* Cancellation Policy Button */}
                <Button
                  variant="outline"
                  className="w-full mt-6 bg-transparent"
                  onClick={() => setShowCancellationPolicy(true)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  View Cancellation Policy
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="book">Book Appointment</TabsTrigger>
                <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              </TabsList>

              <TabsContent value="book" className="space-y-6">
                {/* Service Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Service & Location</CardTitle>
                    <CardDescription>Choose your preferred service and location</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Service Type</Label>
                      <Select value={selectedService} onValueChange={setSelectedService}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERVICES.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - {service.duration} min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedService && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Location</Label>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card
                            className={`cursor-pointer transition-all ${
                              serviceLocation === "salon" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                            }`}
                            onClick={() => setServiceLocation("salon")}
                          >
                            <CardContent className="p-4 text-center">
                              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                              <h3 className="font-medium">Visit Salon</h3>
                              <p className="text-lg font-bold text-primary mt-2">${selectedServiceData?.salonPrice}</p>
                            </CardContent>
                          </Card>

                          <Card
                            className={`cursor-pointer transition-all ${
                              serviceLocation === "home" ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                            }`}
                            onClick={() => setServiceLocation("home")}
                          >
                            <CardContent className="p-4 text-center">
                              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                              <h3 className="font-medium">Home Service</h3>
                              <p className="text-lg font-bold text-primary mt-2">${selectedServiceData?.homePrice}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Date & Time Selection */}
                {selectedService && serviceLocation && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Date & Time</CardTitle>
                      <CardDescription>Choose your preferred appointment slot</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-base font-medium mb-4 block">Available Dates</Label>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              isBefore(date, new Date()) ||
                              isAfter(date, addDays(new Date(), 30)) ||
                              !isDateAvailable(date)
                            }
                            className="rounded-md border"
                            modifiers={{
                              available: availableDates,
                              booked: (date) => !isDateAvailable(date),
                            }}
                            modifiersStyles={{
                              available: { backgroundColor: "#dcfce7", color: "#166534" },
                              booked: { backgroundColor: "#fecaca", color: "#dc2626", textDecoration: "line-through" },
                            }}
                          />
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-green-200 rounded"></div>
                              <span>Available</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-red-200 rounded"></div>
                              <span>Fully Booked</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gray-200 rounded"></div>
                              <span>Unavailable</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-base font-medium mb-4 block">Available Times</Label>
                          {selectedDate ? (
                            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                              {availableTimes.length > 0 ? (
                                availableTimes.map((time) => (
                                  <Button
                                    key={time}
                                    variant={selectedTime === time ? "default" : "outline"}
                                    className="justify-center"
                                    onClick={() => setSelectedTime(time)}
                                  >
                                    {time}
                                  </Button>
                                ))
                              ) : (
                                <p className="text-gray-600 col-span-2 text-center py-4">
                                  No available times for this date
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-600 text-center py-8">Please select a date first</p>
                          )}
                        </div>
                      </div>

                      {selectedDate && selectedTime && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
                          <div className="space-y-1 text-sm text-blue-800">
                            <p>
                              <strong>Service:</strong> {selectedServiceData?.name}
                            </p>
                            <p>
                              <strong>Date:</strong> {format(selectedDate, "EEEE, MMMM d, yyyy")}
                            </p>
                            <p>
                              <strong>Time:</strong> {selectedTime}
                            </p>
                            <p>
                              <strong>Duration:</strong> {selectedServiceData?.duration} minutes
                            </p>
                            <p>
                              <strong>Location:</strong> {serviceLocation === "home" ? "Your Location" : "Salon"}
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

                {/* Customer Information */}
                {selectedDate && selectedTime && (
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

                      {serviceLocation === "home" && (
                        <div className="space-y-4">
                          <Label className="text-base font-medium">Service Address</Label>
                          <Input placeholder="Street Address" required />
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

                      <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                        Book Appointment - ${price}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="calendar" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Calendar View</CardTitle>
                    <CardDescription>View all available dates and time slots</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => isBefore(date, new Date()) || isAfter(date, addDays(new Date(), 30))}
                        className="rounded-md border mx-auto"
                        modifiers={{
                          available: availableDates,
                          booked: (date) => !isDateAvailable(date),
                        }}
                        modifiersStyles={{
                          available: { backgroundColor: "#dcfce7", color: "#166534" },
                          booked: { backgroundColor: "#fecaca", color: "#dc2626" },
                        }}
                      />

                      {selectedDate && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Available Times - {format(selectedDate, "EEEE, MMMM d, yyyy")}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-4 gap-2">
                              {availableTimes.length > 0 ? (
                                availableTimes.map((time) => (
                                  <Badge key={time} variant="outline" className="justify-center py-2">
                                    {time}
                                  </Badge>
                                ))
                              ) : (
                                <p className="text-gray-600 col-span-4 text-center py-4">
                                  No available times for this date
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Bookings</CardTitle>
                    <CardDescription>Manage your scheduled appointments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {MOCK_BOOKINGS.map((booking) => (
                        <Card key={booking.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4">
                                <h3 className="font-medium">{booking.service}</h3>
                                {getStatusBadge(booking.status)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>{format(new Date(booking.date), "MMM d, yyyy")}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{booking.time}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span className="capitalize">{booking.location}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4" />
                                  <span>${booking.price}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                Reschedule
                              </Button>
                              <Button variant="destructive" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Cancellation Policy Modal */}
      {showCancellationPolicy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
                <span>Cancellation Policy & Penalties</span>
              </CardTitle>
              <CardDescription>Important information about cancellation fees and penalties</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Cancellation Policy */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-900">Client Cancellation Policy</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Cancellation Fees</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24+ hours before:</span>
                          <span className="text-green-600 font-medium">FREE</span>
                        </div>
                        <div className="flex justify-between">
                          <span>12-24 hours before:</span>
                          <span className="text-yellow-600 font-medium">25% fee</span>
                        </div>
                        <div className="flex justify-between">
                          <span>6-12 hours before:</span>
                          <span className="text-orange-600 font-medium">50% fee</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2-6 hours before:</span>
                          <span className="text-red-600 font-medium">75% fee</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No-show/Last minute:</span>
                          <span className="text-red-600 font-medium">100% fee</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Refund Policy</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24+ hours before:</span>
                          <span className="text-green-600 font-medium">100% refund</span>
                        </div>
                        <div className="flex justify-between">
                          <span>12-24 hours before:</span>
                          <span className="text-yellow-600 font-medium">75% refund</span>
                        </div>
                        <div className="flex justify-between">
                          <span>6-12 hours before:</span>
                          <span className="text-orange-600 font-medium">50% refund</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2-6 hours before:</span>
                          <span className="text-red-600 font-medium">25% refund</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No-show/Last minute:</span>
                          <span className="text-red-600 font-medium">No refund</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Provider Cancellation Policy */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-900">Provider Cancellation Policy</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Provider Penalties</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24+ hours before:</span>
                          <span className="text-green-600 font-medium">No penalty</span>
                        </div>
                        <div className="flex justify-between">
                          <span>12-24 hours before:</span>
                          <span className="text-yellow-600 font-medium">$50 penalty</span>
                        </div>
                        <div className="flex justify-between">
                          <span>6-12 hours before:</span>
                          <span className="text-orange-600 font-medium">$100 penalty</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2-6 hours before:</span>
                          <span className="text-red-600 font-medium">$150 penalty</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No-show/Last minute:</span>
                          <span className="text-red-600 font-medium">$200 penalty</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Client Compensation</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>24+ hours before:</span>
                          <span className="text-green-600 font-medium">Full refund</span>
                        </div>
                        <div className="flex justify-between">
                          <span>12-24 hours before:</span>
                          <span className="text-yellow-600 font-medium">Refund + $25</span>
                        </div>
                        <div className="flex justify-between">
                          <span>6-12 hours before:</span>
                          <span className="text-orange-600 font-medium">Refund + $50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2-6 hours before:</span>
                          <span className="text-red-600 font-medium">Refund + $75</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No-show/Last minute:</span>
                          <span className="text-red-600 font-medium">Refund + $100</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Additional Policies */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Policies</h3>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Repeat Offender Policy</span>
                    </h4>
                    <ul className="text-sm space-y-1 text-yellow-800">
                      <li>• 3+ cancellations within 30 days: Account warning</li>
                      <li>• 5+ cancellations within 30 days: Account suspension (7 days)</li>
                      <li>• 7+ cancellations within 30 days: Account termination</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span>Emergency Exceptions</span>
                    </h4>
                    <ul className="text-sm space-y-1 text-blue-800">
                      <li>• Medical emergencies (with documentation)</li>
                      <li>• Natural disasters or severe weather</li>
                      <li>• Family emergencies (with verification)</li>
                      <li>• COVID-19 related cancellations</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>Protection Measures</span>
                    </h4>
                    <ul className="text-sm space-y-1 text-purple-800">
                      <li>• All cancellations are logged and tracked</li>
                      <li>• Automatic penalty calculation and processing</li>
                      <li>• Dispute resolution process available</li>
                      <li>• Insurance coverage for qualifying emergencies</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowCancellationPolicy(false)}>
                  Close
                </Button>
                <Button onClick={() => setShowCancellationPolicy(false)}>I Understand</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
