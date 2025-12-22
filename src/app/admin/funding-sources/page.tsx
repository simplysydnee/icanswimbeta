'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Building,
  DollarSign,
  Settings,
  Loader2,
  Search,
  Filter
} from 'lucide-react'

interface FundingSource {
  id: string
  name: string
  short_name: string | null
  description: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  allowed_email_domains: string[]
  default_coordinator_role: string
  assessment_sessions: number
  lessons_per_po: number
  po_duration_months: number
  renewal_alert_threshold: number
  billing_contact_name: string | null
  billing_contact_email: string | null
  billing_contact_phone: string | null
  billing_address: string | null
  billing_notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function FundingSourcesPage() {
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<FundingSource | null>(null)
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    description: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    allowed_email_domains: '',
    default_coordinator_role: 'coordinator',
    assessment_sessions: 1,
    lessons_per_po: 12,
    po_duration_months: 3,
    renewal_alert_threshold: 11,
    billing_contact_name: '',
    billing_contact_email: '',
    billing_contact_phone: '',
    billing_address: '',
    billing_notes: '',
    is_active: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const supabase = createClient()

  const fetchFundingSources = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('funding_sources')
        .select('*')
        .order('name')

      if (error) throw error
      setFundingSources(data || [])
    } catch (error) {
      console.error('Error fetching funding sources:', error)
      toast({
        title: 'Error',
        description: 'Failed to load funding sources',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchFundingSources()
  }, [fetchFundingSources])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : Number(value)
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_active: checked
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.short_name.trim()) {
      errors.short_name = 'Short name is required'
    }

    if (!formData.allowed_email_domains.trim()) {
      errors.allowed_email_domains = 'At least one email domain is required'
    } else {
      const domains = formData.allowed_email_domains.split(',').map(d => d.trim())
      const invalidDomains = domains.filter(d => !d.startsWith('@'))
      if (invalidDomains.length > 0) {
        errors.allowed_email_domains = 'Email domains must start with @ (e.g., @regional-center.net, @funding.org)'
      }
    }

    if (formData.assessment_sessions < 0) {
      errors.assessment_sessions = 'Assessment sessions must be 0 or more'
    }

    if (formData.lessons_per_po <= 0) {
      errors.lessons_per_po = 'Lessons per PO must be greater than 0'
    }

    if (formData.po_duration_months <= 0) {
      errors.po_duration_months = 'PO duration must be greater than 0 months'
    }

    if (formData.renewal_alert_threshold < 0 || formData.renewal_alert_threshold > formData.lessons_per_po) {
      errors.renewal_alert_threshold = `Renewal alert must be between 0 and ${formData.lessons_per_po}`
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const fundingSourceData = {
        ...formData,
        allowed_email_domains: formData.allowed_email_domains
          .split(',')
          .map(d => d.trim())
          .filter(d => d)
      }

      if (editingSource) {
        // Update existing funding source
        const { error } = await supabase
          .from('funding_sources')
          .update(fundingSourceData)
          .eq('id', editingSource.id)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Funding source updated successfully'
        })
      } else {
        // Create new funding source
        const { error } = await supabase
          .from('funding_sources')
          .insert([fundingSourceData])

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Funding source created successfully'
        })
      }

      // Reset form and refresh data
      resetForm()
      fetchFundingSources()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving funding source:', error)
      console.error('Error details:', JSON.stringify(error))
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save funding source',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      description: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      website: '',
      allowed_email_domains: '',
      default_coordinator_role: 'coordinator',
      assessment_sessions: 1,
      lessons_per_po: 12,
      po_duration_months: 3,
      renewal_alert_threshold: 11,
      billing_contact_name: '',
      billing_contact_email: '',
      billing_contact_phone: '',
      billing_address: '',
      billing_notes: '',
      is_active: true
    })
    setEditingSource(null)
    setFormErrors({})
  }

  const handleEdit = (source: FundingSource) => {
    setEditingSource(source)
    setFormData({
      name: source.name,
      short_name: source.short_name || '',
      description: source.description || '',
      contact_name: source.contact_name || '',
      contact_email: source.contact_email || '',
      contact_phone: source.contact_phone || '',
      website: source.website || '',
      allowed_email_domains: source.allowed_email_domains?.join(', ') || '',
      default_coordinator_role: source.default_coordinator_role,
      assessment_sessions: source.assessment_sessions,
      lessons_per_po: source.lessons_per_po,
      po_duration_months: source.po_duration_months,
      renewal_alert_threshold: source.renewal_alert_threshold,
      billing_contact_name: source.billing_contact_name || '',
      billing_contact_email: source.billing_contact_email || '',
      billing_contact_phone: source.billing_contact_phone || '',
      billing_address: source.billing_address || '',
      billing_notes: source.billing_notes || '',
      is_active: source.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteSourceId) return

    try {
      // Check if any swimmers are using this funding source
      const { data: swimmers, error: swimmersError } = await supabase
        .from('swimmers')
        .select('id')
        .eq('funding_source_id', deleteSourceId)
        .limit(1)

      if (swimmersError) throw swimmersError

      if (swimmers && swimmers.length > 0) {
        toast({
          title: 'Cannot Delete',
          description: 'This funding source is being used by swimmers. Deactivate it instead.',
          variant: 'destructive'
        })
        setIsDeleteDialogOpen(false)
        setDeleteSourceId(null)
        return
      }

      // Delete the funding source
      const { error } = await supabase
        .from('funding_sources')
        .delete()
        .eq('id', deleteSourceId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Funding source deleted successfully'
      })

      fetchFundingSources()
    } catch (error) {
      console.error('Error deleting funding source:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete funding source',
        variant: 'destructive'
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteSourceId(null)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const filteredSources = fundingSources.filter(source => {
    const matchesSearch =
      source.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      source.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesActiveFilter = showActiveOnly ? source.is_active : true

    return matchesSearch && matchesActiveFilter
  })

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Funding Sources</h1>
              <p className="text-muted-foreground">
                Manage state-funded vendors and agencies
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Funding Source
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingSource ? 'Edit Funding Source' : 'Add New Funding Source'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSource
                      ? 'Update the details for this funding source.'
                      : 'Add a new state-funded vendor or agency.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="e.g., Valley Mountain Regional Center"
                      />
                      {formErrors.name && (
                        <p className="text-sm text-destructive">{formErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="short_name">Short Name *</Label>
                      <Input
                        id="short_name"
                        name="short_name"
                        value={formData.short_name}
                        onChange={handleInputChange}
                        placeholder="e.g., Funded"
                      />
                      {formErrors.short_name && (
                        <p className="text-sm text-destructive">{formErrors.short_name}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Brief description of the funding source"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input
                        id="contact_name"
                        name="contact_name"
                        value={formData.contact_name}
                        onChange={handleInputChange}
                        placeholder="Primary contact person"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        placeholder="contact@example.org"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        value={formData.contact_phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://example.org"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="allowed_email_domains">Allowed Email Domains *</Label>
                      <Input
                        id="allowed_email_domains"
                        name="allowed_email_domains"
                        value={formData.allowed_email_domains}
                        onChange={handleInputChange}
                        placeholder="@regional-center.net, @funding.org"
                      />
                      <p className="text-sm text-muted-foreground">
                        Comma-separated list of email domains allowed for coordinators from this funding source
                      </p>
                      {formErrors.allowed_email_domains && (
                        <p className="text-sm text-destructive">{formErrors.allowed_email_domains}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assessment_sessions">Assessment Sessions</Label>
                      <Input
                        id="assessment_sessions"
                        name="assessment_sessions"
                        type="number"
                        min="0"
                        value={formData.assessment_sessions}
                        onChange={handleNumberChange}
                      />
                      {formErrors.assessment_sessions && (
                        <p className="text-sm text-destructive">{formErrors.assessment_sessions}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lessons_per_po">Lessons per PO</Label>
                      <Input
                        id="lessons_per_po"
                        name="lessons_per_po"
                        type="number"
                        min="1"
                        value={formData.lessons_per_po}
                        onChange={handleNumberChange}
                      />
                      {formErrors.lessons_per_po && (
                        <p className="text-sm text-destructive">{formErrors.lessons_per_po}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="po_duration_months">PO Duration (months)</Label>
                      <Input
                        id="po_duration_months"
                        name="po_duration_months"
                        type="number"
                        min="1"
                        value={formData.po_duration_months}
                        onChange={handleNumberChange}
                      />
                      {formErrors.po_duration_months && (
                        <p className="text-sm text-destructive">{formErrors.po_duration_months}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="renewal_alert_threshold">Renewal Alert Threshold</Label>
                      <Input
                        id="renewal_alert_threshold"
                        name="renewal_alert_threshold"
                        type="number"
                        min="0"
                        max={formData.lessons_per_po}
                        value={formData.renewal_alert_threshold}
                        onChange={handleNumberChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        Alert when this many sessions are used (0-{formData.lessons_per_po})
                      </p>
                      {formErrors.renewal_alert_threshold && (
                        <p className="text-sm text-destructive">{formErrors.renewal_alert_threshold}</p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="billing_contact_name">Billing Contact Name</Label>
                      <Input
                        id="billing_contact_name"
                        name="billing_contact_name"
                        value={formData.billing_contact_name}
                        onChange={handleInputChange}
                        placeholder="Billing department contact"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_contact_email">Billing Contact Email</Label>
                      <Input
                        id="billing_contact_email"
                        name="billing_contact_email"
                        type="email"
                        value={formData.billing_contact_email}
                        onChange={handleInputChange}
                        placeholder="billing@example.org"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="billing_contact_phone">Billing Contact Phone</Label>
                      <Input
                        id="billing_contact_phone"
                        name="billing_contact_phone"
                        value={formData.billing_contact_phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="billing_address">Billing Address</Label>
                      <Textarea
                        id="billing_address"
                        name="billing_address"
                        value={formData.billing_address}
                        onChange={handleInputChange}
                        placeholder="Full billing address"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="billing_notes">Billing Notes</Label>
                      <Textarea
                        id="billing_notes"
                        name="billing_notes"
                        value={formData.billing_notes}
                        onChange={handleInputChange}
                        placeholder="Any special billing instructions"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={handleSwitchChange}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingSource ? 'Update' : 'Create'} Funding Source
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Funding Sources List</CardTitle>
              <CardDescription>
                Manage all state-funded vendors and agencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search funding sources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="active-filter" className="text-sm">Active Only</Label>
                  <Switch
                    id="active-filter"
                    checked={showActiveOnly}
                    onCheckedChange={setShowActiveOnly}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSources.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No funding sources found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Try a different search term' : 'Get started by adding your first funding source'}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Short Name</TableHead>
                        <TableHead>Email Domains</TableHead>
                        <TableHead>Configuration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              {source.name}
                            </div>
                            {source.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {source.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{source.short_name}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {source.allowed_email_domains?.map((domain, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {domain}
                                </Badge>
                              )) || <span className="text-gray-400 text-sm">No domains</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <Settings className="h-3 w-3" />
                                <span>{source.assessment_sessions} assessment(s)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                <span>{source.lessons_per_po} lessons/PO</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {source.po_duration_months} months duration
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {source.is_active ? (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(source)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setDeleteSourceId(source.id)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the funding source
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RoleGuard>
  )
}