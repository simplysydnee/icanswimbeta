'use client';

import { useState, useEffect } from 'react';
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
  role: 'parent' | 'instructor' | 'admin' | 'vmrc_coordinator';
  created_at: string;
  updated_at: string;
}

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string | null;
  coordinator_id: string | null;
  vmrc_coordinator_email: string | null;
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

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'parent' as 'parent' | 'instructor' | 'admin' | 'vmrc_coordinator'
  });

  const fetchUsers = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
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

      if (profilesError) throw profilesError;

      // Fetch roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch swimmers
      const { data: swimmersData, error: swimmersError } = await supabase
        .from('swimmers')
        .select('id, first_name, last_name, parent_id, coordinator_id, vmrc_coordinator_email');

      if (swimmersError) throw swimmersError;

      // Merge profiles with roles
      const usersWithRoles = (profilesData || []).map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'parent', // Default to parent if no role
        };
      });

      setUsers(usersWithRoles);
      setAllSwimmers(swimmersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    if (!transferSwimmerId || !newCoordinatorEmail) return;

    setSaving(true);
    const supabase = createClient();

    try {
      // Check if coordinator exists
      const { data: existingCoordinator } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', newCoordinatorEmail.toLowerCase())
        .single();

      let coordinatorId: string;
      let isNewCoordinator = false;

      if (existingCoordinator) {
        coordinatorId = existingCoordinator.id;
      } else {
        // Create new coordinator profile
        const newId = crypto.randomUUID();
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            email: newCoordinatorEmail.toLowerCase(),
            full_name: newCoordinatorName || null,
          });

        if (createError) throw createError;

        // Create role in user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: newId,
            role: 'vmrc_coordinator',
          });

        if (roleError) throw roleError;

        coordinatorId = newId;
        isNewCoordinator = true;
      }

      // Update swimmer with new coordinator
      const { error: updateError } = await supabase
        .from('swimmers')
        .update({
          coordinator_id: coordinatorId,
          vmrc_coordinator_email: newCoordinatorEmail.toLowerCase(),
          vmrc_coordinator_name: newCoordinatorName || existingCoordinator?.full_name || null,
        })
        .eq('id', transferSwimmerId);

      if (updateError) throw updateError;

      await fetchUsers();
      setTransferDialogOpen(false);
      setTransferSwimmerId('');
      setNewCoordinatorEmail('');
      setNewCoordinatorName('');

      if (isNewCoordinator) {
        alert(`Client transferred! New coordinator account created for ${newCoordinatorEmail}. They will need to sign up.`);
      } else {
        alert('Client transferred successfully!');
      }
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
      case 'vmrc_coordinator': return 'secondary';
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
          <Button variant="outline" onClick={() => setTransferDialogOpen(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Client
          </Button>
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
                        {user.role === 'vmrc_coordinator' && (
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
                          <Button variant="ghost" size="icon">
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
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="vmrc_coordinator">VMRC Coordinator</SelectItem>
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
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="vmrc_coordinator">VMRC Coordinator</SelectItem>
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
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Client to Coordinator</DialogTitle>
            <DialogDescription>
              Move a swimmer to a different coordinator. If the coordinator doesn't have an account, one will be created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Client to Transfer</Label>
              <Select value={transferSwimmerId} onValueChange={setTransferSwimmerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a swimmer..." />
                </SelectTrigger>
                <SelectContent>
                  {allSwimmers
                    .filter(s => s.coordinator_id || s.vmrc_coordinator_email)
                    .map(swimmer => (
                      <SelectItem key={swimmer.id} value={swimmer.id}>
                        {swimmer.first_name} {swimmer.last_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordEmail">New Coordinator Email *</Label>
              <Input
                id="coordEmail"
                type="email"
                placeholder="coordinator@vmrc.org"
                value={newCoordinatorEmail}
                onChange={(e) => setNewCoordinatorEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordName">Coordinator Name</Label>
              <Input
                id="coordName"
                placeholder="Jane Smith"
                value={newCoordinatorName}
                onChange={(e) => setNewCoordinatorName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required if creating a new coordinator account
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTransferClient}
              disabled={saving || !transferSwimmerId || !newCoordinatorEmail}
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