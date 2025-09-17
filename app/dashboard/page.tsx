"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Camera,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  Settings,
  Bell,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Bookmark,
  CalendarDays,
  Clock3,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Zap,
  Crown,
  Shield,
  Gift,
  Tag,
  UserPlus
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Appointment {
  id: string
  providerName: string
  providerImage: string
  service: string
  date: string
  time: string
  status: "upcoming" | "completed" | "cancelled"
  price: number
  location: string
  duration: string
}

interface FavoriteProvider {
  id: string
  name: string
  image: string
  rating: number
  reviewCount: number
  specialties: string[]
  location: string
  priceRange: { min: number; max: number }
  isOnline: boolean
  lastVisit: string
}

interface Review {
  id: string
  providerName: string
  providerImage: string
  service: string
  rating: number
  comment: string
  date: string
  helpful: number
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: "1",
    providerName: "Sarah Johnson",
    providerImage: "/professional-female-barber.png",
    service: "Modern Haircut & Styling",
    date: "2024-01-15",
    time: "2:00 PM",
    status: "upcoming",
    price: 65,
    location: "Downtown Los Angeles",
    duration: "45 min",
  },
  {
    id: "2",
    providerName: "Dr. Elena Vasquez",
    providerImage: "/dermatologist.png",
    service: "Botox Treatment",
    date: "2024-01-20",
    time: "10:00 AM",
    status: "upcoming",
    price: 450,
    location: "Beverly Hills",
    duration: "1 hour",
  },
  {
    id: "3",
    providerName: "Marcus Rodriguez",
    providerImage: "/placeholder-9fqp6.png",
    service: "Classic Fade & Beard Trim",
    date: "2024-01-10",
    time: "3:30 PM",
    status: "completed",
    price: 45,
    location: "Hollywood",
    duration: "30 min",
  },
]

const MOCK_FAVORITES: FavoriteProvider[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    image: "/professional-female-barber.png",
    rating: 4.9,
    reviewCount: 156,
    specialties: ["Modern Cuts", "Beard Styling", "Color Treatment"],
    location: "Downtown Los Angeles",
    priceRange: { min: 45, max: 120 },
    isOnline: true,
    lastVisit: "2024-01-10",
  },
  {
    id: "2",
    name: "Dr. Elena Vasquez",
    image: "/dermatologist.png",
    rating: 4.9,
    reviewCount: 89,
    specialties: ["Botox", "Chemical Peels", "Laser Treatments"],
    location: "Beverly Hills",
    priceRange: { min: 200, max: 800 },
    isOnline: false,
    lastVisit: "2024-01-05",
  },
]

const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    providerName: "Sarah Johnson",
    providerImage: "/professional-female-barber.png",
    service: "Modern Haircut & Styling",
    rating: 5,
    comment: "Sarah is absolutely amazing! She really listened to what I wanted and delivered beyond my expectations. The cut is perfect and she's so professional.",
    date: "2024-01-10",
    helpful: 3,
  },
  {
    id: "2",
    providerName: "Marcus Rodriguez",
    providerImage: "/placeholder-9fqp6.png",
    service: "Classic Fade & Beard Trim",
    rating: 4,
    comment: "Great service, very clean fade. Marcus is skilled and the shop is always clean. Will definitely return.",
    date: "2024-01-08",
    helpful: 1,
  },
]

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    setUpcomingAppointments(MOCK_APPOINTMENTS.filter(apt => apt.status === "upcoming"))
    setCompletedAppointments(MOCK_APPOINTMENTS.filter(apt => apt.status === "completed"))
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock3 className="w-4 h-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, Alex!</h1>
              <p className="text-gray-600">Here&apos;s what&apos;s happening with your beauty services</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Upcoming</p>
                      <p className="text-2xl font-bold text-gray-900">{upcomingAppointments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{completedAppointments.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Favorites</p>
                      <p className="text-2xl font-bold text-gray-900">{MOCK_FAVORITES.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{MOCK_REVIEWS.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Next Appointment */}
            {upcomingAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Next Appointment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={upcomingAppointments[0].providerImage} />
                      <AvatarFallback>{upcomingAppointments[0].providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{upcomingAppointments[0].providerName}</h3>
                      <p className="text-gray-600">{upcomingAppointments[0].service}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(upcomingAppointments[0].date).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{upcomingAppointments[0].time}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{upcomingAppointments[0].location}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">${upcomingAppointments[0].price}</p>
                      <p className="text-sm text-gray-600">{upcomingAppointments[0].duration}</p>
                      <Button className="mt-2">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get things done faster</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <Link href="/providers">
                    <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                      <Search className="w-6 h-6" />
                      <span>Find Professionals</span>
                    </Button>
                  </Link>
                  <Link href="/booking">
                    <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                      <Calendar className="w-6 h-6" />
                      <span>Book Appointment</span>
                    </Button>
                  </Link>
                  <Link href="/services/ai-match">
                    <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                      <Sparkles className="w-6 h-6" />
                      <span>AI Service Match</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Appointment completed with Sarah Johnson</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Star className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">You left a 5-star review for Marcus Rodriguez</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Heart className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Added Dr. Elena Vasquez to favorites</p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Appointments</h2>
              <Link href="/booking">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {MOCK_APPOINTMENTS.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={appointment.providerImage} />
                        <AvatarFallback>{appointment.providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{appointment.providerName}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <p className="text-gray-600 mb-2">{appointment.service}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.time}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{appointment.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.duration}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${appointment.price}</p>
                        <div className="flex space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          {appointment.status === "upcoming" && (
                            <>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4 mr-2" />
                                Reschedule
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Favorite Professionals</h2>
              <Link href="/providers">
                <Button variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Discover More
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {MOCK_FAVORITES.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={provider.image} />
                          <AvatarFallback>{provider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        {provider.isOnline && (
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              Online
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{provider.rating}</span>
                            <span className="text-gray-600">({provider.reviewCount})</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {provider.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{provider.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span>${provider.priceRange.min}-${provider.priceRange.max}</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Last visit: {new Date(provider.lastVisit).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Link href={`/booking?provider=${provider.id}`}>
                        <Button className="flex-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Now
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Your Reviews</h2>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Write New Review
              </Button>
            </div>

            <div className="space-y-4">
              {MOCK_REVIEWS.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={review.providerImage} />
                        <AvatarFallback>{review.providerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{review.providerName}</h3>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{review.service}</p>
                        <p className="text-gray-800 mb-3">{review.comment}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {new Date(review.date).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Activity Timeline</h2>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Activity
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Appointment completed</h3>
                      <p className="text-gray-600">Modern Haircut & Styling with Sarah Johnson</p>
                      <p className="text-sm text-gray-500">2 days ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Star className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Review submitted</h3>
                      <p className="text-gray-600">5-star review for Marcus Rodriguez</p>
                      <p className="text-sm text-gray-500">3 days ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Heart className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Added to favorites</h3>
                      <p className="text-gray-600">Dr. Elena Vasquez added to your favorites</p>
                      <p className="text-sm text-gray-500">1 week ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Appointment booked</h3>
                      <p className="text-gray-600">Botox Treatment with Dr. Elena Vasquez</p>
                      <p className="text-sm text-gray-500">1 week ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <UserPlus className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Account created</h3>
                      <p className="text-gray-600">Welcome to Beauty Crafter!</p>
                      <p className="text-sm text-gray-500">2 weeks ago</p>
                    </div>
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