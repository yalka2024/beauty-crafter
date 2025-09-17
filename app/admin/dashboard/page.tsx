"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Shield,
  AlertTriangle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  UserCheck,
  UserX,
  Calendar,
} from "lucide-react"

const MOCK_PROVIDERS = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    state: "California",
    licenseNumber: "CA-12345",
    licenseExpiry: "2025-06-15",
    status: "active",
    services: ["Barber", "Nail"],
    rating: 4.9,
    completedServices: 156,
    joinDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Mike Rodriguez",
    email: "mike.r@email.com",
    state: "Texas",
    licenseNumber: "TX-67890",
    licenseExpiry: "2024-12-30",
    status: "pending",
    services: ["Barber"],
    rating: 0,
    completedServices: 0,
    joinDate: "2024-08-10",
  },
  {
    id: "3",
    name: "Emily Chen",
    email: "emily.c@email.com",
    state: "New York",
    licenseNumber: "NY-54321",
    licenseExpiry: "2025-03-20",
    status: "suspended",
    services: ["Nail"],
    rating: 4.2,
    completedServices: 89,
    joinDate: "2023-11-08",
  },
]

const MOCK_COMPLIANCE_ALERTS = [
  {
    id: "1",
    providerId: "3",
    providerName: "Emily Chen",
    type: "license_expiry",
    message: "License expires in 30 days",
    severity: "warning",
    date: "2024-08-10",
  },
  {
    id: "2",
    providerId: "2",
    providerName: "Mike Rodriguez",
    type: "background_check",
    message: "Background check pending",
    severity: "info",
    date: "2024-08-10",
  },
  {
    id: "3",
    providerId: "1",
    providerName: "Sarah Johnson",
    type: "insurance_renewal",
    message: "Insurance renewal required",
    severity: "high",
    date: "2024-08-09",
  },
]

export default function AdminDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "info":
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">BeautyPro Admin</h1>
                <p className="text-sm text-gray-600">Provider Management & Compliance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Badge variant="secondary">Admin Portal</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,547</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,401</div>
                  <p className="text-xs text-muted-foreground">94.3% compliance rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Avg. 2.3 days processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">3 high priority</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Provider Applications</CardTitle>
                  <CardDescription>Latest provider registration requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOCK_PROVIDERS.filter((p) => p.status === "pending").map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-gray-600">
                            {provider.state} • {provider.services.join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(provider.status)}
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
                  <CardTitle>Compliance Alerts</CardTitle>
                  <CardDescription>Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {MOCK_COMPLIANCE_ALERTS.slice(0, 3).map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{alert.providerName}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(alert.severity)}
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Management</CardTitle>
                <CardDescription>Manage and monitor all service providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search providers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>

                {/* Providers Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_PROVIDERS.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{provider.name}</p>
                            <p className="text-sm text-gray-600">{provider.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{provider.licenseNumber}</p>
                            <p className="text-xs text-gray-600">{provider.state}</p>
                            <p className="text-xs text-gray-600">Exp: {provider.licenseExpiry}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {provider.services.map((service) => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(provider.status)}</TableCell>
                        <TableCell>
                          {provider.rating > 0 ? (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{provider.rating}</span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{provider.completedServices}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {provider.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive">
                                  <UserX className="w-4 h-4" />
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

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Compliance Overview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Compliance Monitoring</CardTitle>
                  <CardDescription>Track license renewals and regulatory compliance</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Provider</TableHead>
                        <TableHead>Alert Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_COMPLIANCE_ALERTS.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.providerName}</TableCell>
                          <TableCell>
                            <div>
                              <p className="capitalize">{alert.type.replace("_", " ")}</p>
                              <p className="text-sm text-gray-600">{alert.message}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                          <TableCell>{alert.date}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Compliance Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">License Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Licenses</span>
                      <span className="font-semibold text-green-600">2,401</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expiring Soon</span>
                      <span className="font-semibold text-yellow-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Expired</span>
                      <span className="font-semibold text-red-600">8</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending Renewal</span>
                      <span className="font-semibold text-blue-600">15</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Background Checks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="font-semibold text-green-600">2,389</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <span className="font-semibold text-yellow-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Failed</span>
                      <span className="font-semibold text-red-600">3</span>
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
                      <span className="font-semibold text-green-600">2,156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Renewal Required</span>
                      <span className="font-semibold text-yellow-600">45</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">No Coverage</span>
                      <span className="font-semibold text-red-600">346</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Platform revenue and commission tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-green-600">$127,450</p>
                        <p className="text-sm text-gray-600">This Month</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-600">+18.5%</p>
                        <p className="text-sm text-gray-600">Growth Rate</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Platform Commission</span>
                        <span className="font-semibold">$19,118</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Provider Earnings</span>
                        <span className="font-semibold">$108,332</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Processing Fees</span>
                        <span className="font-semibold">$3,825</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Analytics</CardTitle>
                  <CardDescription>Popular services and booking trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Men&apos;s Haircuts</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                          </div>
                          <span className="text-sm font-medium">1,247</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Manicures</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "72%" }}></div>
                          </div>
                          <span className="text-sm font-medium">892</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Beard Trims</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "58%" }}></div>
                          </div>
                          <span className="text-sm font-medium">634</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pedicures</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: "45%" }}></div>
                          </div>
                          <span className="text-sm font-medium">456</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>State Compliance Report</CardTitle>
                  <CardDescription>Compliance status by state</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { state: "California", providers: 456, compliance: 98.2 },
                      { state: "Texas", providers: 389, compliance: 96.8 },
                      { state: "New York", providers: 312, compliance: 97.4 },
                      { state: "Florida", providers: 278, compliance: 95.1 },
                      { state: "Illinois", providers: 234, compliance: 99.1 },
                    ].map((item) => (
                      <div key={item.state} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.state}</p>
                          <p className="text-sm text-gray-600">{item.providers} providers</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{item.compliance}%</p>
                          <p className="text-xs text-gray-600">Compliant</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Reports</CardTitle>
                  <CardDescription>Generate detailed reports for analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-transparent" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Provider Compliance Report
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Revenue Analytics Report
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Calendar className="w-4 h-4 mr-2" />
                    Monthly Activity Report
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    License Expiry Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
