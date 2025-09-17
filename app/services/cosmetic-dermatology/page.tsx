"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Stethoscope,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Shield,
  Award,
  Calendar,
  Phone,
  CheckCircle,
  AlertTriangle,
  Zap,
  Heart,
  Eye,
} from "lucide-react"
import Image from "next/image"

const DERMATOLOGY_SERVICES = [
  {
    id: "botox",
    name: "Botox Injections",
    description: "Reduce fine lines and wrinkles with FDA-approved botulinum toxin",
    duration: "30-45 min",
    priceRange: "$300-$600",
    popularity: 95,
    category: "Injectable",
  },
  {
    id: "fillers",
    name: "Dermal Fillers",
    description: "Restore volume and smooth wrinkles with hyaluronic acid fillers",
    duration: "45-60 min",
    priceRange: "$500-$1200",
    popularity: 88,
    category: "Injectable",
  },
  {
    id: "chemical-peels",
    name: "Chemical Peels",
    description: "Improve skin texture and tone with professional-grade acids",
    duration: "30-60 min",
    priceRange: "$150-$400",
    popularity: 76,
    category: "Resurfacing",
  },
  {
    id: "laser-resurfacing",
    name: "Laser Resurfacing",
    description: "Advanced laser treatments for skin rejuvenation and scar reduction",
    duration: "60-90 min",
    priceRange: "$800-$2000",
    popularity: 82,
    category: "Laser",
  },
  {
    id: "microneedling",
    name: "Microneedling",
    description: "Stimulate collagen production with precision micro-injuries",
    duration: "60-75 min",
    priceRange: "$200-$500",
    popularity: 71,
    category: "Resurfacing",
  },
  {
    id: "coolsculpting",
    name: "CoolSculpting",
    description: "Non-invasive fat reduction using controlled cooling technology",
    duration: "60-120 min",
    priceRange: "$600-$1500",
    popularity: 68,
    category: "Body Contouring",
  },
]

const MOCK_PROVIDERS = [
  {
    id: "1",
    name: "Dr. Elena Vasquez",
    title: "Board-Certified Dermatologist",
    rating: 4.9,
    reviewCount: 234,
    image: "/female-doctor.png",
    specialties: ["Botox", "Fillers", "Laser Treatments", "Chemical Peels"],
    credentials: ["MD", "Board Certified", "15+ Years Experience"],
    location: "Beverly Hills Medical Center",
    distance: 2.1,
    nextAvailable: "Tomorrow 2:00 PM",
    consultationFee: 150,
    badges: ["Top Rated", "Medical License Verified", "Insurance Accepted"],
    beforeAfter: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"],
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    title: "Cosmetic Dermatologist",
    rating: 4.8,
    reviewCount: 189,
    image: "/placeholder.svg?height=120&width=120",
    specialties: ["Laser Resurfacing", "CoolSculpting", "Microneedling"],
    credentials: ["MD", "Fellowship Trained", "12+ Years Experience"],
    location: "Westside Dermatology Clinic",
    distance: 4.3,
    nextAvailable: "Next Week",
    consultationFee: 200,
    badges: ["Laser Specialist", "Medical License Verified", "Luxury Clinic"],
    beforeAfter: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"],
  },
  {
    id: "3",
    name: "Dr. Sarah Kim",
    title: "Aesthetic Medicine Specialist",
    rating: 4.9,
    reviewCount: 156,
    image: "/placeholder.svg?height=120&width=120",
    specialties: ["Chemical Peels", "Microneedling", "Skin Rejuvenation"],
    credentials: ["MD", "Aesthetic Medicine Certified", "10+ Years Experience"],
    location: "Downtown Aesthetic Center",
    distance: 3.7,
    nextAvailable: "This Friday 11:00 AM",
    consultationFee: 125,
    badges: ["Skin Specialist", "Medical License Verified", "Natural Results"],
    beforeAfter: ["/placeholder.svg?height=150&width=150", "/placeholder.svg?height=150&width=150"],
  },
]

export default function CosmeticDermatologyPage() {
  const [selectedService, setSelectedService] = useState("")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [activeTab, setActiveTab] = useState("services")

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return "text-green-600"
    if (popularity >= 80) return "text-blue-600"
    if (popularity >= 70) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Stethoscope className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Cosmetic Dermatology</h1>
                <p className="text-sm text-gray-600">
                  Board-certified dermatologists for advanced aesthetic treatments
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-100 text-red-800">
                <Shield className="w-4 h-4 mr-1" />
                Medical Grade
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                <Award className="w-4 h-4 mr-1" />
                Board Certified
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="providers">Find Doctors</TabsTrigger>
            <TabsTrigger value="consultation">Book Consultation</TabsTrigger>
            <TabsTrigger value="education">Treatment Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            {/* Service Categories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DERMATOLOGY_SERVICES.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedService === service.id ? "ring-2 ring-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedService(service.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className={getPopularityColor(service.popularity)}>
                        {service.popularity}% Popular
                      </Badge>
                    </div>
                    <Badge className="w-fit">{service.category}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{service.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-600" />
                        <span>{service.duration}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                        <span>{service.priceRange}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Popularity</span>
                        <span>{service.popularity}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${service.popularity}%` }}
                        ></div>
                      </div>
                    </div>

                    <Button className="w-full">Learn More</Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Safety Information */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span>Important Safety Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Before Treatment</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Consultation with board-certified dermatologist required</li>
                      <li>• Medical history and current medications review</li>
                      <li>• Realistic expectations discussion</li>
                      <li>• Informed consent process</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">After Treatment</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Follow post-treatment care instructions</li>
                      <li>• Avoid sun exposure as directed</li>
                      <li>• Schedule follow-up appointments</li>
                      <li>• Report any unusual side effects immediately</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Board-Certified Dermatologists</h2>
                <p className="text-gray-600">Find qualified medical professionals in your area</p>
              </div>
              <div className="flex space-x-2">
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="botox">Botox Specialist</SelectItem>
                    <SelectItem value="laser">Laser Treatments</SelectItem>
                    <SelectItem value="fillers">Dermal Fillers</SelectItem>
                    <SelectItem value="peels">Chemical Peels</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <MapPin className="w-4 h-4 mr-2" />
                  Near Me
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {MOCK_PROVIDERS.map((provider) => (
                <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Provider Image */}
                      <div className="relative">
                        <Image
                          src={provider.image || "/placeholder.svg"}
                          alt={provider.name}
                          width={120}
                          height={120}
                          className="rounded-full"
                        />
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-red-100 text-red-800">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            MD
                          </Badge>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{provider.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{provider.rating}</span>
                              <span className="text-gray-600">({provider.reviewCount})</span>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-3">{provider.title}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {provider.badges.map((badge) => (
                              <Badge key={badge} variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                {badge}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {provider.specialties.map((specialty) => (
                              <Badge key={specialty} className="bg-blue-100 text-blue-800">
                                {specialty}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {provider.credentials.map((credential) => (
                              <Badge key={credential} className="bg-green-100 text-green-800">
                                <Award className="w-3 h-3 mr-1" />
                                {credential}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{provider.distance} miles away</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span>{provider.nextAvailable}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span>Consultation: ${provider.consultationFee}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-600" />
                            <span>{provider.location}</span>
                          </div>
                        </div>

                        {/* Before/After Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Recent Results</Label>
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <Image
                                src={provider.beforeAfter[0] || "/placeholder.svg"}
                                alt="Before"
                                width={80}
                                height={80}
                                className="rounded-lg object-cover mb-1"
                              />
                              <p className="text-xs text-gray-600">Before</p>
                            </div>
                            <div className="text-center">
                              <Image
                                src={provider.beforeAfter[1] || "/placeholder.svg"}
                                alt="After"
                                width={80}
                                height={80}
                                className="rounded-lg object-cover mb-1"
                              />
                              <p className="text-xs text-gray-600">After</p>
                            </div>
                            <Button variant="outline" size="sm" className="h-20 w-20 bg-transparent">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <Button className="bg-red-600 hover:bg-red-700">Book Consultation</Button>
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Office
                        </Button>
                        <Button variant="outline">View Profile</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="consultation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Consultation</CardTitle>
                <CardDescription>Schedule a consultation with a board-certified dermatologist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Treatment Interest</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select treatment" />
                        </SelectTrigger>
                        <SelectContent>
                          {DERMATOLOGY_SERVICES.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Doctor</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOCK_PROVIDERS.map((provider) => (
                            <SelectItem key={provider.id} value={provider.id}>
                              {provider.name} - {provider.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input placeholder="Enter first name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input placeholder="Enter last name" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="your.email@example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input type="tel" placeholder="(555) 123-4567" />
                    </div>

                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="18-25">18-25</SelectItem>
                          <SelectItem value="26-35">26-35</SelectItem>
                          <SelectItem value="36-45">36-45</SelectItem>
                          <SelectItem value="46-55">46-55</SelectItem>
                          <SelectItem value="56-65">56-65</SelectItem>
                          <SelectItem value="65+">65+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Medical History</Label>
                      <div className="space-y-2">
                        {[
                          "Previous cosmetic treatments",
                          "Allergies or sensitivities",
                          "Current medications",
                          "Skin conditions",
                          "Pregnancy/nursing",
                        ].map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <input type="checkbox" id={condition} className="rounded" />
                            <Label htmlFor={condition} className="text-sm">
                              {condition}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Treatment Goals</Label>
                      <div className="space-y-2">
                        {[
                          "Reduce wrinkles/fine lines",
                          "Improve skin texture",
                          "Address acne/scarring",
                          "Anti-aging prevention",
                          "Body contouring",
                          "General consultation",
                        ].map((goal) => (
                          <div key={goal} className="flex items-center space-x-2">
                            <input type="checkbox" id={goal} className="rounded" />
                            <Label htmlFor={goal} className="text-sm">
                              {goal}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <textarea
                        className="w-full p-3 border rounded-md"
                        rows={4}
                        placeholder="Any specific concerns or questions..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">What to Expect</h4>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1">
                        <li>• Comprehensive skin analysis and medical history review</li>
                        <li>• Discussion of treatment options and realistic expectations</li>
                        <li>• Personalized treatment plan with pricing</li>
                        <li>• Before/after photos and consent process if proceeding</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700" size="lg">
                  Schedule Consultation - $150
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Treatment Comparison</CardTitle>
                  <CardDescription>Compare popular cosmetic dermatology treatments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DERMATOLOGY_SERVICES.slice(0, 4).map((service) => (
                      <div key={service.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{service.name}</h4>
                          <Badge variant="outline">{service.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="font-medium">Duration:</span> {service.duration}
                          </div>
                          <div>
                            <span className="font-medium">Price:</span> {service.priceRange}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Safety & Credentials</CardTitle>
                  <CardDescription>What to look for in a cosmetic dermatologist</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Board Certification</h4>
                        <p className="text-sm text-gray-600">
                          Ensure your provider is board-certified in dermatology or plastic surgery
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Medical License</h4>
                        <p className="text-sm text-gray-600">
                          Verify active medical license and check for any disciplinary actions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Experience & Training</h4>
                        <p className="text-sm text-gray-600">
                          Look for specialized training in cosmetic procedures and years of experience
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Facility Accreditation</h4>
                        <p className="text-sm text-gray-600">
                          Treatment should be performed in accredited medical facilities
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      q: "How do I know if I'm a good candidate for cosmetic treatments?",
                      a: "A consultation with a board-certified dermatologist is the best way to determine candidacy. Factors include skin type, medical history, realistic expectations, and specific concerns.",
                    },
                    {
                      q: "Are cosmetic dermatology treatments safe?",
                      a: "When performed by qualified, board-certified dermatologists in proper medical facilities, these treatments are generally safe. However, all medical procedures carry some risk.",
                    },
                    {
                      q: "How long do results typically last?",
                      a: "Results vary by treatment: Botox lasts 3-4 months, fillers 6-18 months, chemical peels provide gradual improvement over weeks, and laser treatments may require multiple sessions.",
                    },
                    {
                      q: "What should I expect during recovery?",
                      a: "Recovery varies by treatment. Some procedures have no downtime, while others may require days to weeks of healing. Your doctor will provide specific aftercare instructions.",
                    },
                  ].map((faq, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
