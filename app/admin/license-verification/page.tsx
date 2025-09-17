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
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Database,
  Zap,
  AlertCircle,
} from "lucide-react"

const MOCK_VERIFICATION_QUEUE = [
  {
    id: "1",
    providerName: "Sarah Johnson",
    licenseType: "Barber",
    licenseNumber: "CA-12345",
    state: "California",
    status: "verifying",
    submittedDate: "2024-08-10",
    verificationMethod: "API",
    stateResponse: "pending",
    documentScore: 98,
  },
  {
    id: "2",
    providerName: "Mike Rodriguez",
    licenseType: "LMT",
    licenseNumber: "TX-67890",
    state: "Texas",
    status: "verified",
    submittedDate: "2024-08-09",
    verificationMethod: "API",
    stateResponse: "active",
    documentScore: 95,
  },
  {
    id: "3",
    providerName: "Emily Chen",
    licenseType: "Nail Tech",
    licenseNumber: "NY-54321",
    state: "New York",
    status: "failed",
    submittedDate: "2024-08-08",
    verificationMethod: "Manual",
    stateResponse: "not_found",
    documentScore: 45,
    failureReason: "License number not found in state database",
  },
]

const STATE_BOARD_APIS = [
  { state: "California", status: "active", lastSync: "2024-08-10 09:30", responseTime: "1.2s" },
  { state: "Texas", status: "active", lastSync: "2024-08-10 09:28", responseTime: "0.8s" },
  { state: "New York", status: "maintenance", lastSync: "2024-08-09 15:45", responseTime: "N/A" },
  { state: "Florida", status: "active", lastSync: "2024-08-10 09:32", responseTime: "2.1s" },
  { state: "Illinois", status: "active", lastSync: "2024-08-10 09:29", responseTime: "1.5s" },
]

export default function LicenseVerificationPage() {
  const [selectedTab, setSelectedTab] = useState("queue")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "verifying":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Verifying
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getApiStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "maintenance":
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>
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
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">License Verification System</h1>
                <p className="text-sm text-gray-600">Real-time license validation & fraud prevention</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync All States
              </Button>
              <Badge variant="secondary">Admin Portal</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="queue">Verification Queue</TabsTrigger>
            <TabsTrigger value="apis">State Board APIs</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">Avg. 2.3 hours processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-muted-foreground">98.2% success rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Verification</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Fraud attempts blocked</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Uptime</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.8%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>
            </div>

            {/* Verification Queue */}
            <Card>
              <CardHeader>
                <CardTitle>License Verification Queue</CardTitle>
                <CardDescription>Real-time license validation with state licensing boards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by provider name or license number..."
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
                      <SelectItem value="verifying">Verifying</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>License Details</TableHead>
                      <TableHead>Verification Method</TableHead>
                      <TableHead>State Response</TableHead>
                      <TableHead>Document Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_VERIFICATION_QUEUE.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.providerName}</p>
                            <p className="text-sm text-gray-600">Submitted: {item.submittedDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-mono text-sm">{item.licenseNumber}</p>
                            <p className="text-xs text-gray-600">
                              {item.licenseType} • {item.state}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.verificationMethod === "API" ? "default" : "outline"}>
                            {item.verificationMethod === "API" ? (
                              <>
                                <Database className="w-3 h-3 mr-1" />
                                API
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Manual
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.stateResponse === "active"
                                ? "default"
                                : item.stateResponse === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {item.stateResponse}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.documentScore >= 90
                                    ? "bg-green-500"
                                    : item.documentScore >= 70
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${item.documentScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{item.documentScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {item.status === "failed" && (
                              <Button size="sm" variant="outline">
                                <RefreshCw className="w-4 h-4" />
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

          <TabsContent value="apis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>State Licensing Board API Status</CardTitle>
                <CardDescription>Real-time connectivity with state licensing databases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {STATE_BOARD_APIS.map((api) => (
                    <div key={api.state} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{api.state} State Board</p>
                          <p className="text-sm text-gray-600">Last sync: {api.lastSync}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Response Time</p>
                          <p className="text-sm text-gray-600">{api.responseTime}</p>
                        </div>
                        {getApiStatusBadge(api.status)}
                        <Button size="sm" variant="outline">
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Integration Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total API Endpoints</span>
                      <span className="font-semibold">47 States</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Connections</span>
                      <span className="font-semibold text-green-600">44</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Manual Verification States</span>
                      <span className="font-semibold text-yellow-600">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Response Time</span>
                      <span className="font-semibold">1.4s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Real-time API</span>
                      </div>
                      <span className="font-semibold">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Document OCR</span>
                      </div>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Manual Review</span>
                      </div>
                      <span className="font-semibold">6%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fraud" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fraud Attempts Blocked</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">127</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fake Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">89</div>
                  <p className="text-xs text-muted-foreground">AI detected</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invalid Licenses</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">38</div>
                  <p className="text-xs text-muted-foreground">Not found in state DB</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Detection Alerts</CardTitle>
                <CardDescription>Recent suspicious activities and blocked attempts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">Fake License Document Detected</p>
                      <p className="text-sm text-red-700">Provider: John Doe • License: CA-FAKE123</p>
                      <p className="text-xs text-red-600 mt-1">AI confidence: 99.2% • Blocked automatically</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-900">Suspicious License Number Pattern</p>
                      <p className="text-sm text-yellow-700">Provider: Jane Smith • License: TX-00000</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Sequential number detected • Manual review required
                      </p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-900">License Not Found in State Database</p>
                      <p className="text-sm text-orange-700">Provider: Bob Johnson • License: FL-99999</p>
                      <p className="text-xs text-orange-600 mt-1">State board API returned no results</p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">Verification Failed</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Prevention Measures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Document Verification</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• AI-powered document authenticity detection</li>
                      <li>• OCR text extraction and validation</li>
                      <li>• Watermark and security feature analysis</li>
                      <li>• Cross-reference with known fake documents</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">License Validation</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Real-time state board database queries</li>
                      <li>• License status verification (active/suspended)</li>
                      <li>• Disciplinary action history check</li>
                      <li>• Expiration date validation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Verification Success Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Barber Licenses</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "96%" }}></div>
                        </div>
                        <span className="text-sm font-medium">96%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Massage Therapy (LMT)</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "94%" }}></div>
                        </div>
                        <span className="text-sm font-medium">94%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Nail Technician</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "98%" }}></div>
                        </div>
                        <span className="text-sm font-medium">98%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cosmetology</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: "97%" }}></div>
                        </div>
                        <span className="text-sm font-medium">97%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Times by State</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { state: "California", time: "1.2s", method: "API" },
                      { state: "Texas", time: "0.8s", method: "API" },
                      { state: "New York", time: "24h", method: "Manual" },
                      { state: "Florida", time: "2.1s", method: "API" },
                      { state: "Illinois", time: "1.5s", method: "API" },
                    ].map((item) => (
                      <div key={item.state} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.state}</p>
                          <Badge variant={item.method === "API" ? "default" : "secondary"} className="text-xs">
                            {item.method}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{item.time}</p>
                          <p className="text-xs text-gray-600">Avg. processing</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
