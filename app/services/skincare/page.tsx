"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sparkles, Clock, DollarSign, Star, MapPin, Users, Award, Shield, 
  Heart, Calendar, Phone, MessageCircle, ArrowRight, CheckCircle, Zap, Crown,
  Droplets, Sun, Moon, Leaf, Target, RefreshCw
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const SKINCARE_SERVICES = [
  {
    id: 1,
    name: "Classic Facial",
    description: "Deep cleansing facial with exfoliation and hydration",
    duration: "60 min",
    price: "$75-120",
    features: ["Deep cleansing", "Gentle exfoliation", "Hydrating mask", "Moisturizer application"],
    image: "/images/services/classic-facial.jpg",
    category: "facial"
  },
  {
    id: 2,
    name: "Anti-Aging Treatment",
    description: "Advanced facial targeting fine lines and wrinkles",
    duration: "90 min",
    price: "$150-250",
    features: ["Collagen boost", "Peptide therapy", "Lifting techniques", "Long-term results"],
    image: "/images/services/anti-aging.jpg",
    category: "anti-aging"
  },
  {
    id: 3,
    name: "Acne Treatment",
    description: "Specialized facial for acne-prone and problematic skin",
    duration: "75 min",
    price: "$100-180",
    features: ["Acne analysis", "Deep extraction", "Anti-inflammatory", "Healing mask"],
    image: "/images/services/acne-treatment.jpg",
    category: "treatment"
  },
  {
    id: 4,
    name: "Hydrating Facial",
    description: "Intensive moisture treatment for dry and dehydrated skin",
    duration: "60 min",
    price: "$85-140",
    features: ["Moisture assessment", "Hydrating serums", "Moisture mask", "Lock-in cream"],
    image: "/images/services/hydrating.jpg",
    category: "hydration"
  },
  {
    id: 5,
    name: "Brightening Treatment",
    description: "Glow-enhancing facial for dull and uneven skin tone",
    duration: "75 min",
    price: "$95-160",
    features: ["Brightening agents", "Vitamin C therapy", "Evening treatment", "Glow boost"],
    image: "/images/services/brightening.jpg",
    category: "brightening"
  },
  {
    id: 6,
    name: "Sensitive Skin Care",
    description: "Gentle facial designed for reactive and sensitive skin",
    duration: "60 min",
    price: "$80-130",
    features: ["Gentle cleansing", "Calming agents", "Barrier repair", "Soothing finish"],
    image: "/images/services/sensitive.jpg",
    category: "sensitive"
  }
]

const FEATURED_PROVIDERS = [
  {
    id: 1,
    name: "Dr. Lisa Park",
    specialty: "Dermatologist & Skincare Specialist",
    rating: 4.9,
    reviews: 203,
    experience: "15 years",
    location: "Downtown",
    avatar: "/images/providers/lisa.jpg",
    verified: true,
    online: true
  },
  {
    id: 2,
    name: "Maria Santos",
    specialty: "Licensed Esthetician",
    rating: 4.8,
    reviews: 156,
    experience: "10 years",
    location: "Westside",
    avatar: "/images/providers/maria.jpg",
    verified: true,
    online: false
  },
  {
    id: 3,
    name: "Jennifer Kim",
    specialty: "Skincare Consultant",
    rating: 4.7,
    reviews: 89,
    experience: "7 years",
    location: "Midtown",
    avatar: "/images/providers/jennifer.jpg",
    verified: true,
    online: true
  }
]

const SKINCARE_TIPS = [
  {
    title: "Daily Skincare Routine",
    description: "Build a consistent morning and evening skincare routine",
    icon: RefreshCw,
    tips: ["Cleanse twice daily", "Use sunscreen every day", "Moisturize regularly", "Don't skip toner"]
  },
  {
    title: "Product Layering",
    description: "Learn the correct order to apply your skincare products",
    icon: Droplets,
    tips: ["Thinnest to thickest", "Water-based first", "Wait between layers", "Sunscreen last"]
  },
  {
    title: "Skin Type Identification",
    description: "Understand your skin type for better product selection",
    icon: Target,
    tips: ["Observe oil production", "Check sensitivity", "Assess pore size", "Consider concerns"]
  }
]

const SKIN_CONCERNS = [
  {
    concern: "Acne & Breakouts",
    solutions: ["Chemical exfoliation", "Anti-inflammatory treatments", "Regular facials", "Product education"],
    icon: Target
  },
  {
    concern: "Aging & Wrinkles",
    solutions: ["Collagen stimulation", "Peptide therapy", "Sun protection", "Retinol treatments"],
    icon: Crown
  },
  {
    concern: "Hyperpigmentation",
    solutions: ["Brightening agents", "Chemical peels", "Sun protection", "Evening treatments"],
    icon: Sun
  },
  {
    concern: "Dryness & Dehydration",
    solutions: ["Hydrating facials", "Moisture barriers", "Gentle cleansing", "Rich moisturizers"],
    icon: Droplets
  }
]

export default function SkincareServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredServices = selectedCategory === "all" 
    ? SKINCARE_SERVICES 
    : SKINCARE_SERVICES.filter(service => service.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Skincare Services
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Reveal your natural radiance with our advanced skincare treatments. Our licensed professionals 
            use cutting-edge techniques and premium products to address your unique skin concerns.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/booking">
                Book Consultation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Schedule Call
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Service Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Skincare Services</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-8">
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="facial">Facials</TabsTrigger>
              <TabsTrigger value="anti-aging">Anti-Aging</TabsTrigger>
              <TabsTrigger value="treatment">Treatments</TabsTrigger>
              <TabsTrigger value="hydration">Hydration</TabsTrigger>
              <TabsTrigger value="brightening">Brightening</TabsTrigger>
              <TabsTrigger value="sensitive">Sensitive</TabsTrigger>
            </TabsList>
            
            <TabsContent value={selectedCategory} className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-white/90 text-gray-900">
                          {service.duration}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl">{service.name}</CardTitle>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {service.price}
                        </Badge>
                      </div>
                      <CardDescription className="text-gray-600">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full group-hover:bg-blue-600 transition-colors">
                        Book Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Skin Concerns & Solutions */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Common Skin Concerns & Solutions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {SKIN_CONCERNS.map((item, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-3">{item.concern}</h3>
                    <ul className="space-y-2">
                      {item.solutions.map((solution, solutionIndex) => (
                        <li key={solutionIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {solution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Providers */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Skincare Professionals</h2>
            <Button variant="outline" asChild>
              <Link href="/providers">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_PROVIDERS.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="relative mx-auto mb-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={provider.avatar} />
                      <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {provider.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                    {provider.verified && (
                      <Shield className="w-4 h-4 text-blue-600 ml-2" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{provider.specialty}</p>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{provider.rating}</span>
                    <span className="text-gray-500 text-sm ml-1">({provider.reviews} reviews)</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {provider.experience} experience
                    </div>
                    <div className="flex items-center justify-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {provider.location}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skincare Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Skincare Tips & Education</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {SKINCARE_TIPS.map((tip, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{tip.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {tip.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-left">
                    {tip.tips.map((tipText, tipIndex) => (
                      <li key={tipIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {tipText}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our Skincare Services?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Expert Professionals</h3>
              <p className="text-sm text-gray-600">Licensed estheticians and dermatologists</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Premium Products</h3>
              <p className="text-sm text-gray-600">Medical-grade and luxury skincare brands</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Care</h3>
              <p className="text-sm text-gray-600">Customized treatments for your skin</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Advanced Technology</h3>
              <p className="text-sm text-gray-600">Latest skincare innovations</p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 bg-white rounded-lg border">
          <h2 className="text-3xl font-bold mb-4">Ready for Radiant Skin?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your skincare journey today with a personalized consultation. Our experts will assess 
            your skin and recommend the perfect treatments for your unique needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="w-4 h-4 mr-2" />
              Book Consultation
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Schedule Call
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
} 