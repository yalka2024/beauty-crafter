"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Sparkles,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Leaf,
  Heart,
  Droplets,
  Sun,
  Flower,
  Calendar,
  Phone,
  Eye,
  Zap,
} from "lucide-react"
import Image from "next/image"

const FACIAL_SERVICES = [
  {
    id: "hydrafacial",
    name: "HydraFacial",
    description: "Multi-step treatment that cleanses, extracts, and hydrates skin",
    duration: "60 min",
    priceRange: "$150-$300",
    popularity: 92,
    category: "Hydrating",
    benefits: ["Deep Cleansing", "Hydration", "Instant Glow"],
    skinTypes: ["All Skin Types"],
  },
  {
    id: "oxygen-facial",
    name: "Oxygen Facial",
    description: "Infuses oxygen and nutrients for radiant, plump skin",
    duration: "75 min",
    priceRange: "$120-$250",
    popularity: 85,
    category: "Anti-Aging",
    benefits: ["Brightening", "Plumping", "Circulation"],
    skinTypes: ["Mature", "Dull", "Sensitive"],
  },
  {
    id: "diamond-microdermabrasion",
    name: "Diamond Microdermabrasion",
    description: "Exfoliates dead skin cells for smoother, brighter complexion",
    duration: "45 min",
    priceRange: "$100-$200",
    popularity: 78,
    category: "Exfoliating",
    benefits: ["Texture Improvement", "Pore Refinement", "Brightening"],
    skinTypes: ["Normal", "Oily", "Combination"],
  },
  {
    id: "led-light-therapy",
    name: "LED Light Therapy",
    description: "Uses specific light wavelengths to target skin concerns",
    duration: "30 min",
    priceRange: "$80-$150",
    popularity: 73,
    category: "Therapeutic",
    benefits: ["Acne Treatment", "Anti-Aging", "Healing"],
    skinTypes: ["Acne-Prone", "Aging", "Sensitive"],
  },
  {
    id: "gold-facial",
    name: "24K Gold Facial",
    description: "Luxurious treatment with real gold for ultimate anti-aging",
    duration: "90 min",
    priceRange: "$200-$400",
    popularity: 68,
    category: "Luxury",
    benefits: ["Anti-Aging", "Firming", "Radiance"],
    skinTypes: ["Mature", "Dry", "Normal"],
  },
  {
    id: "enzyme-peel",
    name: "Enzyme Peel Facial",
    description: "Gentle fruit enzymes dissolve dead skin for natural glow",
    duration: "60 min",
    priceRange: "$90-$180",
    popularity: 81,
    category: "Brightening",
    benefits: ["Gentle Exfoliation", "Brightening", "Smoothing"],
    skinTypes: ["Sensitive", "Dry", "Normal"],
  },
]

const MOCK_SPAS = [
  {
    id: "1",
    name: "Serenity Spa & Wellness",
    rating: 4.9,
    reviewCount: 342,
    image: "/placeholder.svg?height=120&width=120",
    specialties: ["HydraFacial", "Oxygen Facial", "LED Therapy"],
    location: "Beverly Hills",
    distance: 1.8,
    priceRange: "$$$$",
    nextAvailable: "Today 3:00 PM",
    badges: ["Luxury Spa", "Organic Products", "Award Winning"],
    amenities: ["Steam Room", "Relaxation Lounge", "Complimentary Tea"],
    atmosphere: "Luxury",
  },
  {
    id: "2",
    name: "Natural Glow Facial Studio",
    rating: 4.8,
    reviewCount: 198,
    image: "/placeholder.svg?height=120&width=120",
    specialties: ["Enzyme Peels", "Organic Facials", "Microdermabrasion"],
    location: "West Hollywood",
    distance: 3.2,
    priceRange: "$$$",
    nextAvailable: "Tomorrow 11:00 AM",
    badges: ["Eco-Friendly", "Organic Certified", "Cruelty-Free"],
    amenities: ["Aromatherapy", "Herbal Teas", "Meditation Room"],
    atmosphere: "Natural",
  },
  {
    id: "3",
    name: "Urban Skin Clinic",
    rating: 4.7,
    reviewCount: 156,
    image: "/placeholder.svg?height=120&width=120",
    specialties: ["Gold Facial", "Advanced LED", "Clinical Treatments"],
    location: "Downtown LA",
    distance: 5.1,
    priceRange: "$$$",
    nextAvailable: "This Weekend",
    badges: ["Medical Grade", "Latest Technology", "Expert Estheticians"],
    amenities: ["Skin Analysis", "Product Consultation", "Parking"],
    atmosphere: "Clinical",
  },
]

const SKIN_CONCERNS = [
  { id: "acne", label: "Acne & Breakouts", icon: "🔴" },
  { id: "aging", label: "Fine Lines & Wrinkles", icon: "⏰" },
  { id: "dryness", label: "Dryness & Dehydration", icon: "💧" },
  { id: "dullness", label: "Dull & Tired Skin", icon: "😴" },
  { id: "sensitivity", label: "Sensitivity & Redness", icon: "🌸" },
  { id: "pigmentation", label: "Dark Spots & Pigmentation", icon: "☀️" },
]

export default function FacialSpaPage() {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState([100, 300])
  const [selectedAtmosphere, setSelectedAtmosphere] = useState("")
  const [activeTab, setActiveTab] = useState("services")

  const toggleConcern = (concernId: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concernId) ? prev.filter((id) => id !== concernId) : [...prev, concernId],
    )
  }

  const getPopularityColor = (popularity: number) => {
    if (popularity >= 90) return "text-green-600"
    if (popularity >= 80) return "text-blue-600"
    if (popularity >= 70) return "text-yellow-600"
    return "text-gray-600"
  }

  const getAtmosphereIcon = (atmosphere: string) => {
    switch (atmosphere) {
      case "Luxury":
        return <Sparkles className="w-4 h-4" />
      case "Natural":
        return <Leaf className="w-4 h-4" />
      case "Clinical":
        return <Zap className="w-4 h-4" />
      default:
        return <Heart className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Facial Spa Services</h1>
                <p className="text-sm text-gray-600">Professional facial treatments for radiant, healthy skin</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-100 text-green-800">
                <Leaf className="w-4 h-4 mr-1" />
                Organic Options
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                <Sparkles className="w-4 h-4 mr-1" />
                Luxury Treatments
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Facial Services</TabsTrigger>
            <TabsTrigger value="spas">Find Spas</TabsTrigger>
            <TabsTrigger value="consultation">Skin Analysis</TabsTrigger>
            <TabsTrigger value="packages">Spa Packages</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-6">
            {/* Skin Concern Selector */}
            <Card>
              <CardHeader>
                <CardTitle>What are your skin concerns?</CardTitle>
                <CardDescription>Select all that apply to get personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SKIN_CONCERNS.map((concern) => (
                    <Card
                      key={concern.id}
                      className={`cursor-pointer transition-all ${
                        selectedConcerns.includes(concern.id) ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-md"
                      }`}
                      onClick={() => toggleConcern(concern.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{concern.icon}</div>
                        <p className="text-sm font-medium">{concern.label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Facial Services */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FACIAL_SERVICES.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <Badge variant="outline" className={getPopularityColor(service.popularity)}>
                        {service.popularity}% Popular
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="w-fit">{service.category}</Badge>
                      {service.category === "Hydrating" && <Droplets className="w-4 h-4 text-blue-500" />}
                      {service.category === "Anti-Aging" && <Sun className="w-4 h-4 text-orange-500" />}
                      {service.category === "Exfoliating" && <Sparkles className="w-4 h-4 text-purple-500" />}
                      {service.category === "Therapeutic" && <Zap className="w-4 h-4 text-green-500" />}
                      {service.category === "Luxury" && <Star className="w-4 h-4 text-yellow-500" />}
                      {service.category === "Brightening" && <Sun className="w-4 h-4 text-yellow-500" />}
                    </div>
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
                      <Label className="text-sm font-medium">Benefits</Label>
                      <div className="flex flex-wrap gap-1">
                        {service.benefits.map((benefit) => (
                          <Badge key={benefit} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Best For</Label>
                      <div className="flex flex-wrap gap-1">
                        {service.skinTypes.map((type) => (
                          <Badge key={type} className="bg-green-100 text-green-800 text-xs">
                            {type}
                          </Badge>
                        ))}
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

                    <Button className="w-full">Book This Treatment</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="spas" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Find Your Perfect Spa</CardTitle>
                <CardDescription>Filter by preferences to find the ideal spa experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>
                      Budget Range: ${budgetRange[0]} - ${budgetRange[1]}
                    </Label>
                    <Slider
                      value={budgetRange}
                      onValueChange={setBudgetRange}
                      max={500}
                      min={50}
                      step={25}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spa Atmosphere</Label>
                    <Select value={selectedAtmosphere} onValueChange={setSelectedAtmosphere}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select atmosphere" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="luxury">Luxury & Elegant</SelectItem>
                        <SelectItem value="natural">Natural & Organic</SelectItem>
                        <SelectItem value="clinical">Clinical & Medical</SelectItem>
                        <SelectItem value="relaxing">Relaxing & Zen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Distance</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Within..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 miles</SelectItem>
                        <SelectItem value="10">10 miles</SelectItem>
                        <SelectItem value="15">15 miles</SelectItem>
                        <SelectItem value="25">25+ miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spa Listings */}
            <div className="space-y-6">
              {MOCK_SPAS.map((spa) => (
                <Card key={spa.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Spa Image */}
                      <div className="relative">
                        <Image
                          src={spa.image || "/placeholder.svg"}
                          alt={spa.name}
                          width={120}
                          height={120}
                          className="rounded-lg object-cover"
                        />
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-purple-100 text-purple-800">
                            {getAtmosphereIcon(spa.atmosphere)}
                            {spa.atmosphere}
                          </Badge>
                        </div>
                      </div>

                      {/* Spa Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{spa.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{spa.rating}</span>
                              <span className="text-gray-600">({spa.reviewCount})</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {spa.badges.map((badge) => (
                              <Badge key={badge} variant="outline" className="text-xs">
                                {badge}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {spa.specialties.map((specialty) => (
                              <Badge key={specialty} className="bg-purple-100 text-purple-800">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{spa.location}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span>{spa.nextAvailable}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span>{spa.priceRange}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{spa.distance} miles</span>
                          </div>
                        </div>

                        {/* Amenities */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Amenities</Label>
                          <div className="flex flex-wrap gap-2">
                            {spa.amenities.map((amenity) => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                <Flower className="w-3 h-3 mr-1" />
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <Button className="bg-purple-600 hover:bg-purple-700">Book Now</Button>
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline">
                          <Phone className="w-4 h-4 mr-2" />
                          Call Spa
                        </Button>
                        <Button variant="outline">View Menu</Button>
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
                <CardTitle>Free Skin Analysis</CardTitle>
                <CardDescription>
                  Get personalized facial recommendations based on your skin type and concerns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>What&apos;s your age range?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="teens">Teens (13-19)</SelectItem>
                          <SelectItem value="twenties">20s</SelectItem>
                          <SelectItem value="thirties">30s</SelectItem>
                          <SelectItem value="forties">40s</SelectItem>
                          <SelectItem value="fifties">50s</SelectItem>
                          <SelectItem value="sixties">60+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>How would you describe your skin type?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select skin type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oily">Oily</SelectItem>
                          <SelectItem value="dry">Dry</SelectItem>
                          <SelectItem value="combination">Combination</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="sensitive">Sensitive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Current skincare routine frequency?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal (cleanser only)</SelectItem>
                          <SelectItem value="basic">Basic (cleanser + moisturizer)</SelectItem>
                          <SelectItem value="moderate">Moderate (3-4 products)</SelectItem>
                          <SelectItem value="extensive">Extensive (5+ products)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>How often do you get professional facials?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Never</SelectItem>
                          <SelectItem value="rarely">Rarely (once a year)</SelectItem>
                          <SelectItem value="occasionally">Occasionally (2-3 times a year)</SelectItem>
                          <SelectItem value="regularly">Regularly (monthly)</SelectItem>
                          <SelectItem value="frequently">Frequently (bi-weekly)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Primary skin concerns (select all that apply)</Label>
                      <div className="space-y-2">
                        {SKIN_CONCERNS.map((concern) => (
                          <div key={concern.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={concern.id}
                              checked={selectedConcerns.includes(concern.id)}
                              onChange={() => toggleConcern(concern.id)}
                              className="rounded"
                            />
                            <Label htmlFor={concern.id} className="text-sm">
                              {concern.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Any allergies or sensitivities?</Label>
                      <textarea
                        className="w-full p-3 border rounded-md"
                        rows={3}
                        placeholder="List any known allergies or skin sensitivities..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>What&apos;s your main goal?</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relaxation">Relaxation & Stress Relief</SelectItem>
                          <SelectItem value="anti-aging">Anti-Aging & Prevention</SelectItem>
                          <SelectItem value="acne">Acne Treatment</SelectItem>
                          <SelectItem value="hydration">Deep Hydration</SelectItem>
                          <SelectItem value="brightening">Skin Brightening</SelectItem>
                          <SelectItem value="maintenance">General Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Eye className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-900">AI Skin Analysis</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Our AI will analyze your responses and recommend the perfect facial treatments and spa
                        experiences tailored to your unique skin needs and lifestyle.
                      </p>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                  Get My Personalized Recommendations
                </Button>
              </CardContent>
            </Card>

            {/* Sample Results */}
            <Card>
              <CardHeader>
                <CardTitle>Sample Analysis Results</CardTitle>
                <CardDescription>Here&apos;s what your personalized recommendations might look like</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Recommended Treatments</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div>
                          <p className="font-medium">HydraFacial</p>
                          <p className="text-sm text-gray-600">Perfect for hydration</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">98% Match</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="font-medium">LED Light Therapy</p>
                          <p className="text-sm text-gray-600">Great for acne concerns</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">92% Match</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Recommended Spas</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div>
                          <p className="font-medium">Serenity Spa & Wellness</p>
                          <p className="text-sm text-gray-600">Luxury experience</p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">95% Match</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div>
                          <p className="font-medium">Natural Glow Studio</p>
                          <p className="text-sm text-gray-600">Organic treatments</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">88% Match</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Signature Spa Packages</CardTitle>
                  <CardDescription>Curated experiences for ultimate relaxation and results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Glow & Go Package</h4>
                        <Badge className="bg-green-100 text-green-800">Popular</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        HydraFacial + LED Therapy + Complimentary skincare consultation
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          90 minutes
                        </div>
                        <div className="text-lg font-bold text-primary">$280</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Ultimate Luxury Experience</h4>
                        <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        24K Gold Facial + Oxygen Treatment + Champagne & Relaxation Lounge
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />
                          2.5 hours
                        </div>
                        <div className="text-lg font-bold text-primary">$450</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Natural Renewal Package</h4>
                        <Badge className="bg-green-100 text-green-800">Organic</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Enzyme Peel + Organic Hydrating Mask + Aromatherapy Session
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          <Clock className="w-4 h-4 inline mr-1" />2 hours
                        </div>
                        <div className="text-lg font-bold text-primary">$220</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Membership & Loyalty Programs</CardTitle>
                  <CardDescription>Save more with regular treatments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">VIP Glow Membership</h4>
                        <Badge className="bg-purple-100 text-purple-800">Best Value</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Monthly facial + 20% off all treatments + Priority booking
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Per month</div>
                        <div className="text-lg font-bold text-primary">$149/mo</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Quarterly Package</h4>
                        <Badge className="bg-blue-100 text-blue-800">Save 15%</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">4 treatments of your choice + Free skin consultation</p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">3 months</div>
                        <div className="text-lg font-bold text-primary">$680</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">Loyalty Rewards</h4>
                        <Badge className="bg-yellow-100 text-yellow-800">Points</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Earn points with every visit + Exclusive member events
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">Free to join</div>
                        <div className="text-lg font-bold text-primary">$0</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Star className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Special Offer</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          New clients get 25% off their first facial package. Book within 48 hours to claim this offer!
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Group & Event Packages</CardTitle>
                <CardDescription>Perfect for special occasions and celebrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Heart className="w-12 h-12 text-pink-500 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Bridal Party Package</h4>
                    <p className="text-sm text-gray-600 mb-3">Pre-wedding glow treatments for bride and bridesmaids</p>
                    <p className="text-lg font-bold text-primary">From $180/person</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Girls&apos; Day Out</h4>
                    <p className="text-sm text-gray-600 mb-3">Group facials with champagne and light refreshments</p>
                    <p className="text-lg font-bold text-primary">From $150/person</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Corporate Wellness</h4>
                    <p className="text-sm text-gray-600 mb-3">On-site or in-spa treatments for corporate events</p>
                    <p className="text-lg font-bold text-primary">Custom Pricing</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
