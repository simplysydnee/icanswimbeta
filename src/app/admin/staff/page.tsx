'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Edit,
  User,
  DollarSign,
  Eye,
  EyeOff,
  Users,
  Briefcase,
  Award,
  Loader2
} from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

interface StaffMember {
  id: string
  full_name: string
  email: string
  title: string | null
  bio: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  // Payroll fields
  pay_rate_cents: number
  employment_type: string
  // Team display fields
  display_on_team: boolean
  display_order: number
  credentials: string[] | null
  staff_type: string
  created_at: string
}

const EMPLOYMENT_TYPES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'salary', label: 'Salary' },
  { value: 'contractor', label: 'Contractor' },
]

const STAFF_TYPES = [
  { value: 'owner', label: 'Owner' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'support', label: 'Support Staff' },
  { value: 'admin', label: 'Administrator' },
]

export default function StaffManagementPage() {
  const supabase = createClient()
  const { toast } = useToast()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')
  const [saving, setSaving] = useState(false)

  // Fetch all staff members with instructor or admin role
  const fetchStaffMembers = async () => {
    try {
      setLoading(true)

      // Get users with instructor or admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['instructor', 'admin'])

      if (roleError) throw roleError

      const staffIds = roleData?.map(r => r.user_id) || []

      if (staffIds.length === 0) {
        setStaffMembers([])
        return
      }

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', staffIds)
        .order('display_order', { ascending: true })
        .order('full_name', { ascending: true })

      if (error) throw error

      setStaffMembers(profiles as StaffMember[])
    } catch (error: any) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffMembers()
  }, [])

  // Update staff member
  const updateStaffMember = async (data: Partial<StaffMember> & { id: string }) => {
    try {
      setSaving(true)
      const { id, ...updateData } = data

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Staff member updated successfully'
      })

      // Refresh the list
      fetchStaffMembers()
      setEditingMember(null)
    } catch (error: any) {
      console.error('Error updating staff:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to update staff member',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Filter staff
  const filteredStaff = staffMembers.filter(member => {
    if (filterActive === 'all') return true
    if (filterActive === 'active') return member.is_active !== false
    return member.is_active === false
  })

  // Format currency
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2a5e84]" />
            <p className="mt-4 text-gray-600">Loading staff members...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage instructors, payroll, and team display settings
          </p>
        </div>
        <Button
          onClick={() => window.location.href = '/admin/instructors'}
          className="bg-[#2a5e84] hover:bg-[#1e4a6d]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterActive === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterActive('active')}
          className={filterActive === 'active' ? 'bg-[#2a5e84] hover:bg-[#1e4a6d]' : ''}
        >
          Active ({staffMembers.filter(m => m.is_active !== false).length})
        </Button>
        <Button
          variant={filterActive === 'inactive' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterActive('inactive')}
          className={filterActive === 'inactive' ? 'bg-[#2a5e84] hover:bg-[#1e4a6d]' : ''}
        >
          Inactive ({staffMembers.filter(m => m.is_active === false).length})
        </Button>
        <Button
          variant={filterActive === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterActive('all')}
          className={filterActive === 'all' ? 'bg-[#2a5e84] hover:bg-[#1e4a6d]' : ''}
        >
          All ({staffMembers.length})
        </Button>
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No staff members found</p>
              <Button
                onClick={() => window.location.href = '/admin/instructors'}
                variant="outline"
                className="mt-4"
              >
                Add Your First Instructor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-center">On Team Page</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id} className={!member.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <Image
                            src={member.avatar_url}
                            alt={member.full_name}
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{member.full_name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{member.title || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatCurrency(member.pay_rate_cents || 0)}/hr
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EMPLOYMENT_TYPES.find(t => t.value === member.employment_type)?.label || member.employment_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={member.is_active !== false}
                        onCheckedChange={(checked) =>
                          updateStaffMember({ id: member.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {member.display_on_team ? (
                        <Eye className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingMember(member)
                          setActiveTab('profile')
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog with Tabs */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {editingMember?.avatar_url ? (
                <Image
                  src={editingMember.avatar_url}
                  alt={editingMember.full_name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div>
                <p>{editingMember?.full_name}</p>
                <p className="text-sm font-normal text-gray-500">{editingMember?.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Edit staff member details
            </DialogDescription>
          </DialogHeader>

          {editingMember && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="payroll" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payroll
                </TabsTrigger>
                <TabsTrigger value="display" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Display
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={editingMember.full_name || ''}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        full_name: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editingMember.title || ''}
                      onChange={(e) => setEditingMember({
                        ...editingMember,
                        title: e.target.value
                      })}
                      placeholder="e.g., Lead Instructor"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editingMember.phone || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      phone: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editingMember.bio || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      bio: e.target.value
                    })}
                    rows={4}
                    placeholder="Write a bio for the team page..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-sm text-gray-500">
                      Inactive staff won't appear in assignment dropdowns
                    </p>
                  </div>
                  <Switch
                    checked={editingMember.is_active !== false}
                    onCheckedChange={(checked) => setEditingMember({
                      ...editingMember,
                      is_active: checked
                    })}
                  />
                </div>

                <Button
                  className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d]"
                  onClick={() => updateStaffMember({
                    id: editingMember.id,
                    full_name: editingMember.full_name,
                    title: editingMember.title,
                    phone: editingMember.phone,
                    bio: editingMember.bio,
                    is_active: editingMember.is_active
                  })}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </TabsContent>

              {/* Payroll Tab */}
              <TabsContent value="payroll" className="space-y-4 mt-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Current Pay Rate:</strong> {formatCurrency(editingMember.pay_rate_cents || 0)}/hr
                  </p>
                </div>

                <div>
                  <Label htmlFor="pay_rate">Hourly Rate ($)</Label>
                  <Input
                    id="pay_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={(editingMember.pay_rate_cents || 0) / 100}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      pay_rate_cents: Math.round(parseFloat(e.target.value || '0') * 100)
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the hourly rate in dollars (e.g., 25.00)
                  </p>
                </div>

                <div>
                  <Label htmlFor="employment_type">Employment Type</Label>
                  <Select
                    value={editingMember.employment_type || 'hourly'}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      employment_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d]"
                  onClick={() => updateStaffMember({
                    id: editingMember.id,
                    pay_rate_cents: editingMember.pay_rate_cents,
                    employment_type: editingMember.employment_type
                  })}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Payroll Settings'}
                </Button>
              </TabsContent>

              {/* Team Display Tab */}
              <TabsContent value="display" className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Show on Public Team Page</Label>
                    <p className="text-sm text-gray-500">
                      Display this person on the /team page
                    </p>
                  </div>
                  <Switch
                    checked={editingMember.display_on_team || false}
                    onCheckedChange={(checked) => setEditingMember({
                      ...editingMember,
                      display_on_team: checked
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    min="1"
                    value={editingMember.display_order || 100}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      display_order: parseInt(e.target.value) || 100
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower numbers appear first (e.g., Owner = 1, Lead = 10, Staff = 100)
                  </p>
                </div>

                <div>
                  <Label htmlFor="staff_type">Staff Type</Label>
                  <Select
                    value={editingMember.staff_type || 'instructor'}
                    onValueChange={(value) => setEditingMember({
                      ...editingMember,
                      staff_type: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="credentials">Certifications</Label>
                  <Input
                    id="credentials"
                    value={editingMember.credentials?.join(', ') || ''}
                    onChange={(e) => setEditingMember({
                      ...editingMember,
                      credentials: e.target.value
                        ? e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                        : []
                    })}
                    placeholder="Swim Angelfish, CPR/First Aid, WSI"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate multiple certifications with commas
                  </p>
                </div>

                <Button
                  className="w-full bg-[#2a5e84] hover:bg-[#1e4a6d]"
                  onClick={() => updateStaffMember({
                    id: editingMember.id,
                    display_on_team: editingMember.display_on_team,
                    display_order: editingMember.display_order,
                    staff_type: editingMember.staff_type,
                    credentials: editingMember.credentials
                  })}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Display Settings'}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}