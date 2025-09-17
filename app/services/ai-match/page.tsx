"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Camera,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Users,
  Award,
  Shield,
} from "lucide-react"
import Image from "next/image"

const MOCK_PREFERENCES = {
  serviceType: "haircut",
  style: "modern",
  budget: [50, 100],
  distance: 10,
  timePreference: "afternoon",
  experienceLevel: "expert",
  specialRequests: ["eco-friendly", "quick-service"],
}

const MOCK_MATCHES = [
  {
    id: "1",
    name: "Sarah Johnson",
    rating: 4.9,
    reviewCount: 156,
    image: "/professional-female-barber.png",
    specialties: ["Modern Cuts", "Beard Styling", "Color Treatment"],
    distance: 2.3,
    price: 65,
    availability: "Today 2:00 PM",
    matchScore: 98,
    badges: ["State Verified", "Eco-Friendly", "COVID-Safe"],
    portfolio: ["/haircut1.png", "/haircut2.png"],
    experience: "8 years",
    completedServices: 1247,
  },
  {
    id: "2",
    name: "Marcus Rodriguez",
    rating: 4.8,
    reviewCount: 203,
    image: "/placeholder-9fqp6.png",
    specialties: ["Classic Cuts", "Fade Specialist", "Hot Towel Shaves"],
    distance: 3.1,
    price: 55,
    availability: "Tomorrow 10:00 AM",
    matchScore: 94,
    badges: ["State Verified", "Master Barber", "Quick Service"],
    portfolio: ["/abstract-fade.png", "/fade2.png"],
    experience: "12 years",
    completedServices: 2156,
  },
  {
    id: "3",
    name: "Dr. Elena Vasquez",
    rating: 4.9,
    reviewCount: 89,
    image: "/dermatologist.png",
    specialties: ["Botox", "Chemical Peels", "Laser Treatments"],
    distance: 5.2,
    price: 250,
    availability: "Next Week",
    matchScore: 91,
    badges: ["Board Certified", "Medical License", "Luxury Service"],
    portfolio: ["/botox-cosmetic-injection.png", "/serene-woman-portrait.png"],
    experience: "15 years",
    completedServices: 892,
  },
]

const SERVICE_CATEGORIES = [
  { id: "haircut", label: "Haircuts & Styling", icon: "✂️" },
  { id: "nails", label: "Nail Services", icon: "💅" },
  { id: "massage", label: "Massage Therapy", icon: "💆" },
  { id: "facial", label: "Facial & Skincare", icon: "🧴" },
  { id: "dermatology", label: "Cosmetic Dermatology", icon: "💉" },
  { id: "spa", label: "Spa Treatments", icon: "🌿" },
]

const STYLE_PREFERENCES = {
  haircut: ["Modern", "Classic", "Trendy", "Conservative", "Edgy", "Natural"],
  nails: ["French", "Gel", "Acrylic", "Natural", "Artistic", "Simple"],
  massage: ["Relaxing", "Therapeutic", "Deep Tissue", "Hot Stone", "Prenatal", "Sports"],
  facial: ["Anti-Aging", "Hydrating", "Acne Treatment", "Brightening", "Sensitive Skin", "Luxury"],
  dermatology: ["Botox", "Fillers", "Chemical Peels", "Laser", "Microneedling", "Consultation"],
  spa: ["Full Body", "Couples", "Detox", "Aromatherapy", "Hot Springs", "Wellness"],
}

export default function AIMatchPage() {
  const [preferences, setPreferences] = useState(MOCK_PREFERENCES)
  const [activeTab, setActiveTab] = useState("preferences")
  const [showARPreview, setShowARPreview] = useState(false)

  const updatePreference = (key: string, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const getMatchScoreColor = (score: number) => {
    if (score >= 95) return "text-green-600"
    if (score >= 90) return "text-blue-600"
    if (score >= 85) return "text-yellow-600"
    return "text-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">AI Smart Match</h1>
                <p className="text-sm text-gray-600">Find your perfect beauty professional with AI-powered matching</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Sparkles className="w-4 h-4 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="preferences">Set Preferences</TabsTrigger>
            <TabsTrigger value="matches">AI Matches</TabsTrigger>
            <TabsTrigger value="ar-preview">AR Style Preview</TabsTrigger>
            <TabsTrigger value="insights">Match Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Preferences Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-6 h-6 text-primary" />
                      <span>Service Preferences</span>
                    </CardTitle>
                    <CardDescription>Tell us what you&apos;re looking for</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-base font-medium">Service Category</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SERVICE_CATEGORIES.map((category) => (
                          <Card
                            key={category.id}
                            className={`cursor-pointer transition-all ${
                              preferences.serviceType === category.id
                                ? "ring-2 ring-primary bg-primary/5"
                                : "hover:shadow-md"
                            }`}
                            onClick={() => updatePreference("serviceType", category.id)}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="text-2xl mb-2">{category.icon}</div>
                              <p className="text-sm font-medium">{category.label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Style Preference</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {STYLE_PREFERENCES[preferences.serviceType as keyof typeof STYLE_PREFERENCES]?.map((style) => (
                          <Button
                            key={style}
                            variant={preferences.style === style.toLowerCase() ? "default" : "outline"}
                            className="justify-center"
                            onClick={() => updatePreference("style", style.toLowerCase())}
                          >
                            {style}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">
                        Budget Range: ${preferences.budget[0]} - ${preferences.budget[1]}
                      </Label>
                      <Slider
                        value={preferences.budget}
                        onValueChange={(value) => updatePreference("budget", value)}
                        max={500}
                        min={20}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Maximum Distance</Label>
                        <Select
                          value={preferences.distance.toString()}
                          onValueChange={(value) => updatePreference("distance", Number.parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 miles</SelectItem>
                            <SelectItem value="10">10 miles</SelectItem>
                            <SelectItem value="15">15 miles</SelectItem>
                            <SelectItem value="25">25 miles</SelectItem>
                            <SelectItem value="50">50+ miles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Preference</Label>
                        <Select
                          value={preferences.timePreference}
                          onValueChange={(value) => updatePreference("timePreference", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning (9AM-12PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                            <SelectItem value="evening">Evening (5PM-8PM)</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Experience Level</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["beginner", "experienced", "expert"].map((level) => (
                          <Button
                            key={level}
                            variant={preferences.experienceLevel === level ? "default" : "outline"}
                            className="justify-center capitalize"
                            onClick={() => updatePreference("experienceLevel", level)}
                          >
                            {level}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Special Requirements</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          "eco-friendly",
                          "quick-service",
                          "luxury-experience",
                          "covid-safe",
                          "wheelchair-accessible",
                          "pet-friendly",
                        ].map((req) => (
                          <div key={req} className="flex items-center space-x-2">
                            <Switch
                              checked={preferences.specialRequests.includes(req)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  updatePreference("specialRequests", [...preferences.specialRequests, req])
                                } else {
                                  updatePreference(
                                    "specialRequests",
                                    preferences.specialRequests.filter((r) => r !== req),
                                  )
                                }
                              }}
                            />
                            <Label className="capitalize text-sm">{req.replace("-", " ")}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>AI Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <strong>Trend Alert:</strong> Modern cuts with eco-friendly products are 23% more popular this
                        month.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Best Match:</strong> Based on your preferences, we found 12 highly compatible
                        professionals.
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Price Optimization:</strong> Your budget range offers excellent value with top-rated
                        professionals.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Match Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Available Professionals</span>
                      <span className="font-semibold">47</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">High Match Score (90+)</span>
                      <span className="font-semibold text-green-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Available Today</span>
                      <span className="font-semibold text-blue-600">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Within Budget</span>
                      <span className="font-semibold text-purple-600">35</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your AI Matches</h2>
                <p className="text-gray-600">Ranked by compatibility with your preferences</p>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Zap className="w-4 h-4 mr-2" />
                Refine Matches
              </Button>
            </div>

            <div className="space-y-6">
              {MOCK_MATCHES.map((match) => (
                <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Provider Image */}
                      <div className="relative">
                        <Image
                          src={match.image || "/placeholder.svg"}
                          alt={match.name}
                          width={120}
                          height={120}
                          className="rounded-full"
                        />
                        <div className="absolute -top-2 -right-2">
                          <Badge className={`${getMatchScoreColor(match.matchScore)} bg-white border-2`}>
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                      </div>

                      {/* Provider Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold">{match.name}</h3>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{match.rating}</span>
                              <span className="text-gray-600">({match.reviewCount})</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {match.badges.map((badge) => (
                              <Badge key={badge} variant="outline" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                {badge}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {match.specialties.map((specialty) => (
                              <Badge key={specialty} className="bg-primary/10 text-primary">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <span>{match.distance} miles away</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-600" />
                            <span>From ${match.price}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span>{match.availability}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-gray-600" />
                            <span>{match.experience} experience</span>
                          </div>
                        </div>

                        {/* Portfolio Preview */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Recent Work</Label>
                          <div className="flex space-x-2">
                            {match.portfolio.map((image, index) => (
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
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2">
                        <Button className="bg-green-600 hover:bg-green-700">Book Now</Button>
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline">View Profile</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ar-preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="w-6 h-6 text-primary" />
                  <span>AR Style Preview</span>
                </CardTitle>
                <CardDescription>Try on different styles using augmented reality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* AR Camera View */}
                  <div className="space-y-4">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      {showARPreview ? (
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">AR Camera Active</p>
                          <p className="text-sm text-gray-500">Move your head to see different angles</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">Click &quot;Start AR Preview&quot; to begin</p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShowARPreview(!showARPreview)}
                        className="flex-1"
                        variant={showARPreview ? "destructive" : "default"}
                      >
                        {showARPreview ? "Stop AR Preview" : "Start AR Preview"}
                      </Button>
                      <Button variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  </div>

                  {/* Style Options */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Try Different Styles</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: "Modern Fade", image: "/fade.png" },
                          { name: "Classic Cut", image: "/classic-still-life.png" },
                          { name: "Textured Crop", image: "/textured-surface.png" },
                          { name: "Long Layers", image: "/geological-layers.png" },
                        ].map((style) => (
                          <Card key={style.name} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3 text-center">
                              <Image
                                src={style.image || "/placeholder.svg"}
                                alt={style.name}
                                width={60}
                                height={60}
                                className="rounded-lg mx-auto mb-2"
                              />
                              <p className="text-sm font-medium">{style.name}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Color Options</Label>
                      <div className="flex space-x-2">
                        {["Natural", "Blonde", "Brown", "Black", "Red", "Gray"].map((color) => (
                          <Button key={color} variant="outline" size="sm">
                            {color}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">AI Style Recommendations</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Based on your face shape and preferences, we recommend the &quot;Modern Fade&quot; or &quot;Textured Crop&quot;
                            styles.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <span>Match Analysis</span>
                  </CardTitle>
                  <CardDescription>How we calculated your matches</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Style Compatibility</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "95%" }}></div>
                        </div>
                        <span className="text-sm font-medium">95%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Location Preference</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "88%" }}></div>
                        </div>
                        <span className="text-sm font-medium">88%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Budget Alignment</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: "92%" }}></div>
                        </div>
                        <span className="text-sm font-medium">92%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Availability Match</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                        </div>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Experience Level</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                        </div>
                        <span className="text-sm font-medium">96%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center space-x-3">
                      <Brain className="w-6 h-6 text-purple-600" />
                      <div>
                        <h4 className="font-medium text-purple-900">AI Confidence Score</h4>
                        <p className="text-2xl font-bold text-purple-600">94%</p>
                        <p className="text-sm text-purple-700">High confidence in match quality</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-6 h-6 text-primary" />
                    <span>Community Insights</span>
                  </CardTitle>
                  <CardDescription>What similar users are booking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-900">Popular This Week</p>
                      <p className="text-sm text-green-700">
                        Users with similar preferences are booking &quot;Modern Fade&quot; cuts 40% more than last week.
                      </p>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Trending Services</p>
                      <p className="text-sm text-blue-700">
                        Eco-friendly hair treatments are up 65% among users in your area.
                      </p>
                    </div>

                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-medium text-orange-900">Price Trends</p>
                      <p className="text-sm text-orange-700">
                        Average booking price in your budget range: $72 (↑8% from last month)
                      </p>
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-medium text-purple-900">Satisfaction Rate</p>
                      <p className="text-sm text-purple-700">
                        96% of users with similar preferences rated their experience 4+ stars.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personalization Learning</CardTitle>
                <CardDescription>How our AI improves your matches over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Brain className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-medium mb-2">Learning Phase</h4>
                    <p className="text-sm text-gray-600">
                      AI analyzes your booking patterns, preferences, and feedback to understand your style.
                    </p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-medium mb-2">Optimization</h4>
                    <p className="text-sm text-gray-600">
                      Match algorithms continuously improve based on your satisfaction scores and rebooking behavior.
                    </p>
                  </div>

                  <div className="text-center p-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h4 className="font-medium mb-2">Personalization</h4>
                    <p className="text-sm text-gray-600">
                      Receive increasingly accurate recommendations tailored to your unique preferences and lifestyle.
                    </p>
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
