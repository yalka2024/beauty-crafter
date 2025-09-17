"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  DollarSign,
  Users,
  Star,
  Clock,
  MapPin,
  Scissors,
  Settings,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
} from "lucide-react"
import Link from "next/link"

interface ProviderStats {
  totalBookings: number
  completedServices: number
  totalEarnings: number
  averageRating: number
  pendingBookings: number
  thisMonthEarnings: number
}

interface Booking {
  id: string
  clientName: string
  serviceName: string
  scheduledDate: string
  startTime: string
  endTime: string
  status: string
  amount: number
  location: string
}

interface Service {
  id: string
  name: string
  category: string
  price: number
  duration: number
  isActive: boolean
  totalBookings: number
}

interface ComplianceItem {
  id: string
  type: string
  status: string
  expiryDate?: string
  message: string
  severity: string
}

const MOCK_PROVIDER_STATS: ProviderStats = {
  totalBookings: 156,
  completedServices: 142,
  totalEarnings: 12450.75,
  averageRating: 4.8,
  pendingBookings: 8,
  thisMonthEarnings: 2150.50
}

const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    clientName: "Sarah Johnson",
    serviceName: "Men's Haircut",
    scheduledDate: "2024-01-15",
    startTime: "10:00",
    endTime: "11:00",
    status: "confirmed",
    amount: 45.00,
    location: "home"
  },
  {
    id: "2",
    clientName: "Mike Rodriguez",
    serviceName: "Beard Trim",
    scheduledDate: "2024-01-15",
    startTime: "14:00",
    endTime: "14:30",
    status: "pending",
    amount: 25.00,
    location: "salon"
  },
  {
    id: "3",
    clientName: "Emily Chen",
    serviceName: "Full Grooming",
    scheduledDate: "2024-01-16",
    startTime: "09:00",
    endTime: "10:30",
    status: "completed",
    amount: 65.00,
    location: "home"
  }
]

const MOCK_SERVICES: Service[] = [
  {
    id: "1",
    name: "Men's Haircut",
    category: "Hair",
    price: 45.00,
    duration: 60,
    isActive: true,
    totalBookings: 89
  },
  {
    id: "2",
    name: "Beard Trim",
    category: "Beard",
    price: 25.00,
    duration: 30,
    isActive: true,
    totalBookings: 67
  },
  {
    id: "3",
    name: "Full Grooming",
    category: "Complete",
    price: 65.00,
    duration: 90,
    isActive: true,
    totalBookings: 34
  }
]

const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: "1",
    type: "License",
    status: "active",
    expiryDate: "2025-06-15",
    message: "License is active and valid",
    severity: "low"
  },
  {
    id: "2",
    type: "Insurance",
    status: "expiring",
    expiryDate: "2024-03-20",
    message: "Insurance expires in 2 months",
    severity: "medium"
  },
  {
    id: "3",
    type: "Background Check",
    status: "pending",
    message: "Background check in progress",
    severity: "high"
  }
]

export default function ProviderDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <ProviderDashboardContent />
    </Suspense>
  )
}

export const dynamic = 'force-dynamic'

function ProviderDashboardContent() {
  const [isClient, setIsClient] = useState(false)
  const { data: session, status } = useSession()
  const [selectedTab, setSelectedTab] = useState("overview")
  const [stats] = useState<ProviderStats>(MOCK_PROVIDER_STATS)
  const [bookings] = useState<Booking[]>(MOCK_BOOKINGS)
  const [services] = useState<Service[]>(MOCK_SERVICES)
  const [compliance] = useState<ComplianceItem[]>(MOCK_COMPLIANCE)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "expiring":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "pending":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "expired":
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Shield className="w-5 h-5 text-gray-500" />
    }
  }

  // Don't render anything until we're on the client
  if (!isClient) {
    return null
  }

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h2>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Scissors className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Provider Dashboard</h1>
                <p className="text-sm text-gray-600">Manage your services and bookings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Badge variant="secondary">Provider Portal</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+${stats.thisMonthEarnings} this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Services</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedServices}</div>
                  <p className="text-xs text-muted-foreground">Out of {stats.totalBookings} total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <p className="text-xs text-muted-foreground">Based on {stats.completedServices} reviews</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Latest booking requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.clientName}</p>
                          <p className="text-sm text-gray-600">
                            {booking.serviceName} • {booking.scheduledDate}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(booking.status)}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                  <CardDescription>Your verification status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {compliance.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getComplianceStatusIcon(item.status)}
                          <div>
                            <p className="font-medium">{item.type}</p>
                            <p className="text-sm text-gray-600">{item.message}</p>
                          </div>
                        </div>
                        {getSeverityBadge(item.severity)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>Manage all your appointments and bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Input placeholder="Search bookings..." className="flex-1" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.clientName}</TableCell>
                        <TableCell>{booking.serviceName}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.scheduledDate}</p>
                            <p className="text-sm text-gray-600">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span className="capitalize">{booking.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>${booking.amount}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {booking.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  Confirm
                                </Button>
                                <Button size="sm" variant="destructive">
                                  Decline
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Service Management</CardTitle>
                    <CardDescription>Manage your offered services and pricing</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.category}</TableCell>
                        <TableCell>${service.price}</TableCell>
                        <TableCell>{service.duration} min</TableCell>
                        <TableCell>{service.totalBookings}</TableCell>
                        <TableCell>
                          <Badge className={service.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Overview</CardTitle>
                  <CardDescription>Your revenue and commission breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">
                          ${stats.thisMonthEarnings}
                        </p>
                        <p className="text-sm text-gray-600">This Month</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">
                          ${stats.totalEarnings.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Total Earnings</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Platform Commission</span>
                        <span className="font-semibold">
                          ${(stats.totalEarnings * 0.15).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Your Earnings</span>
                        <span className="font-semibold">
                          ${(stats.totalEarnings * 0.85).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest payment activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{booking.serviceName}</p>
                          <p className="text-sm text-gray-600">{booking.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${booking.amount}</p>
                          <p className="text-xs text-gray-600">{booking.scheduledDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Compliance Monitoring</CardTitle>
                  <CardDescription>Track your licenses, insurance, and certifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expiry Date</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compliance.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getComplianceStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>{item.expiryDate || "N/A"}</TableCell>
                          <TableCell>{item.message}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">License Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Licenses</span>
                      <span className="font-semibold text-green-600">2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expiring Soon</span>
                      <span className="font-semibold text-yellow-600">1</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expired</span>
                      <span className="font-semibold text-red-600">0</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Insurance Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Current Coverage</span>
                      <span className="font-semibold text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expires</span>
                      <span className="font-semibold text-yellow-600">Mar 20, 2024</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Background Check</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status</span>
                      <span className="font-semibold text-blue-600">In Progress</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Started</span>
                      <span className="font-semibold">Jan 10, 2024</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 