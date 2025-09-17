"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Scissors, Sparkles, Clock, DollarSign, Star, MapPin, Users, Award, Shield, 
  Heart, Calendar, Phone, MessageCircle, ArrowRight, CheckCircle, Zap, Crown
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const HAIR_SERVICES = [
  {
    id: 1,
    name: "Haircut & Styling",
    description: "Professional haircut with personalized styling consultation",
    duration: "45-60 min",
    price: "$45-85",
    features: ["Consultation included", "Wash & blow dry", "Style recommendations", "Product advice"],
    image: "/images/services/haircut.jpg",
    category: "cutting"
  },
  {
    id: 2,
    name: "Hair Coloring",
    description: "Full color, highlights, or balayage with premium products",
    duration: "2-4 hours",
    price: "$120-300",
    features: ["Color consultation", "Premium products", "Aftercare kit", "Touch-up included"],
    image: "/images/services/coloring.jpg",
    category: "coloring"
  },
  {
    id: 3,
    name: "Hair Treatment",
    description: "Deep conditioning and repair treatments for damaged hair",
    duration: "30-45 min",
    price: "$35-75",
    features: ["Damage assessment", "Custom treatment", "Heat protection", "Long-lasting results"],
    image: "/images/services/treatment.jpg",
    category: "treatment"
  },
  {
    id: 4,
    name: "Hair Extensions",
    description: "Professional hair extensions for length and volume",
    duration: "3-6 hours",
    price: "$300-800",
    features: ["Quality hair", "Professional installation", "Maintenance guide", "Adjustment included"],
    image: "/images/services/extensions.jpg",
    category: "extensions"
  },
  {
    id: 5,
    name: "Hair Styling",
    description: "Special occasion styling and updos",
    duration: "1-2 hours",
    price: "$65-150",
    features: ["Style consultation", "Hair prep", "Accessories included", "Touch-up kit"],
    image: "/images/services/styling.jpg",
    category: "styling"
  },
  {
    id: 6,
    name: "Hair Consultation",
    description: "Personalized hair care and style consultation",
    duration: "30 min",
    price: "$25",
    features: ["Style analysis", "Product recommendations", "Maintenance plan", "Follow-up support"],
    image: "/images/services/consultation.jpg",
    category: "consultation"
  }
]

const FEATURED_PROVIDERS = [
  {
    id: 1,
    name: "Sarah Johnson",
    specialty: "Hair Color Specialist",
    rating: 4.9,
    reviews: 127,
    experience: "8 years",
    location: "Downtown",
    avatar: "/images/providers/sarah.jpg",
    verified: true,
    online: true
  },
  {
    id: 2,
    name: "Michael Chen",
    specialty: "Hair Cutting Expert",
    rating: 4.8,
    reviews: 89,
    experience: "12 years",
    location: "Westside",
    avatar: "/images/providers/michael.jpg",
    verified: true,
    online: false
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    specialty: "Hair Styling Artist",
    rating: 4.7,
    reviews: 156,
    experience: "6 years",
    location: "Midtown",
    avatar: "/images/providers/emma.jpg",
    verified: true,
    online: true
  }
]

const HAIR_TIPS = [
  {
    title: "Daily Hair Care Routine",
    description: "Learn the essential steps for maintaining healthy hair every day",
    icon: Sparkles,
    tips: ["Use sulfate-free shampoo", "Condition from mid-length to ends", "Avoid hot water", "Use heat protection"]
  },
  {
    title: "Choosing the Right Haircut",
    description: "Find the perfect haircut for your face shape and lifestyle",
    icon: Scissors,
    tips: ["Consider face shape", "Think about maintenance", "Factor in lifestyle", "Consult with stylist"]
  },
  {
    title: "Color Maintenance",
    description: "Keep your hair color vibrant and healthy between appointments",
    icon: Crown,
    tips: ["Use color-safe products", "Avoid chlorine", "Limit heat styling", "Regular touch-ups"]
  }
]

export default function HairServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredServices = selectedCategory === "all" 
    ? HAIR_SERVICES 
    : HAIR_SERVICES.filter(service => service.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <Scissors className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Hair Services
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Transform your look with our professional hair services. From cutting-edge cuts to 
            stunning color transformations, our licensed stylists create the perfect style for you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Link href="/booking">
                Book Appointment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Service Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Hair Services</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="cutting">Cutting</TabsTrigger>
              <TabsTrigger value="coloring">Coloring</TabsTrigger>
              <TabsTrigger value="treatment">Treatment</TabsTrigger>
              <TabsTrigger value="extensions">Extensions</TabsTrigger>
              <TabsTrigger value="styling">Styling</TabsTrigger>
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
                        <Badge variant="outline" className="text-purple-600 border-purple-600">
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
                      <Button className="w-full group-hover:bg-purple-600 transition-colors">
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

        {/* Featured Providers */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Featured Hair Professionals</h2>
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

        {/* Hair Care Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Hair Care Tips & Advice</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {HAIR_TIPS.map((tip, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="w-8 h-8 text-purple-600" />
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
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our Hair Services?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Licensed Professionals</h3>
              <p className="text-sm text-gray-600">All our stylists are certified and experienced</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Premium Products</h3>
              <p className="text-sm text-gray-600">We use only high-quality, professional products</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Personalized Service</h3>
              <p className="text-sm text-gray-600">Customized approach for every client</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Latest Techniques</h3>
              <p className="text-sm text-gray-600">Stay current with industry trends</p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 bg-white rounded-lg border">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Hair?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Book your appointment today and experience the difference our professional hair services can make. 
            Our team is ready to help you achieve the look you&apos;ve always wanted.
              Our team is ready to help you achieve the look you&apos;ve always wanted.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
            <Button variant="outline" size="lg">
              <Phone className="w-4 h-4 mr-2" />
              Call for Consultation
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
} 