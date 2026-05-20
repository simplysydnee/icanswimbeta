'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Users,
  ArrowRightLeft,
  Check,
  Loader2,
  Search,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronsUpDown,
  Mail,
  Eye,
  Circle,
} from 'lucide-react';

type Role = 'parent' | 'instructor' | 'admin' | 'coordinator';

interface User {
  id: string;
  email: string;
  password?: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  swimmer_count: number;
  client_count: number;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  updated_at: string;
}

interface CoordinatorOption {
  id: string;
  email: string;
  full_name: string | null;
}

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string | null;
  coordinator_id: string | null;
  funding_coordinator_email: string | null;
  payment_type: string | null;
  funding_source_id: string | null;
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UsersPageInner />
    </Suspense>
  );
}

function UsersPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const roleFilter = (searchParams.get('role') ?? 'all') as 'all' | Role;
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const limitParam = parseInt(searchParams.get('limit') ?? '25', 10);
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const limit = Number.isFinite(limitParam) && limitParam >= 1 ? limitParam : 25;

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [allSwimmers, setAllSwimmers] = useState<Swimmer[]>([]);
  const [allCoordinators, setAllCoordinators] = useState<CoordinatorOption[]>([]);
  const [localSearch, setLocalSearch] = useState(search);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkSwimmerDialogOpen, setLinkSwimmerDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSwimmerToLink, setSelectedSwimmerToLink] = useState<string>('');
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [transferSwimmerId, setTransferSwimmerId] = useState<string>('');
  const [newCoordinatorEmail, setNewCoordinatorEmail] = useState('');
  const [newCoordinatorName, setNewCoordinatorName] = useState('');
  const [showNewCoordinatorForm, setShowNewCoordinatorForm] = useState(false);
  const [reassignSwimmerId, setReassignSwimmerId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteResults, setInviteResults] = useState<{ email: string; success: boolean; error?: string }[] | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'parent' as 'parent' | 'instructor' | 'admin' | 'coordinator'
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load users');

      setUsers(json.users ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 0);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      alert('Error loading users. Check console for details.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter]);

  const fetchAuxiliary = useCallback(async () => {
    const supabase = createClient();
    try {
      const [swimRes, coordRes] = await Promise.all([
        supabase
          .from('swimmers')
          .select('id, first_name, last_name, parent_id, coordinator_id, funding_coordinator_email, payment_type, funding_source_id'),
        supabase
          .from('user_roles')
          .select('user_id, role, profiles!inner(id, email, full_name)')
          .eq('role', 'coordinator'),
      ]);

      if (swimRes.error) console.error('Swimmers fetch error:', swimRes.error);
      setAllSwimmers((swimRes.data as Swimmer[] | null) ?? []);

      if (coordRes.error) {
        console.error('Coordinators fetch error:', coordRes.error);
        setAllCoordinators([]);
      } else {
        const coords = (coordRes.data ?? [])
          .map((row: any) => {
            const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
            return profile
              ? { id: profile.id as string, email: profile.email as string, full_name: profile.full_name as string | null }
              : null;
          })
          .filter((c): c is CoordinatorOption => c !== null);
        setAllCoordinators(coords);
      }
    } catch (error) {
      console.error('Error loading auxiliary data:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchAuxiliary();
  }, [fetchAuxiliary]);

  // Workaround: Radix Dialog + Portal-mounted overlays inside (Popover/Select/DropdownMenu)
  // can leak `pointer-events: none` onto <body>, freezing the page. Clear it once all
  // dialogs are closed and Radix's exit animation has had time to finish.
  useEffect(() => {
    const anyDialogOpen =
      addDialogOpen ||
      editDialogOpen ||
      deleteDialogOpen ||
      linkSwimmerDialogOpen ||
      transferDialogOpen ||
      reassignDialogOpen;
    if (anyDialogOpen) return;

    const clearLeak = () => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
    };
    const t1 = setTimeout(clearLeak, 200);
    const t2 = setTimeout(clearLeak, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    addDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    linkSwimmerDialogOpen,
    transferDialogOpen,
    reassignDialogOpen,
  ]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchAuxiliary()]);
  }, [fetchUsers, fetchAuxiliary]);

  // URL filter helpers (mirror SwimmerManagementTable)
  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) params.delete(key);
        else params.set(key, value);
      });
      return params.toString();
    },
    [searchParams]
  );

  const updateFilter = useCallback(
    (key: string, value: string | null, opts?: { resetPage?: boolean }) => {
      const updates: Record<string, string | null> = { [key]: value };
      if (opts?.resetPage !== false && key !== 'page') updates.page = '1';
      const qs = createQueryString(updates);
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [createQueryString, router, pathname]
  );

  // Debounced search -> URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        updateFilter('search', localSearch || null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, updateFilter]);

  // Sync local input when URL changes externally (back/forward)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // If the current page is now beyond the last page (e.g. after a delete), step back
  useEffect(() => {
    if (!loading && totalPages > 0 && page > totalPages) {
      updateFilter('page', String(totalPages));
    }
  }, [loading, totalPages, page, updateFilter]);

  // const handleAddUser = async () => {
  //   if (!newUser.email) return;

  //   setSaving(true);
  //   const supabase = createClient();

  //   try {
  //     // First check if user exists in auth
  //     const { data: existingAuthUser } = await supabase.auth.admin.getUserById(newUser.email);

  //     let userId: string;
  //     if (existingAuthUser?.user) {
  //       userId = existingAuthUser.user.id;
  //     } else {
  //       // Create auth user (they'll need to set password via email)
  //       const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  //         email: newUser.email,
  //         email_confirm: true,
  //         user_metadata: {
  //           full_name: newUser.full_name,
  //           phone: newUser.phone
  //         }
  //       });

  //       if (authError) throw authError;
  //       userId = authData.user.id;
  //     }

  //     // Create profile
  //     const { error: profileError } = await supabase
  //       .from('profiles')
  //       .insert({
  //         id: userId,
  //         email: newUser.email,
  //         full_name: newUser.full_name || null,
  //         phone: newUser.phone || null,
  //       });

  //     if (profileError) throw profileError;

  //     // Create role in user_roles table
  //     const { error: roleError } = await supabase
  //       .from('user_roles')
  //       .insert({
  //         user_id: userId,
  //         role: newUser.role,
  //       });

  //     if (roleError) throw roleError;

  //     await fetchUsers();
  //     setAddDialogOpen(false);
  //     setNewUser({ email: '', full_name: '', phone: '', role: 'parent' });
  //     alert('User added successfully!');
  //   } catch (error) {
  //     console.error('Error adding user:', error);
  //     alert('Failed to add user');
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  const handleAddUser = async () => {
    if (!newUser.email) return;

    setSaving(true);

    try {
      const res = await fetch('/api/auth/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email.trim(),
          password: newUser.password, // make sure you add this field in UI state
          name: newUser.full_name,
          phone: newUser.phone,
          role: newUser.role,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to add user');

      await refreshAll();
      setAddDialogOpen(false);
      setNewUser({ email: '', full_name: '', phone: '', role: 'parent', password: '' });
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

      await refreshAll();
      setEditDialogOpen(false);
      setSelectedUser(null);
      setNewUser({ email: '', password: '', full_name: '', phone: '', role: 'parent' });
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

      await refreshAll();
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

      await refreshAll();
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
      await refreshAll();

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

  const handleReassignCoordinator = async () => {
    if (!selectedUser || !reassignSwimmerId) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const { data: targetCoord, error: coordErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, funding_source_id')
        .eq('id', selectedUser.id)
        .single();

      if (coordErr || !targetCoord) throw coordErr ?? new Error('Coordinator not found');

      const { error: updateError } = await supabase
        .from('swimmers')
        .update({
          coordinator_id: targetCoord.id,
          funding_source_id: targetCoord.funding_source_id,
          funding_coordinator_name: targetCoord.full_name,
          funding_coordinator_email: targetCoord.email ? String(targetCoord.email).toLowerCase() : null,
          funding_coordinator_phone: targetCoord.phone,
        })
        .eq('id', reassignSwimmerId);

      if (updateError) throw updateError;

      await refreshAll();
      setReassignDialogOpen(false);
      setReassignSwimmerId('');
      alert('Swimmer assigned successfully!');
    } catch (error) {
      console.error('Error assigning swimmer:', error);
      alert('Failed to assign swimmer');
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

  // Selection handlers
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length && users.length > 0) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)));
    }
  };

  const allSelected = users.length > 0 && selectedUserIds.size === users.length;

  const handleBulkInvite = async () => {
    const ids = Array.from(selectedUserIds);
    if (ids.length === 0) return;

    setInviteLoading(true);
    setInviteResults(null);

    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: ids }),
      });
      const json = await res.json();
      setInviteResults(json.results ?? []);
    } catch (error) {
      console.error('Bulk invite error:', error);
      setInviteResults([{ email: '', success: false, error: 'Network error — check console' }]);
    } finally {
      setInviteLoading(false);
    }
  };

  const getLoginStatusDot = (user: User) => {
    if (!user.last_login_at) return { color: 'text-gray-300', label: 'Never logged in' };
    const daysSince = (Date.now() - new Date(user.last_login_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) return { color: 'text-green-500', label: `Logged in ${Math.round(daysSince * 24)} hours ago` };
    if (daysSince < 7) return { color: 'text-yellow-500', label: `Logged in ${Math.round(daysSince)} days ago` };
    return { color: 'text-red-500', label: `Logged in ${Math.round(daysSince)} days ago` };
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

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => updateFilter('role', value === 'all' ? null : value)}
        >
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="coordinator">Coordinator</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
        <div className="md:ml-auto text-sm text-muted-foreground">
          {total === 0
            ? 'No users'
            : `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, total)} of ${total} users`}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border">
          {/* Bulk action bar */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/20">
              <span className="text-sm font-medium">{selectedUserIds.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInviteDialogOpen(true)}
                disabled={inviteLoading}
              >
                <Mail className="h-4 w-4 mr-1.5" />
                Send Invite
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-muted-foreground"
                onClick={() => setSelectedUserIds(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {search || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const dot = getLoginStatusDot(user);
                  return (
                  <TableRow key={`${user.id}-${user.role}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUserIds.has(user.id)}
                        onCheckedChange={() => toggleSelectUser(user.id)}
                        aria-label={`Select ${user.full_name || user.email}`}
                      />
                    </TableCell>
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
                            {user.swimmer_count} swimmers
                          </Badge>
                        )}
                        {user.role === 'coordinator' && (
                          <Badge variant="secondary" className="text-xs">
                            {user.client_count} clients
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-default">
                              <Circle className={`h-3 w-3 fill-current ${dot.color}`} />
                              <span className="text-xs text-muted-foreground">
                                {user.login_count ?? 0}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {dot.label}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
                              password: user.password ?? '',
                              full_name: user.full_name || '',
                              phone: user.phone || '',
                              role: user.role
                            });
                            setEditDialogOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedUserIds(new Set([user.id]));
                            setInviteDialogOpen(true);
                          }}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invite
                          </DropdownMenuItem>
                          {(user.role === 'parent' || user.role === 'coordinator') && (
                            <DropdownMenuItem onClick={() => {
                              const portal = user.role === 'parent' ? 'parent' : 'coordinator';
                              window.open(`/admin/view-as/${portal}/${user.id}`, '_blank');
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Portal
                            </DropdownMenuItem>
                          )}
                          {user.role === 'parent' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setLinkSwimmerDialogOpen(true);
                            }}>
                              <Users className="h-4 w-4 mr-2" />
                              Link Swimmer
                            </DropdownMenuItem>
                          )}
                          {user.role === 'coordinator' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setTransferDialogOpen(true);
                            }}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Transfer Client
                            </DropdownMenuItem>
                          )}
                          {user.role === 'coordinator' && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setReassignDialogOpen(true);
                            }}>
                              <Users className="h-4 w-4 mr-2" />
                              Assign Swimmer
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
                  );
                })
              )}
            </TableBody>
          </Table>
          {total > 0 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Select
                  value={String(limit)}
                  onValueChange={(v) => updateFilter('limit', v)}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>per page</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">
                  Page {Math.min(page, Math.max(1, totalPages))} of {Math.max(1, totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('page', '1')}
                  disabled={page <= 1}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('page', String(page - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('page', String(page + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => updateFilter('page', String(totalPages))}
                  disabled={page >= totalPages}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
      <Dialog open={linkSwimmerDialogOpen} onOpenChange={(open) => {
        setLinkSwimmerDialogOpen(open);
        if (!open) {
          setSelectedSwimmerToLink('');
          setLinkPickerOpen(false);
          setLinkSearch('');
        }
      }}>
        <DialogContent className="max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Swimmer to Parent</DialogTitle>
            <DialogDescription>
              Assign a swimmer to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Select Swimmer to Link</Label>
              {(() => {
                const selectedSwimmer = allSwimmers.find(s => s.id === selectedSwimmerToLink);
                const q = linkSearch.toLowerCase().trim();
                const filtered = q
                  ? allSwimmers.filter(s => `${s.first_name} ${s.last_name}`.toLowerCase().includes(q))
                  : allSwimmers;
                return (
                  <Popover
                    open={linkPickerOpen}
                    onOpenChange={(open) => {
                      setLinkPickerOpen(open);
                      if (!open) setLinkSearch('');
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={linkPickerOpen}
                        className="w-full justify-between font-normal"
                      >
                        <span className={selectedSwimmer ? '' : 'text-muted-foreground'}>
                          {selectedSwimmer
                            ? `${selectedSwimmer.first_name} ${selectedSwimmer.last_name}`
                            : 'Select a swimmer...'}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="p-0 w-[var(--radix-popover-trigger-width)]"
                    >
                      <div className="p-2 border-b">
                        <Input
                          autoFocus
                          placeholder="Search by name..."
                          value={linkSearch}
                          onChange={(e) => setLinkSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto py-1">
                        {allSwimmers.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No swimmers in the system yet.</div>
                        ) : filtered.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground">No matches.</div>
                        ) : (
                          filtered.map(swimmer => {
                            const suffix = swimmer.parent_id == null
                              ? ' — unassigned'
                              : swimmer.parent_id === selectedUser?.id
                                ? ' — already with this parent'
                                : ' — linked to another parent';
                            const isSelected = swimmer.id === selectedSwimmerToLink;
                            return (
                              <button
                                key={swimmer.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSwimmerToLink(swimmer.id);
                                  setLinkPickerOpen(false);
                                  setLinkSearch('');
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                              >
                                <Check className={`h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                <span>{swimmer.first_name} {swimmer.last_name}{suffix}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
            </div>

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
                      {allCoordinators
                        .filter((coord) => coord.id !== selectedUser?.id)
                        .map((coord) => (
                          <SelectItem key={coord.id} value={coord.email}>
                            {coord.full_name || coord.email}
                          </SelectItem>
                        ))}
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

      {/* Invite Users Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => {
        setInviteDialogOpen(open);
        if (!open) {
          if (!inviteLoading) {
            setInviteResults(null);
            setSelectedUserIds(new Set());
          }
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Invitation{selectedUserIds.size > 1 ? 's' : ''}</DialogTitle>
            <DialogDescription>
              Send login invitation emails to {selectedUserIds.size} selected user{selectedUserIds.size > 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {inviteResults ? (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Results</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {inviteResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm p-2 rounded ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      {r.success ? (
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 text-red-600 shrink-0">✗</span>
                      )}
                      <span className={r.success ? 'text-green-800' : 'text-red-800'}>
                        {r.email}: {r.success ? 'Invitation sent' : r.error}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-2" onClick={() => {
                  setInviteDialogOpen(false);
                  setInviteResults(null);
                  setSelectedUserIds(new Set());
                }}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  An invitation email will be sent to:
                </p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {users.filter(u => selectedUserIds.has(u.id)).map(u => (
                    <div key={u.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>{u.full_name || 'Unnamed'}</span>
                      <span className="text-muted-foreground">{u.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!inviteResults && (
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setInviteDialogOpen(false);
                setSelectedUserIds(new Set());
              }}>
                Cancel
              </Button>
              <Button onClick={handleBulkInvite} disabled={inviteLoading}>
                {inviteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Invitation{selectedUserIds.size > 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Swimmer to Coordinator Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={(open) => {
        setReassignDialogOpen(open);
        if (!open) setReassignSwimmerId('');
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Swimmer to Coordinator</DialogTitle>
            <DialogDescription>
              Assign a funding-source swimmer to {selectedUser?.full_name || selectedUser?.email}. If the swimmer is currently with another coordinator, they will be removed from that coordinator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Swimmer</Label>
              {allSwimmers.filter(s => s.payment_type === 'funding_source').length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                  No funding-source swimmers available to assign.
                </p>
              ) : (
                <Select value={reassignSwimmerId} onValueChange={setReassignSwimmerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a swimmer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allSwimmers
                      .filter(s => s.payment_type === 'funding_source')
                      .map(swimmer => {
                        const currentCoord = swimmer.coordinator_id
                          ? allCoordinators.find(c => c.id === swimmer.coordinator_id)
                          : null;
                        const suffix = currentCoord
                          ? ` — currently: ${currentCoord.full_name || currentCoord.email}`
                          : ' — unassigned';
                        return (
                          <SelectItem key={swimmer.id} value={swimmer.id}>
                            {swimmer.first_name} {swimmer.last_name}{suffix}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReassignCoordinator}
              disabled={saving || !reassignSwimmerId}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}