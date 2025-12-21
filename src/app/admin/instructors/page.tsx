'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { InstructorAvatar } from '@/components/ui/instructor-avatar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Pencil, User, Upload } from 'lucide-react'

interface Instructor {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  title: string | null
  bio: string | null
  phone: string | null
  is_active: boolean
}

export default function InstructorsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  const objectUrlRef = useRef<string | null>(null)

  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    title: '',
    bio: '',
    phone: '',
    avatar_url: '',
  })

  const fetchInstructors = async () => {
    setLoading(true)

    // Get instructor user IDs
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'instructor')

    if (roleError) {
      console.error('Error fetching instructor roles:', roleError)
      toast({ title: 'Error', description: 'Failed to load instructor roles', variant: 'destructive' })
      setInstructors([])
      setLoading(false)
      return
    }

    if (roleData && Array.isArray(roleData) && roleData.length > 0) {
      const instructorIds = roleData.map(r => r.user_id)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, title, bio, phone, is_active')
        .in('id', instructorIds)
        .order('full_name')

      if (error) {
        toast({ title: 'Error', description: 'Failed to load instructors', variant: 'destructive' })
      } else {
        setInstructors(profiles || [])
      }
    } else {
      setInstructors([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInstructors()

    // Cleanup on component unmount
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [])

  const openAddDialog = () => {
    setEditingInstructor(null)
    setFormData({ email: '', full_name: '', title: '', bio: '', phone: '', avatar_url: '' })
    setShowDialog(true)
  }

  const closeDialog = () => {
    // Clean up object URL when dialog closes
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setShowDialog(false)
  }

  const openEditDialog = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      email: instructor.email,
      full_name: instructor.full_name || '',
      title: instructor.title || '',
      bio: instructor.bio || '',
      phone: instructor.phone || '',
      avatar_url: instructor.avatar_url || '',
    })
    setShowDialog(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB', variant: 'destructive' })
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file type', description: 'Please upload an image file', variant: 'destructive' })
      return
    }

    setUploadingImage(true)

    // Clean up previous object URL if exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
    }

    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file)
    objectUrlRef.current = previewUrl
    setFormData({ ...formData, avatar_url: previewUrl })

    const fileExt = file.name.split('.').pop()
    const fileName = `instructor-${Date.now()}.${fileExt}`

    // Get current user ID for folder structure from useAuth hook
    const userId = user?.id || 'admin'

    // Upload to user's folder to comply with storage policy
    const folderPath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(folderPath, file)

    if (error) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })
      // Revert to previous avatar URL if upload fails
      setFormData({ ...formData, avatar_url: editingInstructor?.avatar_url || '' })
    } else {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(folderPath)
      setFormData({ ...formData, avatar_url: publicUrl })
    }
    setUploadingImage(false)
  }

  const handleSave = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address', variant: 'destructive' })
      return
    }

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      toast({ title: 'Invalid Name', description: 'Please enter a valid full name', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      if (editingInstructor) {
        // Update existing instructor profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name.trim(),
            title: formData.title?.trim() || null,
            bio: formData.bio?.trim() || null,
            phone: formData.phone?.trim() || null,
            avatar_url: formData.avatar_url?.trim() || null,
          })
          .eq('id', editingInstructor.id)

        if (error) {
          throw new Error(error.message)
        }

        toast({ title: 'Success', description: 'Instructor updated successfully' })
        closeDialog()
        fetchInstructors()
      } else {
        // Create new instructor via API route
        const response = await fetch('/api/admin/instructors/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            title: formData.title?.trim() || '',
            bio: formData.bio?.trim() || '',
            phone: formData.phone?.trim() || '',
            avatar_url: formData.avatar_url?.trim() || '',
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          // Provide more specific error messages
          let errorMessage = result.error || `Failed to add instructor (Status: ${response.status})`

          if (response.status === 400 && result.error?.includes('already exists')) {
            errorMessage = `A user with email "${formData.email}" already exists in the system. Please use a different email.`
          } else if (response.status === 401) {
            errorMessage = 'Unauthorized. Please make sure you are logged in as an administrator.'
          } else if (response.status === 403) {
            errorMessage = 'Admin access required. You do not have permission to add instructors.'
          } else if (response.status === 500 && result.error?.includes('Failed to create profile')) {
            errorMessage = `Failed to create instructor profile: ${result.error}`
          }

          throw new Error(errorMessage)
        }

        toast({
          title: 'Success',
          description: result.message || 'Instructor added. They will receive an email to set their password.'
        })
        closeDialog()
        fetchInstructors()
      }
    } catch (error: unknown) {
      console.error('Save error:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (instructor: Instructor) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !instructor.is_active })
      .eq('id', instructor.id)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      fetchInstructors()
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IN'
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
            <p className="text-gray-600">Manage swim instructors and their profiles</p>
          </div>
          <Button onClick={openAddDialog} className="bg-[#2a5e84] hover:bg-[#1e4a6d]">
            <Plus className="h-4 w-4 mr-2" />
            Add Instructor
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#2a5e84]" />
              </div>
            ) : instructors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No instructors added yet</p>
                <Button onClick={openAddDialog} variant="outline" className="mt-4">
                  Add Your First Instructor
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructors.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InstructorAvatar
                            name={instructor.full_name}
                            avatarUrl={instructor.avatar_url}
                            size="sm"
                            showName={false}
                          />
                          <div>
                            <p className="font-medium">{instructor.full_name}</p>
                            {instructor.bio && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{instructor.bio}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {instructor.title && <Badge variant="outline">{instructor.title}</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{instructor.email}</TableCell>
                      <TableCell>
                        <Switch
                          checked={instructor.is_active !== false}
                          onCheckedChange={() => toggleActive(instructor)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(instructor)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingInstructor ? 'Edit Instructor' : 'Add Instructor'}</DialogTitle>
              <DialogDescription>
                {editingInstructor ? 'Update instructor profile' : 'Add a new instructor. They will receive an email to set their password.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.avatar_url || undefined} />
                  <AvatarFallback className="bg-[#2a5e84] text-white text-xl">
                    {formData.full_name ? getInitials(formData.full_name) : 'IN'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-[#2a5e84] hover:underline">
                      {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload Photo
                    </div>
                  </Label>
                  <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    placeholder="Jane Smith"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@icanswim209.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!editingInstructor}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Lead Instructor"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="(209) 555-1234"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Brief description of experience and specialties..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-[#2a5e84] hover:bg-[#1e4a6d]">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingInstructor ? 'Update' : 'Add'} Instructor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}