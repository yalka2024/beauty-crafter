import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scissors, Sparkles, Heart, Zap, Palette, Star } from "lucide-react"

const services = [
  {
    id: "barber",
    name: "Barber Services",
    description: "Professional haircuts, beard trims, and grooming services",
    icon: Scissors,
    href: "/services/barber",
    features: ["Haircuts", "Beard Trims", "Shaves", "Styling"],
    price: "From $25"
  },
  {
    id: "nail",
    name: "Nail Technician",
    description: "Manicures, pedicures, and nail art services",
    icon: Sparkles,
    href: "/services/nail-technician",
    features: ["Manicures", "Pedicures", "Nail Art", "Extensions"],
    price: "From $35"
  },
  {
    id: "massage",
    name: "Massage Therapy",
    description: "Relaxing and therapeutic massage services",
    icon: Heart,
    href: "/services/massage-therapist",
    features: ["Swedish", "Deep Tissue", "Hot Stone", "Couples"],
    price: "From $60"
  },
  {
    id: "dermatology",
    name: "Cosmetic Dermatology",
    description: "Professional skin treatments and consultations",
    icon: Zap,
    href: "/services/cosmetic-dermatology",
    features: ["Facials", "Chemical Peels", "Botox", "Consultations"],
    price: "From $100"
  },
  {
    id: "esthetician",
    name: "Esthetician",
    description: "Advanced skincare and beauty treatments",
    icon: Palette,
    href: "/services/esthetician",
    features: ["Facials", "Waxing", "Peels", "Microdermabrasion"],
    price: "From $45"
  },
  {
    id: "hair-stylist",
    name: "Hair Stylist",
    description: "Professional hair styling and treatments",
    icon: Star,
    href: "/services/hair-stylist",
    features: ["Styling", "Color", "Highlights", "Extensions"],
    price: "From $50"
  }
]

export function ServicesShowcase() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Professional Beauty Services
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our curated selection of licensed beauty professionals. 
            Each service is designed to meet your specific needs and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{service.name}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-2xl font-bold text-purple-600 mb-2">{service.price}</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Link href={service.href}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      Learn More
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/services">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              View All Services
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
} 