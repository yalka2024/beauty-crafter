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
  Palette, Brush, Scissors, Gem, Star as StarIcon, Flower
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const NAIL_SERVICES = [
  {
    id: 1,
    name: "Classic Manicure",
    description: "Traditional manicure with nail shaping and polish",
    duration: "30-45 min",
    price: "$25-40",
    features: ["Nail shaping", "Cuticle care", "Hand massage", "Polish application"],
    image: "/images/services/classic-manicure.jpg",
    category: "manicure"
  },
  {
    id: 2,
    name: "Gel Manicure",
    description: "Long-lasting gel polish with extended wear",
    duration: "45-60 min",
    price: "$35-55",
    features: ["Gel polish", "UV curing", "2-3 weeks wear", "Chip-resistant"],
    image: "/images/services/gel-manicure.jpg",
    category: "gel"
  },
  {
    id: 3,
    name: "Acrylic Nails",
    description: "Full acrylic nail extensions with custom design",
    duration: "1.5-2 hours",
    price: "$45-80",
    features: ["Nail extensions", "Custom length", "Design options", "Long-lasting"],
    image: "/images/services/acrylic-nails.jpg",
    category: "extensions"
  },
  {
    id: 4,
    name: "Classic Pedicure",
    description: "Relaxing foot care and polish application",
    duration: "45-60 min",
    price: "$35-55",
    features: ["Foot soak", "Callus removal", "Nail care", "Polish application"],
    image: "/images/services/classic-pedicure.jpg",
    category: "pedicure"
  },
  {
    id: 5,
    name: "Gel Pedicure",
    description: "Durable gel polish for toes with extended wear",
    duration: "60-75 min",
    price: "$45-65",
    features: ["Gel polish", "Foot treatment", "3-4 weeks wear", "Moisturizing"],
    image: "/images/services/gel-pedicure.jpg",
    category: "gel"
  },
  {
    id: 6,
    name: "Nail Art & Design",
    description: "Custom nail art and creative designs",
    duration: "30-60 min",
    price: "$15-50",
    features: ["Custom designs", "Stencils", "3D elements", "Unique patterns"],
    image: "/images/services/nail-art.jpg",
    category: "art"
  }
]

const FEATURED_PROVIDERS = [
  {
    id: 1,
    name: "Sophie Martinez",
    specialty: "Nail Art Specialist",
    rating: 4.9,
    reviews: 178,
    experience: "12 years",
    location: "Downtown",
    avatar: "/images/providers/sophie.jpg",
    verified: true,
    online: true
  },
  {
    id: 2,
    name: "Alex Thompson",
    specialty: "Gel & Acrylic Expert",
    rating: 4.8,
    reviews: 134,
    experience: "8 years",
    location: "Westside",
    avatar: "/images/providers/alex.jpg",
    verified: true,
    online: false
  },
  {
    id: 3,
    name: "Isabella Chen",
    specialty: "Luxury Nail Care",
    rating: 4.7,
    reviews: 96,
    experience: "6 years",
    location: "Midtown",
    avatar: "/images/providers/isabella.jpg",
    verified: true,
    online: true
  }
]

const NAIL_CARE_TIPS = [
  {
    title: "Daily Nail Care",
    description: "Essential practices for maintaining healthy nails",
    icon: Brush,
    tips: ["Keep nails clean", "Moisturize cuticles", "Avoid harsh chemicals", "Use gentle files"]
  },
  {
    title: "Polish Maintenance",
    description: "Tips for keeping your polish looking fresh",
    icon: Palette,
    tips: ["Apply base coat", "Use thin layers", "Seal with top coat", "Touch up chips"]
  },
  {
    title: "Nail Health",
    description: "Promote strong and healthy nail growth",
    icon: StarIcon,
    tips: ["Eat protein-rich foods", "Stay hydrated", "Limit acetone use", "Give breaks"]
  }
]

const NAIL_TRENDS = [
  {
    trend: "Minimalist Nails",
    description: "Clean, simple designs with neutral tones",
    icon: Flower,
    features: ["Nude polishes", "Simple lines", "Negative space", "Matte finishes"]
  },
  {
    trend: "Bold Colors",
    description: "Vibrant and eye-catching nail colors",
    icon: Palette,
    features: ["Neon shades", "Metallic finishes", "Bright solids", "Color blocking"]
  },
  {
    trend: "3D Elements",
    description: "Textured and dimensional nail art",
    icon: Gem,
    features: ["Rhinestones", "Textured polish", "3D flowers", "Embossed designs"]
  },
  {
    trend: "French Manicure",
    description: "Classic and timeless nail style",
    icon: StarIcon,
    features: ["Natural base", "White tips", "Clean lines", "Professional look"]
  }
]

export default function NailServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredServices = selectedCategory === "all" 
    ? NAIL_SERVICES 
    : NAIL_SERVICES.filter(service => service.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mr-4">
              <Sparkles className="w-8 h-8 text-pink-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Nail Services
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Express your style with our professional nail services. From classic manicures to 
            stunning nail art, our skilled technicians create beautiful, long-lasting results.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-pink-600 hover:bg-pink-700">
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
          <h2 className="text-3xl font-bold text-center mb-8">Our Nail Services</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="all">All Services</TabsTrigger>
              <TabsTrigger value="manicure">Manicures</TabsTrigger>
              <TabsTrigger value="pedicure">Pedicures</TabsTrigger>
              <TabsTrigger value="gel">Gel Services</TabsTrigger>
              <TabsTrigger value="extensions">Extensions</TabsTrigger>
              <TabsTrigger value="art">Nail Art</TabsTrigger>
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
                        <Badge variant="outline" className="text-pink-600 border-pink-600">
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
                      <Button className="w-full group-hover:bg-pink-600 transition-colors">
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

        {/* Nail Trends */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Latest Nail Trends</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {NAIL_TRENDS.map((trend, index) => (
              <Card key={index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <trend.icon className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{trend.trend}</h3>
                    <p className="text-gray-600 text-sm mb-3">{trend.description}</p>
                    <ul className="space-y-1">
                      {trend.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
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
            <h2 className="text-3xl font-bold">Featured Nail Professionals</h2>
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

        {/* Nail Care Tips */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Nail Care Tips & Education</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {NAIL_CARE_TIPS.map((tip, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <tip.icon className="w-8 h-8 text-pink-600" />
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
          <h2 className="text-3xl font-bold text-center mb-8">Why Choose Our Nail Services?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Skilled Technicians</h3>
              <p className="text-sm text-gray-600">Licensed and experienced nail professionals</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Premium Products</h3>
              <p className="text-sm text-gray-600">High-quality polishes and tools</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Hygienic Environment</h3>
              <p className="text-sm text-gray-600">Clean and sanitized tools</p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold mb-2">Creative Designs</h3>
              <p className="text-sm text-gray-600">Custom nail art and trends</p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12 bg-white rounded-lg border">
          <h2 className="text-3xl font-bold mb-4">Ready for Beautiful Nails?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Book your appointment today and let our talented technicians create the perfect nails for you. 
            From classic to creative, we have the expertise to bring your vision to life.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
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