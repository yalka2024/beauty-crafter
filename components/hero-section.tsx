import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Star, Shield, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Premium Beauty Services
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              At Your Doorstep
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with licensed beauty professionals for exceptional services. 
            From barbers to cosmetic dermatologists, we bring expertise to you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/booking">
              <Button size="lg" className="text-lg px-8 py-6">
                <Calendar className="w-5 h-5 mr-2" />
                Book Now
              </Button>
            </Link>
            <Link href="/providers">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Users className="w-5 h-5 mr-2" />
                Find Providers
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Licensed Professionals</h3>
              <p className="text-gray-600 text-sm">All providers are verified and licensed</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Top Rated</h3>
              <p className="text-gray-600 text-sm">Rated by thousands of satisfied clients</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Easy Booking</h3>
              <p className="text-gray-600 text-sm">Book appointments in minutes</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-purple-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-pink-200 rounded-full opacity-20"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-blue-200 rounded-full opacity-20"></div>
    </section>
  )
}

// CSS for grid pattern
const gridPatternStyle = `
  .bg-grid-pattern {
    background-image: 
      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`

// Add the style to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = gridPatternStyle
  document.head.appendChild(style)
} 