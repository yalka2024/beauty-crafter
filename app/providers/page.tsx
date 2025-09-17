"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Filter,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Shield,
  Award,
  Users,
  Calendar,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  Camera,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Provider {
  id: string
  name: string
  rating: number
  reviewCount: number
  image: string
  specialties: string[]
  location: string
  distance: number
  priceRange: { min: number; max: number }
  availability: string
  experience: string
  completedServices: number
  badges: string[]
  portfolio: string[]
  isVerified: boolean
  isOnline: boolean
  responseTime: string
  languages: string[]
  certifications: string[]
}

const MOCK_PROVIDERS: Provider[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    rating: 4.9,
    reviewCount: 156,
    image: "/professional-female-barber.png",
    specialties: ["Modern Cuts", "Beard Styling", "Color Treatment"],
    location: "Downtown Los Angeles",
    distance: 2.3,
    priceRange: { min: 45, max: 120 },
    availability: "Today 2:00 PM",
    experience: "8 years",
    completedServices: 1247,
    badges: ["State Verified", "Eco-Friendly", "COVID-Safe"],
    portfolio: ["/haircut1.png", "/haircut2.png"],
    isVerified: true,
    isOnline: true,
    responseTime: "< 1 hour",
    languages: ["English", "Spanish"],
    certifications: ["CA Barber License", "COVID Safety Certified"],
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    rating: 4.8,
    reviewCount: 203,
    image: "/placeholder-9fqp6.png",
    specialties: ["Classic Cuts", "Fade Specialist", "Hot Towel Shaves"],
    location: "Hollywood",
    distance: 3.1,
    priceRange: { min: 35, max: 85 },
    availability: "Tomorrow 10:00 AM",
    experience: "12 years",
    completedServices: 2156,
    badges: ["State Verified", "Master Barber", "Quick Service"],
    portfolio: ["/abstract-fade.png", "/fade2.png"],
    isVerified: true,
    isOnline: false,
    responseTime: "< 2 hours",
    languages: ["English"],
    certifications: ["CA Barber License", "Advanced Fade Techniques"],
  },
  {
    id: "3",
    name: "Dr. Elena Vasquez",
    rating: 4.9,
    reviewCount: 89,
    image: "/dermatologist.png",
    specialties: ["Botox", "Chemical Peels", "Laser Treatments"],
    location: "Beverly Hills",
    distance: 5.2,
    priceRange: { min: 200, max: 800 },
    availability: "Next Week",
    experience: "15 years",
    completedServices: 892,
    badges: ["Board Certified", "Medical License", "Luxury Service"],
    portfolio: ["/botox-cosmetic-injection.png", "/serene-woman-portrait.png"],
    isVerified: true,
    isOnline: true,
    responseTime: "< 4 hours",
    languages: ["English", "Spanish", "French"],
    certifications: ["Board Certified Dermatologist", "Laser Safety Certified"],
  },
  {
    id: "4",
    name: "Aisha Patel",
    rating: 4.7,
    reviewCount: 134,
    image: "/placeholder-user.jpg",
    specialties: ["Nail Art", "Gel Extensions", "Pedicures"],
    location: "Santa Monica",
    distance: 4.8,
    priceRange: { min: 35, max: 120 },
    availability: "Today 4:00 PM",
    experience: "6 years",
    completedServices: 892,
    badges: ["State Verified", "Nail Art Specialist", "Hygiene Expert"],
    portfolio: ["/placeholder.svg", "/placeholder.svg"],
    isVerified: true,
    isOnline: true,
    responseTime: "< 1 hour",
    languages: ["English", "Hindi"],
    certifications: ["CA Nail Technician License", "Hygiene Certification"],
  },
]

const SERVICE_CATEGORIES = [
  { id: "all", label: "All Services", icon: "🌟" },
  { id: "barber", label: "Barber Services", icon: "✂️" },
  { id: "nails", label: "Nail Services", icon: "💅" },
  { id: "massage", label: "Massage Therapy", icon: "💆" },
  { id: "facial", label: "Facial & Skincare", icon: "🧴" },
  { id: "dermatology", label: "Cosmetic Dermatology", icon: "💉" },
  { id: "spa", label: "Spa Treatments", icon: "🌿" },
]

const LOCATIONS = [
  "Downtown Los Angeles",
  "Hollywood",
  "Beverly Hills",
  "Santa Monica",
  "Venice Beach",
  "West Hollywood",
  "Culver City",
  "Marina del Rey",
]

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [maxDistance, setMaxDistance] = useState(25)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [availabilityFilter, setAvailabilityFilter] = useState("")
  const [sortBy, setSortBy] = useState("relevance")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    verifiedOnly: true,
    onlineOnly: false,
    quickResponse: false,
    ecoFriendly: false,
    covidSafe: false,
  })

  const [filteredProviders, setFilteredProviders] = useState(MOCK_PROVIDERS)

  useEffect(() => {
    let filtered = MOCK_PROVIDERS

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(
        (provider) =>
          provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          provider.specialties.some((specialty) =>
            specialty.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          provider.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((provider) =>
        provider.specialties.some((specialty) =>
          specialty.toLowerCase().includes(selectedCategory)
        )
      )
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((provider) =>
        provider.location.includes(selectedLocation)
      )
    }

    // Price range filter
    filtered = filtered.filter(
      (provider) =>
        provider.priceRange.min >= priceRange[0] &&
        provider.priceRange.max <= priceRange[1]
    )

    // Distance filter
    filtered = filtered.filter((provider) => provider.distance <= maxDistance)

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter((provider) => provider.rating >= ratingFilter)
    }

    // Availability filter
    if (availabilityFilter) {
      filtered = filtered.filter((provider) =>
        provider.availability.toLowerCase().includes(availabilityFilter.toLowerCase())
      )
    }

    // Additional filters
    if (filters.verifiedOnly) {
      filtered = filtered.filter((provider) => provider.isVerified)
    }

    if (filters.onlineOnly) {
      filtered = filtered.filter((provider) => provider.isOnline)
    }

    if (filters.quickResponse) {
      filtered = filtered.filter((provider) =>
        provider.responseTime.includes("< 1 hour")
      )
    }

    if (filters.ecoFriendly) {
      filtered = filtered.filter((provider) =>
        provider.badges.some((badge) => badge.includes("Eco-Friendly"))
      )
    }

    if (filters.covidSafe) {
      filtered = filtered.filter((provider) =>
        provider.badges.some((badge) => badge.includes("COVID-Safe"))
      )
    }

    // Sorting
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "distance":
        filtered.sort((a, b) => a.distance - b.distance)
        break
      case "price-low":
        filtered.sort((a, b) => a.priceRange.min - b.priceRange.min)
        break
      case "price-high":
        filtered.sort((a, b) => b.priceRange.max - a.priceRange.max)
        break
      case "experience":
        filtered.sort((a, b) => parseInt(b.experience) - parseInt(a.experience))
        break
      default:
        // Relevance - keep original order for now
        break
    }

    setFilteredProviders(filtered)
  }, [
    searchQuery,
    selectedCategory,
    selectedLocation,
    priceRange,
    maxDistance,
    ratingFilter,
    availabilityFilter,
    sortBy,
    filters,
  ])

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 4.0) return "text-blue-600"
    if (rating >= 3.5) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find Your Perfect Beauty Professional
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover licensed, verified beauty professionals in your area. 
              Book appointments, read reviews, and get the service you deserve.
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Name, specialty, location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Service Category */}
                <div className="space-y-2">
                  <Label>Service Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="mr-2">{category.icon}</span>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All locations</SelectItem>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Distance */}
                <div className="space-y-2">
                  <Label>Max Distance: {maxDistance} miles</Label>
                  <Slider
                    value={[maxDistance]}
                    onValueChange={(value) => setMaxDistance(value[0])}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+ stars</SelectItem>
                      <SelectItem value="4.0">4.0+ stars</SelectItem>
                      <SelectItem value="3.5">3.5+ stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any time</SelectItem>
                      <SelectItem value="today">Available today</SelectItem>
                      <SelectItem value="tomorrow">Available tomorrow</SelectItem>
                      <SelectItem value="this week">This week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Filters */}
                <div className="space-y-3">
                  <Label>Additional Filters</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="verified"
                        checked={filters.verifiedOnly}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, verifiedOnly: !!checked }))
                        }
                      />
                      <Label htmlFor="verified" className="text-sm">Verified only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="online"
                        checked={filters.onlineOnly}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, onlineOnly: !!checked }))
                        }
                      />
                      <Label htmlFor="online" className="text-sm">Online now</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="quick-response"
                        checked={filters.quickResponse}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, quickResponse: !!checked }))
                        }
                      />
                      <Label htmlFor="quick-response" className="text-sm">Quick response</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="eco-friendly"
                        checked={filters.ecoFriendly}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, ecoFriendly: !!checked }))
                        }
                      />
                      <Label htmlFor="eco-friendly" className="text-sm">Eco-friendly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="covid-safe"
                        checked={filters.covidSafe}
                        onCheckedChange={(checked) =>
                          setFilters((prev) => ({ ...prev, covidSafe: !!checked }))
                        }
                      />
                      <Label htmlFor="covid-safe" className="text-sm">COVID-safe</Label>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("all")
                    setSelectedLocation("")
                    setPriceRange([0, 500])
                    setMaxDistance(25)
                    setRatingFilter(0)
                    setAvailabilityFilter("")
                    setFilters({
                      verifiedOnly: true,
                      onlineOnly: false,
                      quickResponse: false,
                      ecoFriendly: false,
                      covidSafe: false,
                    })
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredProviders.length} Professional{filteredProviders.length !== 1 ? "s" : ""} Found
                </h2>
                <p className="text-gray-600">
                  Showing results for your search criteria
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="distance">Nearest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <div className="w-4 h-4 flex flex-col gap-0.5">
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                      <div className="w-full h-0.5 bg-current rounded-sm"></div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            {filteredProviders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No professionals found</h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search criteria
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                      setSelectedLocation("")
                      setPriceRange([0, 500])
                      setMaxDistance(25)
                      setRatingFilter(0)
                      setAvailabilityFilter("")
                      setFilters({
                        verifiedOnly: true,
                        onlineOnly: false,
                        quickResponse: false,
                        ecoFriendly: false,
                        covidSafe: false,
                      })
                    }}
                  >
                    Reset Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-6"}>
                {filteredProviders.map((provider) => (
                  <Card key={provider.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className={viewMode === "grid" ? "space-y-4" : "flex items-start space-x-6"}>
                        {/* Provider Image */}
                        <div className="relative">
                          <Image
                            src={provider.image || "/placeholder.svg"}
                            alt={provider.name}
                            width={viewMode === "grid" ? 120 : 100}
                            height={viewMode === "grid" ? 120 : 100}
                            className="rounded-full"
                          />
                          {provider.isOnline && (
                            <div className="absolute -top-1 -right-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                                Online
                              </Badge>
                            </div>
                          )}
                          {provider.isVerified && (
                            <div className="absolute -bottom-1 -right-1">
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Provider Info */}
                        <div className={`flex-1 space-y-4 ${viewMode === "grid" ? "" : "min-w-0"}`}>
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
                              <div className="flex items-center space-x-1">
                                <Star className={`w-4 h-4 fill-yellow-400 text-yellow-400 ${getRatingColor(provider.rating)}`} />
                                <span className={`font-medium ${getRatingColor(provider.rating)}`}>
                                  {provider.rating}
                                </span>
                                <span className="text-gray-600">({provider.reviewCount})</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {provider.badges.slice(0, 3).map((badge) => (
                                <Badge key={badge} variant="outline" className="text-xs">
                                  {badge}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {provider.specialties.slice(0, 3).map((specialty) => (
                                <Badge key={specialty} className="bg-primary/10 text-primary">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className={`grid ${viewMode === "grid" ? "grid-cols-2" : "grid-cols-4"} gap-4 text-sm`}>
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-600" />
                              <span>{provider.distance} miles away</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-4 h-4 text-gray-600" />
                              <span>${provider.priceRange.min}-${provider.priceRange.max}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span>{provider.availability}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Award className="w-4 h-4 text-gray-600" />
                              <span>{provider.experience} exp</span>
                            </div>
                          </div>

                          {/* Portfolio Preview */}
                          {viewMode === "grid" && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Recent Work</Label>
                              <div className="flex space-x-2">
                                {provider.portfolio.slice(0, 3).map((image, index) => (
                                  <Image
                                    key={index}
                                    src={image || "/placeholder.svg"}
                                    alt={`Portfolio ${index + 1}`}
                                    width={60}
                                    height={60}
                                    className="rounded-lg object-cover"
                                  />
                                ))}
                                <Button variant="outline" size="sm" className="h-15 w-15 bg-transparent">
                                  <Camera className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2">
                          <Link href={`/booking?provider=${provider.id}`}>
                            <Button className="bg-green-600 hover:bg-green-700 w-full">
                              Book Now
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Heart className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Link href={`/providers/${provider.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredProviders.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  Load More Professionals
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 