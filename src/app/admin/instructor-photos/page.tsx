'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, User, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { RoleGuard } from '@/components/auth/RoleGuard'

interface InstructorWithPhoto {
  id: string
  full_name: string
  email: string
  avatar_url: string
  photo_status: 'pending' | 'approved' | 'rejected'
  photo_uploaded_at: string
}

export default function InstructorPhotosAdminPage() {
  const [instructors, setInstructors] = useState<InstructorWithPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  const loadInstructors = async () => {
    try {
      setLoading(true)

      // Get all instructors with photos
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, photo_status, photo_uploaded_at')
        .not('avatar_url', 'is', null)
        .order('photo_uploaded_at', { ascending: false })

      if (error) throw error

      setInstructors(data || [])

    } catch (error) {
      console.error('Error loading instructors:', error)
      toast({
        title: 'Error',
        description: 'Failed to load instructor photos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInstructors()
  }, [])

  const approvePhoto = async (instructorId: string) => {
    try {
      setApproving(instructorId)

      const { error } = await supabase
        .from('profiles')
        .update({ photo_status: 'approved' })
        .eq('id', instructorId)

      if (error) throw error

      // Update local state
      setInstructors(prev =>
        prev.map(instructor =>
          instructor.id === instructorId
            ? { ...instructor, photo_status: 'approved' }
            : instructor
        )
      )

      toast({
        title: 'Photo approved',
        description: 'Instructor photo has been approved.',
      })

    } catch (error) {
      console.error('Error approving photo:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve photo',
        variant: 'destructive',
      })
    } finally {
      setApproving(null)
    }
  }

  const rejectPhoto = async (instructorId: string) => {
    try {
      setRejecting(instructorId)

      const { error } = await supabase
        .from('profiles')
        .update({
          photo_status: 'rejected',
          avatar_url: null // Remove the rejected photo
        })
        .eq('id', instructorId)

      if (error) throw error

      // Update local state - remove from list since avatar_url is now null
      setInstructors(prev =>
        prev.filter(instructor => instructor.id !== instructorId)
      )

      toast({
        title: 'Photo rejected',
        description: 'Instructor photo has been rejected and removed.',
      })

    } catch (error) {
      console.error('Error rejecting photo:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject photo',
        variant: 'destructive',
      })
    } finally {
      setRejecting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Instructor Photo Moderation</h1>
          <p className="text-muted-foreground">
            Review and approve instructor profile photos
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : instructors.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Photos to Review</h3>
              <p className="text-muted-foreground">
                All instructor photos have been reviewed or no photos have been uploaded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {instructors.map((instructor) => (
              <Card key={instructor.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Photo */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={instructor.avatar_url} alt={instructor.full_name} />
                        <AvatarFallback className="bg-[#0077B6] text-white text-xl">
                          {getInitials(instructor.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{instructor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{instructor.email}</p>
                        </div>
                        {getStatusBadge(instructor.photo_status)}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Uploaded: {new Date(instructor.photo_uploaded_at).toLocaleDateString()}
                      </div>

                      {/* Action buttons for pending photos */}
                      {instructor.photo_status === 'pending' && (
                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approvePhoto(instructor.id)}
                            disabled={approving === instructor.id || rejecting === instructor.id}
                          >
                            {approving === instructor.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4 mr-2" />
                            )}
                            Approve Photo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectPhoto(instructor.id)}
                            disabled={approving === instructor.id || rejecting === instructor.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {rejecting === instructor.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <X className="h-4 w-4 mr-2" />
                            )}
                            Reject Photo
                          </Button>
                        </div>
                      )}

                      {/* Guidelines */}
                      {instructor.photo_status === 'pending' && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          <p className="font-medium mb-1">Photo Guidelines:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Professional appearance</li>
                            <li>Clear face visible</li>
                            <li>Appropriate attire</li>
                            <li>No offensive content</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}