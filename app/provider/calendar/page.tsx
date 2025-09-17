"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  CalendarIcon,
  Plus,
  Minus,
  Save,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns"

const MOCK_PROVIDER = {
  id: "1",
  name: "Sarah Johnson",
  services: [
    { id: "1", name: "Men's Haircut", duration: 45, price: 35 },
    { id: "2", name: "Swedish Massage", duration: 60, price: 80 },
    { id: "3", name: "Deep Tissue Massage", duration: 90, price: 110 },
  ],
}

const MOCK_BOOKINGS = [
  {
    id: "1",
    clientName: "John Doe",
    service: "Men's Haircut",
    date: "2024-08-15",
    time: "10:00 AM",
    duration: 45,
    price: 35,
    status: "confirmed",
    clientPhone: "(555) 123-4567",
    clientEmail: "john@email.com",
  },
  {
    id: "2",
    clientName: "Jane Smith",
    service: "Swedish Massage",
    date: "2024-08-15",
    time: "2:00 PM",
    duration: 60,
    price: 80,
    status: "pending",
    clientPhone: "(555) 987-6543",
    clientEmail: "jane@email.com",
  },
]

const DEFAULT_SCHEDULE = {
  monday: { enabled: true, start: "09:00", end: "17:00", break: { start: "12:00", end: "13:00" } },
  tuesday: { enabled: true, start: "09:00", end: "17:00", break: { start: "12:00", end: "13:00" } },
  wednesday: { enabled: true, start: "09:00", end: "17:00", break: { start: "12:00", end: "13:00" } },
  thursday: { enabled: true, start: "09:00", end: "17:00", break: { start: "12:00", end: "13:00" } },
  friday: { enabled: true, start: "09:00", end: "17:00", break: { start: "12:00", end: "13:00" } },
  saturday: { enabled: true, start: "10:00", end: "16:00", break: null },
  sunday: { enabled: false, start: "10:00", end: "16:00", break: null },
}

function ProviderCalendarContent() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("calendar")
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const generateTimeSlots = (start: string, end: string, breakTime?: { start: string; end: string } | null) => {
    const slots = []
    const startHour = Number.parseInt(start.split(":")[0])
    const startMin = Number.parseInt(start.split(":")[1])
    const endHour = Number.parseInt(end.split(":")[0])
    const endMin = Number.parseInt(end.split(":")[1])

    let currentHour = startHour
    let currentMin = startMin

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`

      // Skip break time
      if (breakTime) {
        const breakStart =
          Number.parseInt(breakTime.start.split(":")[0]) * 60 + Number.parseInt(breakTime.start.split(":")[1])
        const breakEnd =
          Number.parseInt(breakTime.end.split(":")[0]) * 60 + Number.parseInt(breakTime.end.split(":")[1])
        const currentTime = currentHour * 60 + currentMin

        if (currentTime >= breakStart && currentTime < breakEnd) {
          currentMin += 30
          if (currentMin >= 60) {
            currentHour += 1
            currentMin = 0
          }
          continue
        }
      }

      slots.push(timeStr)

      currentMin += 30
      if (currentMin >= 60) {
        currentHour += 1
        currentMin = 0
      }
    }

    return slots
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return MOCK_BOOKINGS.filter((booking) => booking.date === dateStr)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
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
              <CalendarIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Provider Calendar</h1>
                <p className="text-sm text-gray-600">Manage your availability and bookings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {MOCK_BOOKINGS.filter((b) => b.status === "confirmed").length} Confirmed Today
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="schedule">Set Schedule</TabsTrigger>
            <TabsTrigger value="bookings">Manage Bookings</TabsTrigger>
            <TabsTrigger value="availability">Block Time</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Calendar Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />

                    <div className="mt-6 space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Today&apos;s Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Bookings:</span>
                            <span className="font-medium">8</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenue:</span>
                            <span className="font-medium text-green-600">$520</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Available Slots:</span>
                            <span className="font-medium">12</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weekly View */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                    </CardTitle>
                    <CardDescription>Click on time slots to manage availability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-8 gap-2">
                      {/* Time column */}
                      <div className="space-y-2">
                        <div className="h-12 flex items-center justify-center font-medium text-sm">Time</div>
                        {generateTimeSlots("09:00", "17:00").map((time) => (
                          <div key={time} className="h-12 flex items-center justify-center text-xs text-gray-600">
                            {time}
                          </div>
                        ))}
                      </div>

                      {/* Day columns */}
                      {weekDays.map((day) => {
                        const dayName = format(day, "EEE")
                        const daySchedule = schedule[dayName.toLowerCase() as keyof typeof schedule]
                        const bookings = getBookingsForDate(day)

                        return (
                          <div key={day.toISOString()} className="space-y-2">
                            <div className="h-12 flex flex-col items-center justify-center">
                              <div className="font-medium text-sm">{dayName}</div>
                              <div className="text-xs text-gray-600">{format(day, "d")}</div>
                            </div>

                            {daySchedule?.enabled ? (
                              generateTimeSlots(daySchedule.start, daySchedule.end, daySchedule.break).map((time) => {
                                const booking = bookings.find(
                                  (b) =>
                                    b.time ===
                                    `${time.split(":")[0]}:${time.split(":")[1]} ${Number.parseInt(time.split(":")[0]) >= 12 ? "PM" : "AM"}`,
                                )

                                return (
                                  <div
                                    key={`${day.toISOString()}-${time}`}
                                    className={`h-12 border rounded cursor-pointer transition-colors ${
                                      booking
                                        ? booking.status === "confirmed"
                                          ? "bg-green-100 border-green-300"
                                          : "bg-yellow-100 border-yellow-300"
                                        : "bg-white border-gray-200 hover:bg-blue-50"
                                    }`}
                                    onClick={() => setSelectedTimeSlot(`${format(day, "yyyy-MM-dd")}-${time}`)}
                                  >
                                    {booking && (
                                      <div className="p-1 text-xs">
                                        <div className="font-medium truncate">{booking.clientName}</div>
                                        <div className="text-gray-600 truncate">{booking.service}</div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            ) : (
                              <div className="h-12 bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                                Closed
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>Set your working hours for each day of the week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(schedule).map(([day, daySchedule]) => (
                    <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-24">
                        <Label className="capitalize font-medium">{day}</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={daySchedule?.enabled || false}
                          onCheckedChange={(checked) =>
                            setSchedule((prev) => ({
                              ...prev,
                              [day]: { ...prev[day as keyof typeof prev], enabled: checked },
                            }))
                          }
                        />
                        <Label className="text-sm">Available</Label>
                      </div>

                      {daySchedule?.enabled && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">Start:</Label>
                            <Input
                              type="time"
                              value={daySchedule.start}
                              onChange={(e) =>
                                setSchedule((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], start: e.target.value },
                                }))
                              }
                              className="w-32"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">End:</Label>
                            <Input
                              type="time"
                              value={daySchedule.end}
                              onChange={(e) =>
                                setSchedule((prev) => ({
                                  ...prev,
                                  [day]: { ...prev[day as keyof typeof prev], end: e.target.value },
                                }))
                              }
                              className="w-32"
                            />
                          </div>

                          {daySchedule.break && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm">Break Start:</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.break.start}
                                  onChange={(e) =>
                                    setSchedule((prev) => ({
                                      ...prev,
                                      [day]: {
                                        ...prev[day as keyof typeof prev],
                                        break: prev[day as keyof typeof prev].break
                                          ? { ...prev[day as keyof typeof prev].break!, start: e.target.value }
                                          : { start: e.target.value, end: "13:00" },
                                      },
                                    }))
                                  }
                                  className="w-32"
                                />
                              </div>

                              <div className="flex items-center space-x-2">
                                <Label className="text-sm">Break End:</Label>
                                <Input
                                  type="time"
                                  value={daySchedule.end}
                                  onChange={(e) =>
                                    setSchedule((prev) => ({
                                      ...prev,
                                      [day]: {
                                        ...prev[day as keyof typeof prev],
                                        break: prev[day as keyof typeof prev].break
                                          ? { ...prev[day as keyof typeof prev].break!, end: e.target.value }
                                          : { start: "12:00", end: e.target.value },
                                      },
                                    }))
                                  }
                                  className="w-32"
                                />
                              </div>
                            </>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSchedule((prev) => ({
                                ...prev,
                                [day]: {
                                  ...prev[day as keyof typeof prev],
                                  break: prev[day as keyof typeof prev].break ? null : { start: "12:00", end: "13:00" },
                                },
                              }))
                            }
                          >
                            {daySchedule.break ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {daySchedule.break ? "Remove Break" : "Add Break"}
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <Button variant="outline">Reset to Default</Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bookings</CardTitle>
                <CardDescription>Manage your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MOCK_BOOKINGS.map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-4">
                            <h3 className="font-medium">{booking.clientName}</h3>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{format(new Date(booking.date), "MMM d, yyyy")}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {booking.time} ({booking.duration} min)
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{booking.service}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>${booking.price}</span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Phone: {booking.clientPhone}</p>
                            <p>Email: {booking.clientEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          {booking.status === "confirmed" && (
                            <Button variant="destructive" size="sm">
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {booking.status === "pending" && (
                            <Button className="bg-green-600 hover:bg-green-700" size="sm">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Block Time Slots</CardTitle>
                        <CardDescription>Block specific time slots when you&apos;re not available</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-4 block">Select Date Range</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-base font-medium mb-4 block">Block Time</Label>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Start Time</Label>
                            <Input type="time" defaultValue="12:00" />
                          </div>
                          <div>
                            <Label className="text-sm">End Time</Label>
                            <Input type="time" defaultValue="13:00" />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Reason (Optional)</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Personal Time</SelectItem>
                              <SelectItem value="appointment">Medical Appointment</SelectItem>
                              <SelectItem value="vacation">Vacation</SelectItem>
                              <SelectItem value="training">Training/Education</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Notes</Label>
                          <Textarea placeholder="Additional notes..." rows={3} />
                        </div>

                        <Button className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Block Time Slot
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium mb-4 block">Blocked Time Slots</Label>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium">Aug 15, 2024</p>
                            <p className="text-sm text-gray-600">12:00 PM - 1:00 PM</p>
                            <p className="text-xs text-gray-500">Lunch Break</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div>
                            <p className="font-medium">Aug 16, 2024</p>
                            <p className="text-sm text-gray-600">3:00 PM - 4:00 PM</p>
                            <p className="text-xs text-gray-500">Medical Appointment</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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

export default function ProviderCalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <ProviderCalendarContent />
    </Suspense>
  )
}
