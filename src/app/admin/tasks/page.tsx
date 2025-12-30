'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Filter, X, CheckSquare, AlertCircle, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanBoard } from './components/KanbanBoard';
import { CreateTaskModal } from './components/CreateTaskModal';
import { EditTaskModal } from './components/EditTaskModal';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'needs_attention';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'swimmer_related' | 'business_operations' | 'follow_up' | 'other';
  due_date: string | null;
  assigned_to: string | null;
  swimmer_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  assigned_to_user?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  created_by_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  swimmer?: {
    id: string;
    first_name: string;
    last_name: string;
    client_number: string;
  } | null;
}

interface User {
  id: string;
  full_name: string | null;
  email: string;
}

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  client_number: string;
}

export default function TasksPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assigned_to: 'all',
    created_by: 'all',
    category: 'all',
    priority: 'all',
    swimmer_id: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPastTasks, setShowPastTasks] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.assigned_to && filters.assigned_to !== 'all') queryParams.append('assigned_to', filters.assigned_to);
      if (filters.created_by && filters.created_by !== 'all') queryParams.append('created_by', filters.created_by);
      if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.priority && filters.priority !== 'all') queryParams.append('priority', filters.priority);
      if (filters.swimmer_id && filters.swimmer_id !== 'all') queryParams.append('swimmer_id', filters.swimmer_id);

      const response = await fetch(`/api/tasks?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchUsers = useCallback(async () => {
    try {
      // Try to fetch users from profiles table
      const response = await fetch('/api/tasks/users');
      if (!response.ok) {
        // If that fails, create a mock list with current user
        console.warn('Could not fetch users, using current user only');
        setUsers(user ? [{
          id: user.id,
          full_name: user.fullName || null,
          email: user.email || '',
        }] : []);
        return;
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to current user only
      setUsers(user ? [{
        id: user.id,
        full_name: user.fullName || null,
        email: user.email || '',
      }] : []);
    }
  }, [user]);

  const fetchSwimmers = useCallback(async () => {
    try {
      const response = await fetch('/api/swimmers?limit=100');
      if (!response.ok) throw new Error('Failed to fetch swimmers');
      const data = await response.json();
      setSwimmers(data.swimmers || []);
    } catch (error) {
      console.error('Error fetching swimmers:', error);
    }
  }, []);

  useEffect(() => {
    if (role && role !== 'admin' && role !== 'instructor') {
      router.push('/dashboard');
    } else if (user) {
      Promise.all([fetchTasks(), fetchUsers(), fetchSwimmers()]);
    }
  }, [role, user, router, fetchTasks, fetchUsers, fetchSwimmers]);

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const data = await response.json();
      setTasks(prev => prev.map(task => task.id === taskId ? data.task : task));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskCreate = async (taskData: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) throw new Error('Failed to create task');

      const data = await response.json();
      setTasks(prev => [data.task, ...prev]);
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTaskEdit = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const data = await response.json();
      setTasks(prev => prev.map(task => task.id === taskId ? data.task : task));
      setEditModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const clearFilters = () => {
    setFilters({
      assigned_to: 'all',
      created_by: 'all',
      category: 'all',
      priority: 'all',
      swimmer_id: 'all',
    });
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Task Management</h1>
          <p className="text-muted-foreground">
            Manage tasks and assignments for your team
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {Object.values(filters).some(Boolean) && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(filters).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <CreateTaskModal
                users={users}
                swimmers={swimmers}
                onSubmit={handleTaskCreate}
                onCancel={() => setCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="created_by" className="text-xs sm:text-sm">Created By</Label>
                <Select
                  value={filters.created_by}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, created_by: value }))}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All creators" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All creators</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-xs sm:text-sm">
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_to" className="text-xs sm:text-sm">Assigned To</Label>
                <Select
                  value={filters.assigned_to}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-xs sm:text-sm">
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    <SelectItem value="swimmer_related">Swimmer Related</SelectItem>
                    <SelectItem value="business_operations">Business Operations</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority" className="text-xs sm:text-sm">Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="swimmer_id" className="text-xs sm:text-sm">Related Swimmer</Label>
                <Select
                  value={filters.swimmer_id}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, swimmer_id: value }))}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="All swimmers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All swimmers</SelectItem>
                    {swimmers.map(swimmer => (
                      <SelectItem key={swimmer.id} value={swimmer.id} className="text-xs sm:text-sm">
                        {swimmer.first_name} {swimmer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2 text-xs sm:text-sm h-8 sm:h-9">
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">To Do</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'todo').length}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {tasks.filter(t => t.status === 'needs_attention').length}
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskEdit={(task) => {
          setSelectedTask(task);
          setEditModalOpen(true);
        }}
        onTaskDelete={handleTaskDelete}
      />

      {/* Past Tasks Table */}
      <div className="mt-8">
        <Button
          variant="outline"
          onClick={() => setShowPastTasks(!showPastTasks)}
          className="flex items-center gap-2 mb-4"
        >
          {showPastTasks ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          Past Tasks ({tasks.filter(t => t.status === 'completed').length})
        </Button>

        {showPastTasks && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks
                    .filter(t => t.status === 'completed')
                    .map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>
                          {task.assigned_to_user ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-full bg-gray-200 text-xs h-6 w-6">
                                {task.assigned_to_user.full_name?.charAt(0) || task.assigned_to_user.email.charAt(0)}
                              </span>
                              <span>{task.assigned_to_user.full_name || task.assigned_to_user.email}</span>
                            </div>
                          ) : (
                            'Unassigned'
                          )}
                        </TableCell>
                        <TableCell>
                          {task.completed_at ? format(new Date(task.completed_at), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {task.created_by_user?.full_name || task.created_by_user?.email || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {task.category === 'swimmer_related' ? 'Swimmer' :
                             task.category === 'business_operations' ? 'Business' :
                             task.category === 'follow_up' ? 'Follow-up' : 'Other'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Task Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <EditTaskModal
              task={selectedTask}
              users={users}
              swimmers={swimmers}
              onSubmit={(updates) => handleTaskEdit(selectedTask.id, updates)}
              onCancel={() => {
                setEditModalOpen(false);
                setSelectedTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}