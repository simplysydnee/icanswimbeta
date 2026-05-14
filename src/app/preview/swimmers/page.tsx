'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Users, Clock, UserCheck, TrendingUp, Filter,
  Award, Heart, Shield, Calendar, DollarSign,
  Mail, Phone, MapPin, Target, CheckCircle, Circle,
  Stethoscope, FileText, ClipboardList, Lightbulb,
  MessageSquare, Building2
} from 'lucide-react'

// Mock swimmer data for preview
const mockSwimmer = {
  id: '1',
  firstName: 'Emma',
  lastName: 'Johnson',
  preferredName: 'Emmy',
  dateOfBirth: '2018-03-15',
  age: 6,
  status: 'active',
  currentLevel: {
    id: '2',
    displayName: 'Level 2 - Water Explorer',
    color: '#3B82F6'
  },
  lessonsCompleted: 12,
  diagnosis: 'ASD',
  toiletTrained: 'Yes',
  nonAmbulatory: false,
  communicationType: 'Verbal',
  otherTherapies: 'OT, Speech',
  medicalConditions: 'Asthma',
  medications: 'Albuterol as needed',
  allergies: 'None',
  seizureHistory: false,
  behavioralConsiderations: 'Sensitive to loud noises',
  waterSafetyRisk: 'Medium',
  fundedSessionsUsed: 8,
  fundedSessionsAuthorized: 20,
  paymentType: 'funded',
  currentPoNumber: 'PO-2024-1234',
  coordinatorName: 'Sarah Williams',
  coordinatorEmail: 'sarah@coordinator.org',
  coordinatorPhone: '(555) 123-4567',
  parentEmail: 'parent@example.com',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-05-10T14:30:00Z',
}

const mockSkills = [
  { id: '1', name: 'Water Entry', status: 'mastered' },
  { id: '2', name: 'Bubble Blowing', status: 'mastered' },
  { id: '3', name: 'Floating on Back', status: 'in_progress' },
  { id: '4', name: 'Kicking with Board', status: 'in_progress' },
  { id: '5', name: 'Arm Movements', status: 'not_started' },
]

export default function SwimmersPreviewPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Preview Mode:</strong> This page shows the refactored spacing without requiring authentication. 
          Click on a swimmer name to see the detail modal.
        </p>
      </div>

      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Swimmers Management</h1>
            <p className="text-muted-foreground text-sm">Manage all swimmer profiles and progress</p>
          </div>
          <Button>Add Swimmer</Button>
        </div>

        {/* Stats Cards - Updated with tighter spacing */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Total Swimmers
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">47</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Waitlisted
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Active Enrolled
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">35</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                Avg. Lessons
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
              <div className="text-xl font-bold">8.3</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Filters Card */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Quick Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button variant="outline" size="sm">All Swimmers</Button>
              <Button variant="outline" size="sm">Active</Button>
              <Button variant="outline" size="sm">Waitlisted</Button>
              <Button variant="outline" size="sm">Needs Attention</Button>
            </div>
          </CardContent>
        </Card>

        {/* Sample Table */}
        <Card>
          <CardContent className="p-3">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Age</th>
                  <th className="pb-2 font-medium">Level</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Lessons</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                  <td className="py-2">
                    <button className="text-blue-600 hover:underline font-medium">
                      Emma Johnson
                    </button>
                  </td>
                  <td className="py-2">6</td>
                  <td className="py-2">
                    <Badge variant="outline" style={{ borderColor: '#3B82F6', color: '#3B82F6' }}>
                      Level 2
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </td>
                  <td className="py-2">12</td>
                </tr>
                <tr className="border-b hover:bg-muted/50">
                  <td className="py-2">Jake Smith</td>
                  <td className="py-2">8</td>
                  <td className="py-2">
                    <Badge variant="outline" style={{ borderColor: '#10B981', color: '#10B981' }}>
                      Level 3
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </td>
                  <td className="py-2">24</td>
                </tr>
                <tr className="hover:bg-muted/50">
                  <td className="py-2">Lily Chen</td>
                  <td className="py-2">5</td>
                  <td className="py-2">
                    <Badge variant="outline" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
                      Level 1
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge className="bg-yellow-100 text-yellow-700">Waitlisted</Badge>
                  </td>
                  <td className="py-2">0</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Swimmer Detail Modal - Shows the refactored spacing */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="!max-w-[1400px] w-[95vw] max-h-[92vh] overflow-y-auto p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">EJ</span>
              </div>
              <div>
                <div className="text-lg font-semibold">{mockSwimmer.firstName} {mockSwimmer.lastName}</div>
                <div className="text-sm text-muted-foreground">Age {mockSwimmer.age} | {mockSwimmer.diagnosis}</div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3">
            <Tabs defaultValue="overview">
              <TabsList className="flex flex-wrap gap-1 mb-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Main Content */}
                  <div className="md:col-span-3 space-y-4">
                    {/* Key Info Section */}
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Key Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Preferred Name</p>
                          <p className="text-sm font-medium">{mockSwimmer.preferredName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date of Birth</p>
                          <p className="text-sm font-medium">{mockSwimmer.dateOfBirth}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Level</p>
                          <Badge variant="outline" style={{ borderColor: mockSwimmer.currentLevel.color }}>
                            {mockSwimmer.currentLevel.displayName}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Care Needs Section */}
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Care Needs
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Toilet Trained</p>
                            <p className="text-sm font-medium">{mockSwimmer.toiletTrained}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Communication</p>
                            <p className="text-sm font-medium">{mockSwimmer.communicationType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Other Therapies</p>
                            <p className="text-sm font-medium">{mockSwimmer.otherTherapies}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Parent Info Card */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Parent/Guardian Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{mockSwimmer.parentEmail}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Coordinator Info Card */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Coordinator Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{mockSwimmer.coordinatorName}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{mockSwimmer.coordinatorEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{mockSwimmer.coordinatorPhone}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Stats & Actions */}
                  <div className="space-y-3">
                    {/* Quick Stats */}
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2 whitespace-nowrap">
                        Quick Stats
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-2xl font-bold">{mockSwimmer.lessonsCompleted}</p>
                          <p className="text-xs text-muted-foreground">Lessons Completed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{mockSwimmer.fundedSessionsUsed}/{mockSwimmer.fundedSessionsAuthorized}</p>
                          <p className="text-xs text-muted-foreground">Sessions Used</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2">
                        Quick Actions
                      </h3>
                      <div className="space-y-1.5">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Session
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Add Note
                        </Button>
                      </div>
                    </div>

                    {/* System Info */}
                    <div className="bg-white border rounded-lg p-3">
                      <h3 className="text-xs font-medium text-muted-foreground mb-2">
                        System Information
                      </h3>
                      <div className="space-y-1.5 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm">Jan 15, 2024</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm">May 10, 2024</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Medical Tab */}
              <TabsContent value="medical" className="space-y-4">
                <section>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Medical & Safety Information
                  </h3>

                  {/* Medical Information Grid */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <h4 className="text-sm font-semibold text-gray-800">Medical Information</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <p className="text-xs text-muted-foreground">Medical Conditions</p>
                        <p className="text-sm font-medium">{mockSwimmer.medicalConditions}</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <p className="text-xs text-muted-foreground">Medications</p>
                        <p className="text-sm font-medium">{mockSwimmer.medications}</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <p className="text-xs text-muted-foreground">Allergies</p>
                        <p className="text-sm font-medium">{mockSwimmer.allergies}</p>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Behavioral Grid */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-gray-800">Safety & Behavioral</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <p className="text-xs text-muted-foreground">Seizure History</p>
                        <p className="text-sm font-medium">{mockSwimmer.seizureHistory ? 'Yes' : 'No'}</p>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <p className="text-xs text-muted-foreground">Water Safety Risk</p>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {mockSwimmer.waterSafetyRisk}
                        </Badge>
                      </div>
                      <div className="bg-gray-50 p-2.5 rounded-lg col-span-2">
                        <p className="text-xs text-muted-foreground">Behavioral Considerations</p>
                        <p className="text-sm font-medium">{mockSwimmer.behavioralConsiderations}</p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        Low Risk
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                        Medium Risk
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        High Risk
                      </span>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="space-y-4">
                <section>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Progress & Skills
                  </h3>

                  <div className="space-y-3">
                    {/* Level Progress Summary */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          Level Progress
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {mockSwimmer.currentLevel.displayName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: mockSwimmer.currentLevel.color }}
                              />
                              <span className="text-sm font-medium">{mockSwimmer.currentLevel.displayName}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              2/5 skills mastered
                            </div>
                          </div>
                          <Progress value={40} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Focus Today */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-500" />
                          Focus Today
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            2 skills
                          </Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Skills currently in progress - focus on these during the lesson
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="space-y-1.5">
                          {mockSkills.filter(s => s.status === 'in_progress').map(skill => (
                            <div key={skill.id} className="flex items-center gap-2 text-sm">
                              <Circle className="h-3 w-3 text-amber-500 fill-amber-200" />
                              {skill.name}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mastered Skills */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Mastered Skills
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            2
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="space-y-1.5">
                          {mockSkills.filter(s => s.status === 'mastered').map(skill => (
                            <div key={skill.id} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {skill.name}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-muted-foreground" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3 pt-0">
                        <div className="grid grid-cols-2 gap-1.5">
                          <Button variant="outline" size="sm">Update Skills</Button>
                          <Button variant="outline" size="sm">Add Target</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-4">
                <section>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sessions & Bookings
                  </h3>

                  <div className="space-y-4">
                    {/* Upcoming Sessions */}
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Upcoming Sessions</h4>
                        <Button variant="outline" size="sm">Book New</Button>
                      </div>
                      <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
                    </div>

                    {/* Session Statistics */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xl font-bold">{mockSwimmer.lessonsCompleted}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">0</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold">{mockSwimmer.fundedSessionsAuthorized}</p>
                        <p className="text-xs text-muted-foreground">Authorized</p>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing" className="space-y-4">
                <section>
                  <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Billing & Funding
                  </h3>

                  <div className="mb-4">
                    <Badge className="bg-violet-100 text-violet-700">Funded</Badge>
                  </div>

                  <div className="space-y-3">
                    {/* PO Details */}
                    <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                      <h4 className="text-sm font-medium mb-2">Purchase Order Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">PO Number</p>
                          <p className="font-medium">{mockSwimmer.currentPoNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sessions Authorized</p>
                          <p className="font-medium">{mockSwimmer.fundedSessionsAuthorized}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sessions Progress */}
                    <div className="bg-violet-50 p-3 rounded-lg border border-violet-200">
                      <h4 className="text-sm font-medium mb-2">Sessions Usage</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Used: {mockSwimmer.fundedSessionsUsed}</span>
                          <span>Remaining: {mockSwimmer.fundedSessionsAuthorized - mockSwimmer.fundedSessionsUsed}</span>
                        </div>
                        <Progress value={(mockSwimmer.fundedSessionsUsed / mockSwimmer.fundedSessionsAuthorized) * 100} className="h-2" />
                      </div>
                    </div>

                    {/* Coordinator Info */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium mb-2">Coordinator</h4>
                      <div className="text-sm">
                        <p className="font-medium">{mockSwimmer.coordinatorName}</p>
                        <p className="text-muted-foreground">{mockSwimmer.coordinatorEmail}</p>
                        <p className="text-muted-foreground">{mockSwimmer.coordinatorPhone}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Internal Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-3 pb-3 pt-0">
                    {/* Add Note Section */}
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 border rounded-lg text-sm resize-none"
                        rows={3}
                        placeholder="Add a note..."
                      />
                      <Button size="sm">Add Note</Button>
                    </div>

                    {/* Sample Notes */}
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress Update</span>
                          <span className="text-xs text-muted-foreground">May 10, 2024</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Emma showed great improvement with floating today. She was able to hold the position for 10 seconds.
                        </p>
                      </div>
                      <div className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Behavioral Note</span>
                          <span className="text-xs text-muted-foreground">May 3, 2024</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Remember to keep volume low during instructions - Emma is sensitive to loud noises.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
