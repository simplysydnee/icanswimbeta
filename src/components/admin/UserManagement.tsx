import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserPlus, Link } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "instructor" | "parent" | "vmrc_coordinator";
}

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  parent_id: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSwimmers, setSelectedSwimmers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchSwimmers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      if (profilesError) throw profilesError;

      const usersWithRoles = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...profile,
            role: roleData?.role || "parent",
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSwimmers = async () => {
    try {
      const { data, error } = await supabase
        .from("swimmers")
        .select("id, first_name, last_name, parent_id")
        .order("first_name");

      if (error) throw error;
      setSwimmers(data || []);
    } catch (error) {
      console.error("Error fetching swimmers:", error);
    }
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "instructor" | "parent" | "vmrc_coordinator") => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const openConnectDialog = (user: User) => {
    setSelectedUser(user);
    const userSwimmers = swimmers
      .filter((s) => s.parent_id === user.id)
      .map((s) => s.id);
    setSelectedSwimmers(userSwimmers);
    setConnectDialogOpen(true);
  };

  const handleConnectSwimmers = async () => {
    if (!selectedUser) return;

    try {
      // Get current swimmers for this parent
      const currentSwimmers = swimmers
        .filter((s) => s.parent_id === selectedUser.id)
        .map((s) => s.id);

      // Find swimmers to disconnect (were connected, not selected now)
      const toDisconnect = currentSwimmers.filter((id) => !selectedSwimmers.includes(id));

      // Find swimmers to connect (selected but not currently connected)
      const toConnect = selectedSwimmers.filter((id) => !currentSwimmers.includes(id));

      // Disconnect swimmers
      if (toDisconnect.length > 0) {
        const { error: disconnectError } = await supabase
          .from("swimmers")
          .update({ parent_id: null })
          .in("id", toDisconnect);

        if (disconnectError) throw disconnectError;
      }

      // Connect swimmers
      if (toConnect.length > 0) {
        const { error: connectError } = await supabase
          .from("swimmers")
          .update({ parent_id: selectedUser.id })
          .in("id", toConnect);

        if (connectError) throw connectError;
      }

      toast({
        title: "Success",
        description: "Swimmer connections updated successfully",
      });

      fetchSwimmers();
      setConnectDialogOpen(false);
    } catch (error) {
      console.error("Error connecting swimmers:", error);
      toast({
        title: "Error",
        description: "Failed to update swimmer connections",
        variant: "destructive",
      });
    }
  };

  const toggleSwimmer = (swimmerId: string) => {
    setSelectedSwimmers((prev) =>
      prev.includes(swimmerId)
        ? prev.filter((id) => id !== swimmerId)
        : [...prev, swimmerId]
    );
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "instructor":
        return "default";
      case "vmrc_coordinator":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and swimmer connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Connected Swimmers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const userSwimmers = swimmers.filter((s) => s.parent_id === user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || "N/A"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value as "admin" | "instructor" | "parent" | "vmrc_coordinator")}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="vmrc_coordinator">VMRC Coordinator</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {userSwimmers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {userSwimmers.map((swimmer) => (
                            <Badge key={swimmer.id} variant="outline">
                              {swimmer.first_name} {swimmer.last_name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConnectDialog(user)}
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Connect Swimmers
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect Swimmers to {selectedUser?.full_name}</DialogTitle>
            <DialogDescription>
              Select which swimmers should be connected to this user
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {swimmers.map((swimmer) => (
              <div
                key={swimmer.id}
                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => toggleSwimmer(swimmer.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedSwimmers.includes(swimmer.id)}
                  onChange={() => toggleSwimmer(swimmer.id)}
                  className="h-4 w-4"
                />
                <Label className="flex-1 cursor-pointer">
                  {swimmer.first_name} {swimmer.last_name}
                  {swimmer.parent_id && swimmer.parent_id !== selectedUser?.id && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      (Currently connected to another parent)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectSwimmers}>Save Connections</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
