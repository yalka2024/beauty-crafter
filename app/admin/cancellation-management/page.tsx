"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react"

const MOCK_CANCELLATIONS = [
  {
    id: "1",
    clientName: "John Doe",
    providerName: "Sarah Johnson",
    service: "Men's Haircut",
    originalDate: "2024-08-15",
    originalTime: "10:00 AM",
    cancelledAt: "2024-08-14 08:30",
    cancelledBy: "client",
    reason: "Personal emergency",
    hoursNotice: 25.5,
    fee: 0,
    refund: 35,
    status: "processed",
  },
  {
    id: "2",
    clientName: "Jane Smith",
    providerName: "Mike Rodriguez",
    service: "Deep Tissue Massage",
    originalDate: "2024-08-16",
    originalTime: "2:00 PM",
    cancelledAt: "2024-08-16 10:00",
    cancelledBy: "provider",
    reason: "Sick",
    hoursNotice: 4,
    fee: 150,
    refund: 110,
    compensation: 75,
    status: "disputed",
  },
  {
    id: "3",
    clientName: "Bob Wilson",
    providerName: "Emily Chen",
    service: "Facial Treatment",
    originalDate: "2024-08-17",
    originalTime: "3:00 PM",
    cancelledAt: "2024-08-17 14:30",
    cancelledBy: "client",
    reason: "No-show",
    hoursNotice: 0.5,
    fee: 120,
    refund: 0,
    status: "processed",
  },
]

const REPEAT_OFFENDERS = [
  {
    id: "1",
    name: "Alex Thompson",
    email: "alex@email.com",
    cancellations: 5,
    period: "30 days",
    totalFees: 275,
    status: "warning",
    lastCancellation: "2024-08-10",
  },
  {
    id: "2",
    name: "Lisa Brown",
    email: "lisa@email.com",
    cancellations: 7,
    period: "30 days",
    totalFees: 450,
    status: "suspended",
    lastCancellation: "2024-08-12",
  },
]

export default function CancellationManagementPage() {
  const [selectedTab, setSelectedTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>
      case "disputed":
        return <Badge className="bg-yellow-100 text-yellow-800">Disputed</Badge>
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getOffenderStatusBadge = (status: string) => {
    switch (status) {
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case "terminated":
        return <Badge className="bg-red-100 text-red-800">Terminated</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Cancellation Management</h1>
                <p className="text-sm text-gray-600">Monitor and manage cancellation policies and penalties</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Report
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
            <TabsTrigger value="cancellations">Recent Cancellations</TabsTrigger>
            <TabsTrigger value="offenders">Repeat Offenders</TabsTrigger>
            <TabsTrigger value="policies">Policy Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cancellations</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">127</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$8,450</div>
                  <p className="text-xs text-muted-foreground">+15% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8.2%</div>
                  <p className="text-xs text-muted-foreground">-2.1% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Repeat Offenders</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Active warnings/suspensions</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Analytics */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cancellation Trends</CardTitle>
                  <CardDescription>Monthly cancellation patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Client Cancellations</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Provider Cancellations</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                        </div>
                        <span className="text-sm font-medium">25%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cancellation Reasons</CardTitle>
                  <CardDescription>Most common cancellation reasons</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { reason: "Personal Emergency", count: 45, percentage: 35 },
                      { reason: "Schedule Conflict", count: 32, percentage: 25 },
                      { reason: "Illness", count: 25, percentage: 20 },
                      { reason: "No-Show", count: 15, percentage: 12 },
                      { reason: "Other", count: 10, percentage: 8 },
                    ].map((item) => (
                      <div key={item.reason} className="flex justify-between items-center">
                        <span className="text-sm">{item.reason}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                          </div>
                          <span className="text-sm font-medium w-8">{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Impact */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact Analysis</CardTitle>
                <CardDescription>Revenue impact of cancellation policies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">$12,340</p>
                    <p className="text-sm text-gray-600">Revenue Protected</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">$8,450</p>
                    <p className="text-sm text-gray-600">Fees Collected</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">156</p>
                    <p className="text-sm text-gray-600">Hours Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cancellations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Cancellations</CardTitle>
                <CardDescription>Monitor all cancellation activities and penalties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by client or provider name..."
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
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="disputed">Disputed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking Details</TableHead>
                      <TableHead>Cancelled By</TableHead>
                      <TableHead>Notice Period</TableHead>
                      <TableHead>Financial Impact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_CANCELLATIONS.map((cancellation) => (
                      <TableRow key={cancellation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cancellation.service}</p>
                            <p className="text-sm text-gray-600">
                              {cancellation.clientName} → {cancellation.providerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {cancellation.originalDate} at {cancellation.originalTime}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant={cancellation.cancelledBy === "client" ? "default" : "destructive"}>
                              {cancellation.cancelledBy}
                            </Badge>
                            <p className="text-xs text-gray-600 mt-1">{cancellation.reason}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cancellation.hoursNotice}h</p>
                            <p className="text-xs text-gray-600">before appointment</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {cancellation.fee > 0 && <p className="text-red-600">Fee: ${cancellation.fee}</p>}
                            {cancellation.refund > 0 && (
                              <p className="text-green-600">Refund: ${cancellation.refund}</p>
                            )}
                            {cancellation.compensation && (
                              <p className="text-blue-600">Compensation: ${cancellation.compensation}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(cancellation.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {cancellation.status === "disputed" && (
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Review
                              </Button>
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

          <TabsContent value="offenders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Repeat Offenders</CardTitle>
                <CardDescription>Users with multiple cancellations requiring action</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Cancellations</TableHead>
                      <TableHead>Total Fees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Cancellation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {REPEAT_OFFENDERS.map((offender) => (
                      <TableRow key={offender.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{offender.name}</p>
                            <p className="text-sm text-gray-600">{offender.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-red-600">{offender.cancellations}</p>
                            <p className="text-xs text-gray-600">in {offender.period}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">${offender.totalFees}</p>
                        </TableCell>
                        <TableCell>{getOffenderStatusBadge(offender.status)}</TableCell>
                        <TableCell>
                          <p className="text-sm">{offender.lastCancellation}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {offender.status === "warning" && (
                              <Button size="sm" variant="destructive">
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            {offender.status === "suspended" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <CheckCircle className="w-4 h-4" />
                              </Button>
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

          <TabsContent value="policies" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Cancellation Policy</CardTitle>
                  <CardDescription>Configure cancellation fees and refund policies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">24+ hours notice</p>
                        <p className="text-sm text-gray-600">Free cancellation</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-medium">0% fee</p>
                        <p className="text-sm text-gray-600">100% refund</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">12-24 hours notice</p>
                        <p className="text-sm text-gray-600">Partial fee</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-600 font-medium">25% fee</p>
                        <p className="text-sm text-gray-600">75% refund</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">6-12 hours notice</p>
                        <p className="text-sm text-gray-600">Half fee</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-medium">50% fee</p>
                        <p className="text-sm text-gray-600">50% refund</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">2-6 hours notice</p>
                        <p className="text-sm text-gray-600">Most of fee</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">75% fee</p>
                        <p className="text-sm text-gray-600">25% refund</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">No-show/Last minute</p>
                        <p className="text-sm text-gray-600">Full fee</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">100% fee</p>
                        <p className="text-sm text-gray-600">0% refund</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">Update Client Policy</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Provider Cancellation Policy</CardTitle>
                  <CardDescription>Configure provider penalties and client compensation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">24+ hours notice</p>
                        <p className="text-sm text-gray-600">No penalty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-medium">$0 penalty</p>
                        <p className="text-sm text-gray-600">Full refund</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">12-24 hours notice</p>
                        <p className="text-sm text-gray-600">Light penalty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-600 font-medium">$50 penalty</p>
                        <p className="text-sm text-gray-600">Refund + $25</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">6-12 hours notice</p>
                        <p className="text-sm text-gray-600">Medium penalty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-medium">$100 penalty</p>
                        <p className="text-sm text-gray-600">Refund + $50</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">2-6 hours notice</p>
                        <p className="text-sm text-gray-600">Heavy penalty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">$150 penalty</p>
                        <p className="text-sm text-gray-600">Refund + $75</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">No-show/Last minute</p>
                        <p className="text-sm text-gray-600">Maximum penalty</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-600 font-medium">$200 penalty</p>
                        <p className="text-sm text-gray-600">Refund + $100</p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full">Update Provider Policy</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Repeat Offender Thresholds</CardTitle>
                <CardDescription>Configure automatic actions for repeat cancellations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Warning Level</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cancellations:</span>
                        <Input type="number" defaultValue="3" className="w-16 h-8" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Period:</span>
                        <Select defaultValue="30">
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Suspension Level</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cancellations:</span>
                        <Input type="number" defaultValue="5" className="w-16 h-8" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Duration:</span>
                        <Select defaultValue="7">
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Termination Level</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cancellations:</span>
                        <Input type="number" defaultValue="7" className="w-16 h-8" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Action:</span>
                        <Badge variant="destructive" className="text-xs">
                          Permanent
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6">Save Threshold Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
