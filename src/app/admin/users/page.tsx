'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Edit, Trash2, Users, ArrowRightLeft, Check, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'parent' | 'instructor' | 'admin' | 'coordinator';
  created_at: string;
  updated_at: string;
}

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string | null;
  coordinator_id: string | null;
  funding_coordinator_email: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [allSwimmers, setAllSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkSwimmerDialogOpen, setLinkSwimmerDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSwimmerToLink, setSelectedSwimmerToLink] = useState<string>('');
  const [transferSwimmerId, setTransferSwimmerId] = useState<string>('');
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState('');
  const [newCoordinatorName, setNewCoordinatorName] = useState('');
  const [showNewCoordinatorForm, setShowNewCoordinatorForm] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'parent' as 'parent' | 'instructor' | 'admin' | 'coordinator'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      console.log('Starting fetchUsers...');

      // Fetch profiles with roles from user_roles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      console.log('Profiles fetch result:', {
        dataCount: profilesData?.length || 0,
        error: profilesError,
        sampleData: profilesData?.slice(0, 2)
      });

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      // Fetch roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      console.log('Roles fetch result:', {
        dataCount: rolesData?.length || 0,
        error: rolesError,
        sampleData: rolesData?.slice(0, 5)
      });

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        throw rolesError;
      }

      // Fetch swimmers
      const { data: swimmersData, error: swimmersError } = await supabase
        .from('swimmers')
        .select('id, first_name, last_name, parent_id, coordinator_id, funding_coordinator_email');

      console.log('Swimmers fetch result:', {
        dataCount: swimmersData?.length || 0,
        error: swimmersError,
        sampleData: swimmersData?.slice(0, 2)
      });

      if (swimmersError) {
        console.error('Swimmers fetch error:', swimmersError);
        // Don't throw - swimmers are optional for user display
      }

      // Merge profiles with roles
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        const role = userRole?.role || 'parent'; // Default to parent if no role
        console.log(`Profile ${profile.email} (${profile.id}) -> role: ${role}`);
        return {
          ...profile,
          role: role,
        };
      });

      console.log('Final usersWithRoles:', usersWithRoles);
      console.log('Total users:', usersWithRoles.length);

      setUsers(usersWithRoles);
      setAllSwimmers(swimmersData || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      alert('Error loading users. Check console for details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!newUser.email) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // First check if user exists in auth
      const { data: existingAuthUser } = await supabase.auth.admin.getUserById(newUser.email);

      let userId: string;
      if (existingAuthUser?.user) {
        userId = existingAuthUser.user.id;
      } else {
        // Create auth user (they'll need to set password via email)
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: newUser.email,
          email_confirm: true,
          user_metadata: {
            full_name: newUser.full_name,
            phone: newUser.phone
          }
        });

        if (authError) throw authError;
        userId = authData.user.id;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: newUser.email,
          full_name: newUser.full_name || null,
          phone: newUser.phone || null,
        });

      if (profileError) throw profileError;

      // Create role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newUser.role,
        });

      if (roleError) throw roleError;

      await fetchUsers();
      setAddDialogOpen(false);
      setNewUser({ email: '', full_name: '', phone: '', role: 'parent' });
      alert('User added successfully!');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // Update profile information
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: newUser.full_name || null,
          phone: newUser.phone || null,
        })
        .eq('id', selectedUser.id);

      if (profileError) throw profileError;

      // Check if user has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: newUser.role })
          .eq('user_id', selectedUser.id);

        if (roleError) throw roleError;
      } else {
        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.id, role: newUser.role });

        if (roleError) throw roleError;
      }

      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
      setNewUser({ email: '', full_name: '', phone: '', role: 'parent' });
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // Check if user has any swimmers linked
      const hasLinkedSwimmers = allSwimmers.some(s =>
        s.parent_id === selectedUser.id || s.coordinator_id === selectedUser.id
      );

      if (hasLinkedSwimmers) {
        alert('Cannot delete user with linked swimmers/clients. Please transfer or unlink them first.');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      alert('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkSwimmer = async () => {
    if (!selectedUser || !selectedSwimmerToLink) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('swimmers')
        .update({ parent_id: selectedUser.id })
        .eq('id', selectedSwimmerToLink);

      if (error) throw error;

      await fetchUsers();
      setLinkSwimmerDialogOpen(false);
      setSelectedSwimmerToLink('');
      alert('Swimmer linked successfully!');
    } catch (error) {
      console.error('Error linking swimmer:', error);
      alert('Failed to link swimmer');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferClient = async () => {
    if (!transferSwimmerId || !newCoordinatorEmail || !selectedUser) return;

    setSaving(true);
    const supabase = createClient();

    try {
      let coordinatorId: string;
      let isNewCoordinator = false;

      // Check if selecting existing coordinator or creating new one
      if (showNewCoordinatorForm) {
        // Creating new coordinator
        if (!newCoordinatorName) {
          alert('Please enter the coordinator name');
          setSaving(false);
          return;
        }

        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', newCoordinatorEmail.toLowerCase())
          .single();

        if (existingUser) {
          alert('A user with this email already exists. Please select them from the dropdown.');
          setSaving(false);
          return;
        }

        // Create new profile
        const newId = crypto.randomUUID();
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            email: newCoordinatorEmail.toLowerCase(),
            full_name: newCoordinatorName,
          });

        if (profileError) throw profileError;

        // Create role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newId,
            role: 'coordinator',
          });

        if (roleError) throw roleError;

        coordinatorId = newId;
        isNewCoordinator = true;
      } else {
        // Using existing coordinator - find their ID
        const { data: existingCoord } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', newCoordinatorEmail.toLowerCase())
          .single();

        if (!existingCoord) {
          alert('Coordinator not found');
          setSaving(false);
          return;
        }

        coordinatorId = existingCoord.id;
      }

      // Get coordinator name for the swimmer record
      const { data: coordProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', coordinatorId)
        .single();

      // Update swimmer with new coordinator
      const { error: updateError } = await supabase
        .from('swimmers')
        .update({
          coordinator_id: coordinatorId,
          funding_coordinator_email: newCoordinatorEmail.toLowerCase(),
          funding_coordinator_name: coordProfile?.full_name || newCoordinatorName || null,
        })
        .eq('id', transferSwimmerId);

      if (updateError) throw updateError;

      // Refresh data
      await fetchUsers();

      // Close dialog and reset
      setTransferDialogOpen(false);
      setSelectedUser(null);
      setTransferSwimmerId('');
      setNewCoordinatorEmail('');
      setNewCoordinatorName('');
      setShowNewCoordinatorForm(false);

      const swimmer = allSwimmers.find(s => s.id === transferSwimmerId);
      alert(
        isNewCoordinator
          ? `${swimmer?.first_name} transferred! New coordinator account created for ${newCoordinatorEmail}.`
          : `${swimmer?.first_name} transferred successfully!`
      );
    } catch (error) {
      console.error('Error transferring client:', error);
      alert('Failed to transfer client');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'instructor': return 'default';
      case 'coordinator': return 'secondary';
      case 'parent': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage all users, link swimmers, and transfer clients</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || '—'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        {user.role === 'parent' && (
                          <Badge variant="secondary" className="text-xs">
                            {allSwimmers.filter(s => s.parent_id === user.id).length} swimmers
                          </Badge>
                        )}
                        {user.role === 'coordinator' && (
                          <Badge variant="secondary" className="text-xs">
                            {allSwimmers.filter(s => s.coordinator_id === user.id).length} clients
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="More options">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedUser(user);
                            setNewUser({
                              email: user.email,
                              full_name: user.full_name || '',
                              phone: user.phone || '',
                              role: user.role
                            });
                            setEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {user.role === 'parent' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setLinkSwimmerDialogOpen(true);
                            }}>
                              <Users className="h-4 w-4 mr-2" />
                              Link Swimmer
                            </DropdownMenuItem>
                          )}
                          {(() => {
                            console.log('Checking role for Transfer Client:', user.email, 'role:', user.role, 'is coordinator?', user.role === 'coordinator');
                            return user.role === 'coordinator' && (
                              <DropdownMenuItem onClick={() => {
                                console.log('Transfer Client clicked for coordinator:', user.email, 'role:', user.role);
                                setSelectedUser(user);
                                setTransferDialogOpen(true);
                              }}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Transfer Client
                              </DropdownMenuItem>
                            );
                          })()}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="(555) 123-4567"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value as 'parent' | 'instructor' | 'admin' | 'coordinator' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={saving || !newUser.email}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={selectedUser?.email || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editFullName">Full Name</Label>
              <Input
                id="editFullName"
                placeholder="John Doe"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                placeholder="(555) 123-4567"
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value as 'parent' | 'instructor' | 'admin' | 'coordinator' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name || selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Swimmer Dialog */}
      <Dialog open={linkSwimmerDialogOpen} onOpenChange={setLinkSwimmerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Swimmer to Parent</DialogTitle>
            <DialogDescription>
              Assign a swimmer to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {selectedUser && (
              <div>
                <Label className="text-sm text-muted-foreground">Currently Linked Swimmers:</Label>
                <div className="mt-2 space-y-1">
                  {allSwimmers.filter(s => s.parent_id === selectedUser.id).length > 0 ? (
                    allSwimmers.filter(s => s.parent_id === selectedUser.id).map(s => (
                      <div key={s.id} className="text-sm flex items-center gap-2 p-2 bg-green-50 rounded">
                        <Check className="h-3 w-3 text-green-500" />
                        {s.first_name} {s.last_name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No swimmers linked yet</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Select Swimmer to Link</Label>
              <Select value={selectedSwimmerToLink} onValueChange={setSelectedSwimmerToLink}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a swimmer..." />
                </SelectTrigger>
                <SelectContent>
                  {allSwimmers
                    .filter(s => !s.parent_id)
                    .map(swimmer => (
                      <SelectItem key={swimmer.id} value={swimmer.id}>
                        {swimmer.first_name} {swimmer.last_name}
                      </SelectItem>
                    ))}
                  {allSwimmers.filter(s => !s.parent_id).length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">All swimmers are already linked</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkSwimmerDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkSwimmer} disabled={saving || !selectedSwimmerToLink}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Swimmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Client Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={(open) => {
        setTransferDialogOpen(open);
        if (!open) {
          setTransferSwimmerId('');
          setNewCoordinatorEmail('');
          setNewCoordinatorName('');
          setShowNewCoordinatorForm(false);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Transfer Client</DialogTitle>
            <DialogDescription>
              Transfer a client from {selectedUser?.full_name || selectedUser?.email} to another coordinator
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Step 1: Select Client */}
            <div className="space-y-2">
              <Label>Select Client to Transfer</Label>
              {allSwimmers.filter(s => s.coordinator_id === selectedUser?.id).length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                  This coordinator has no assigned clients.
                </p>
              ) : (
                <Select value={transferSwimmerId} onValueChange={setTransferSwimmerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSwimmers
                      .filter(s => s.coordinator_id === selectedUser?.id)
                      .map(swimmer => (
                        <SelectItem key={swimmer.id} value={swimmer.id}>
                          {swimmer.first_name} {swimmer.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Step 2: Select or Create New Coordinator */}
            {transferSwimmerId && (
              <>
                <div className="space-y-2">
                  <Label>Transfer To</Label>
                  <Select
                    value={newCoordinatorEmail}
                    onValueChange={(value) => {
                      if (value === '__new__') {
                        setShowNewCoordinatorForm(true);
                        setNewCoordinatorEmail('');
                      } else {
                        setShowNewCoordinatorForm(false);
                        setNewCoordinatorEmail(value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select coordinator..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const coordinators = users.filter(u => u.role === 'coordinator' && u.id !== selectedUser?.id);
                        console.log('Available coordinators for transfer:', coordinators.length, 'selectedUser:', selectedUser?.email);
                        return coordinators.map(coord => (
                          <SelectItem key={coord.id} value={coord.email}>
                            {coord.full_name || coord.email}
                          </SelectItem>
                        ));
                      })()}
                      <SelectItem value="__new__">
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add New Coordinator
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* New Coordinator Form */}
                {showNewCoordinatorForm && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-medium text-sm">New Coordinator Details</h4>
                    <div className="space-y-2">
                      <Label htmlFor="newCoordEmail">Email *</Label>
                      <Input
                        id="newCoordEmail"
                        type="email"
                        placeholder="coordinator@regional-center.org"
                        value={newCoordinatorEmail}
                        onChange={(e) => setNewCoordinatorEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCoordName">Full Name *</Label>
                      <Input
                        id="newCoordName"
                        placeholder="Jane Smith"
                        value={newCoordinatorName}
                        onChange={(e) => setNewCoordinatorName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransferClient}
              disabled={
                saving ||
                !transferSwimmerId ||
                !newCoordinatorEmail ||
                (showNewCoordinatorForm && !newCoordinatorName)
              }
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Transfer Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}