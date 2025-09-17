"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Shield,
  AlertTriangle,
  Eye,
  Ban,
  FileText,
  Database,
  Zap,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

const FRAUD_CASES = [
  {
    id: "1",
    providerName: "John Doe",
    email: "fake@email.com",
    licenseNumber: "CA-FAKE123",
    fraudType: "Fake Document",
    riskScore: 99.2,
    detectionMethod: "AI Document Analysis",
    status: "blocked",
    reportedDate: "2024-08-10",
    evidence: ["Altered watermarks", "Inconsistent fonts", "Invalid license format"],
  },
  {
    id: "2",
    providerName: "Jane Smith",
    email: "suspicious@domain.com",
    licenseNumber: "TX-00000",
    fraudType: "Invalid License",
    riskScore: 87.5,
    detectionMethod: "State Database Verification",
    status: "investigating",
    reportedDate: "2024-08-09",
    evidence: ["License not found in state database", "Sequential number pattern"],
  },
  {
    id: "3",
    providerName: "Bob Johnson",
    email: "expired@license.com",
    licenseNumber: "FL-99999",
    fraudType: "Expired License",
    riskScore: 75.3,
    detectionMethod: "Automated Verification",
    status: "resolved",
    reportedDate: "2024-08-08",
    evidence: ["License expired 2 years ago", "No renewal records"],
  },
]

const AI_DETECTION_METRICS = [
  { metric: "Document Authenticity", accuracy: 99.2, processed: 1247 },
  { metric: "License Format Validation", accuracy: 98.7, processed: 1156 },
  { metric: "Watermark Detection", accuracy: 97.8, processed: 892 },
  { metric: "Font Consistency Analysis", accuracy: 96.5, processed: 734 },
  { metric: "Image Manipulation Detection", accuracy: 98.9, processed: 623 },
]

export default function FraudPreventionPage() {
  const [selectedTab, setSelectedTab] = useState("overview")

  const getRiskBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-red-100 text-red-800">Critical</Badge>
    if (score >= 70) return <Badge className="bg-orange-100 text-orange-800">High</Badge>
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
    return <Badge className="bg-green-100 text-green-800">Low</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return (
          <Badge className="bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" />
            Blocked
          </Badge>
        )
      case "investigating":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Eye className="w-3 h-3 mr-1" />
            Investigating
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Resolved
          </Badge>
        )
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
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold">Fraud Prevention Center</h1>
                <p className="text-sm text-gray-600">Advanced AI-powered fraud detection & prevention</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" className="text-red-600 border-red-600 bg-transparent">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Emergency Block
              </Button>
              <Badge variant="destructive">Security Alert</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Fraud Cases</TabsTrigger>
            <TabsTrigger value="ai-detection">AI Detection</TabsTrigger>
            <TabsTrigger value="prevention">Prevention Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fraud Attempts Blocked</CardTitle>
                  <Ban className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">247</div>
                  <p className="text-xs text-muted-foreground">+23% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Detection Rate</CardTitle>
                  <Zap className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">98.7%</div>
                  <p className="text-xs text-muted-foreground">Accuracy rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fake Documents</CardTitle>
                  <FileText className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">189</div>
                  <p className="text-xs text-muted-foreground">Detected this month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Money Saved</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">$2.4M</div>
                  <p className="text-xs text-muted-foreground">Potential fraud prevented</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Critical Fraud Alerts</CardTitle>
                  <CardDescription>High-risk cases requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900">Sophisticated Document Forgery</p>
                        <p className="text-sm text-red-700">Multiple fake licenses from same IP address</p>
                        <p className="text-xs text-red-600 mt-1">Risk Score: 99.8% • Auto-blocked</p>
                      </div>
                      <Button size="sm" variant="destructive">
                        Investigate
                      </Button>
                    </div>

                    <div className="flex items-start space-x-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-900">Coordinated Fraud Ring</p>
                        <p className="text-sm text-orange-700">15 applications with similar patterns</p>
                        <p className="text-xs text-orange-600 mt-1">Risk Score: 94.2% • Under investigation</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fraud Prevention Impact</CardTitle>
                  <CardDescription>Monthly fraud prevention statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Fake Documents Blocked</span>
                      <span className="font-semibold text-red-600">189</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Invalid Licenses Detected</span>
                      <span className="font-semibold text-orange-600">67</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Identity Theft Attempts</span>
                      <span className="font-semibold text-yellow-600">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Legitimate Applications</span>
                      <span className="font-semibold text-green-600">2,847</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">False Positive Rate</span>
                        <span className="font-semibold text-blue-600">0.3%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fraud Investigation Cases</CardTitle>
                <CardDescription>Detailed view of fraud cases and investigations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider Details</TableHead>
                      <TableHead>Fraud Type</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Detection Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {FRAUD_CASES.map((case_) => (
                      <TableRow key={case_.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{case_.providerName}</p>
                            <p className="text-sm text-gray-600">{case_.email}</p>
                            <p className="text-xs font-mono text-gray-500">{case_.licenseNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {case_.fraudType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRiskBadge(case_.riskScore)}
                            <span className="text-sm font-medium">{case_.riskScore}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{case_.detectionMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(case_.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {case_.status !== "blocked" && (
                              <Button size="sm" variant="destructive">
                                <Ban className="w-4 h-4" />
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

            <Card>
              <CardHeader>
                <CardTitle>Evidence Analysis</CardTitle>
                <CardDescription>Detailed evidence for fraud case #1</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Document Analysis Results</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Watermark Authenticity</span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Failed</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Font Consistency</span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Failed</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm">License Format</span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Invalid</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">State Verification Results</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Database className="w-4 h-4 text-red-600" />
                          <span className="text-sm">License Database</span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Not Found</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-red-600" />
                          <span className="text-sm">Provider Registry</span>
                        </div>
                        <Badge className="bg-red-100 text-red-800">No Match</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-detection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Detection Performance</CardTitle>
                <CardDescription>Machine learning model accuracy and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Detection Model</TableHead>
                      <TableHead>Accuracy Rate</TableHead>
                      <TableHead>Documents Processed</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {AI_DETECTION_METRICS.map((metric, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{metric.metric}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${metric.accuracy}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{metric.accuracy}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{metric.processed.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Model Training Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Legitimate Documents</span>
                      <span className="font-semibold">847,392</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Known Fake Documents</span>
                      <span className="font-semibold">23,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">State License Formats</span>
                      <span className="font-semibold">50 States</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">License Types Covered</span>
                      <span className="font-semibold">12 Types</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detection Capabilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Document tampering detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Watermark authenticity verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Font and layout analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Image manipulation detection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Real-time license verification</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Cross-reference with known fraud patterns</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="prevention" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prevention Tools</CardTitle>
                  <CardDescription>Active fraud prevention measures</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-red-600 hover:bg-red-700">
                    <Ban className="w-4 h-4 mr-2" />
                    Emergency Block Provider
                  </Button>
                  <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Flag for Investigation
                  </Button>
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                    <Database className="w-4 h-4 mr-2" />
                    Update Fraud Database
                  </Button>
                  <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                    <Zap className="w-4 h-4 mr-2" />
                    Retrain AI Models
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Real-time fraud prevention system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">AI Detection Engine</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">State Database APIs</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Document Scanner</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Manual Review Queue</span>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">23 Pending</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Prevention Rules</CardTitle>
                <CardDescription>Configure automated fraud detection rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Document Validation Rules</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Minimum document quality score</span>
                        <Input className="w-20" defaultValue="85" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Auto-block threshold</span>
                        <Input className="w-20" defaultValue="95" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Manual review threshold</span>
                        <Input className="w-20" defaultValue="70" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">License Validation Rules</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Require state verification</span>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Block expired licenses</span>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm">Verify insurance coverage</span>
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      </div>
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
