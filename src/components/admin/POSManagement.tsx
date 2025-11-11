import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  swimmer_id: string;
  coordinator_id: string;
  po_type: string;
  start_date: string;
  end_date: string;
  allowed_lessons: number;
  lessons_booked: number;
  lessons_used: number;
  status: string;
  authorization_number: string | null;
  comments: string | null;
  created_at: string;
  swimmers?: {
    first_name: string;
    last_name: string;
  };
  coordinator?: {
    full_name: string;
  };
}

interface POSComment {
  id: string;
  pos_id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export const POSManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [comments, setComments] = useState<Record<string, POSComment[]>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [selectedPOS, setSelectedPOS] = useState<PurchaseOrder | null>(null);
  const [swimmers, setSwimmers] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  const [formData, setFormData] = useState({
    swimmer_id: "",
    coordinator_id: "",
    po_type: "lessons",
    start_date: "",
    end_date: "",
    allowed_lessons: 12,
    status: "pending",
    authorization_number: "",
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSwimmers();
    fetchCoordinators();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      // Single query with joins - fixes N+1 query problem
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          swimmers!purchase_orders_swimmer_id_fkey(first_name, last_name),
          profiles!purchase_orders_coordinator_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data as any || []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch purchase orders",
        variant: "destructive",
      });
    }
  };

  const fetchSwimmers = async () => {
    try {
      const { data, error } = await supabase
        .from("swimmers")
        .select("id, first_name, last_name, is_vmrc_client")
        .order("first_name");

      if (error) throw error;
      setSwimmers(data || []);
    } catch (error) {
      console.error("Error fetching swimmers:", error);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles:user_id (id, full_name)")
        .eq("role", "vmrc_coordinator");

      if (error) throw error;
      const mapped = data.map((d: any) => d.profiles).filter(Boolean);
      setCoordinators(mapped || []);
    } catch (error) {
      console.error("Error fetching coordinators:", error);
    }
  };

  const fetchComments = async (posId: string) => {
    try {
      // Single query with join - fixes N+1 query problem
      const { data, error } = await supabase
        .from("pos_comments")
        .select(`
          *,
          profiles!pos_comments_user_id_fkey(full_name)
        `)
        .eq("pos_id", posId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments((prev) => ({ ...prev, [posId]: data as any || [] }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const { error } = await supabase.from("purchase_orders").insert({
        swimmer_id: formData.swimmer_id,
        coordinator_id: formData.coordinator_id || null,
        po_type: formData.po_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        allowed_lessons: formData.allowed_lessons,
        status: formData.status,
        authorization_number: formData.authorization_number || null,
        lessons_booked: 0,
        lessons_used: 0,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order created successfully",
      });

      setShowCreateDialog(false);
      resetForm();
      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error creating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedPOS) return;

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          coordinator_id: formData.coordinator_id || null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          allowed_lessons: formData.allowed_lessons,
          status: formData.status,
          authorization_number: formData.authorization_number || null,
        })
        .eq("id", selectedPOS.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });

      setShowEditDialog(false);
      setSelectedPOS(null);
      resetForm();
      fetchPurchaseOrders();
    } catch (error) {
      console.error("Error updating purchase order:", error);
      toast({
        title: "Error",
        description: "Failed to update purchase order",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!selectedPOS || !newComment.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("pos_comments").insert({
        pos_id: selectedPOS.id,
        user_id: user.id,
        comment: newComment.trim(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Comment added successfully",
      });

      setNewComment("");
      fetchComments(selectedPOS.id);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      swimmer_id: "",
      coordinator_id: "",
      po_type: "lessons",
      start_date: "",
      end_date: "",
      allowed_lessons: 12,
      status: "pending",
      authorization_number: "",
    });
  };

  const openEditDialog = (pos: PurchaseOrder) => {
    setSelectedPOS(pos);
    setFormData({
      swimmer_id: pos.swimmer_id,
      coordinator_id: pos.coordinator_id || "",
      po_type: pos.po_type,
      start_date: pos.start_date,
      end_date: pos.end_date,
      allowed_lessons: pos.allowed_lessons,
      status: pos.status,
      authorization_number: pos.authorization_number || "",
    });
    setShowEditDialog(true);
  };

  const openCommentsDialog = (pos: PurchaseOrder) => {
    setSelectedPOS(pos);
    fetchComments(pos.id);
    setShowCommentsDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Open" },
      in_progress: { variant: "default", label: "Open" },
      completed: { variant: "outline", label: "Completed" },
      billed: { variant: "secondary", label: "Billed" },
      closed: { variant: "destructive", label: "Closed" },
    };
    const statusInfo = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredPOS = purchaseOrders.filter((pos) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      pos.swimmers?.first_name.toLowerCase().includes(searchLower) ||
      pos.swimmers?.last_name.toLowerCase().includes(searchLower) ||
      pos.authorization_number?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Purchase Orders Management</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create POS
          </Button>
        </div>
        <Input
          placeholder="Search by swimmer name or auth number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4"
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Swimmer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Auth #</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Lessons</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOS.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell>
                    {pos.swimmers?.first_name} {pos.swimmers?.last_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{pos.po_type}</Badge>
                  </TableCell>
                  <TableCell>{pos.authorization_number || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(pos.start_date), "MMM d, yyyy")} -{" "}
                    {format(new Date(pos.end_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {pos.lessons_used}/{pos.allowed_lessons}
                  </TableCell>
                  <TableCell>{pos.coordinator?.full_name || "—"}</TableCell>
                  <TableCell>{getStatusBadge(pos.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(pos)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCommentsDialog(pos)}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Create POS Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Swimmer *</Label>
              <Select
                value={formData.swimmer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, swimmer_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select swimmer" />
                </SelectTrigger>
                <SelectContent>
                  {swimmers.map((swimmer) => (
                    <SelectItem key={swimmer.id} value={swimmer.id}>
                      {swimmer.first_name} {swimmer.last_name}
                      {swimmer.is_vmrc_client && " (VMRC)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Coordinator</Label>
              <Select
                value={formData.coordinator_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, coordinator_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {coordinators.map((coord) => (
                    <SelectItem key={coord.id} value={coord.id}>
                      {coord.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.po_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, po_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="lessons">Lessons</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Allowed Lessons *</Label>
                <Input
                  type="number"
                  value={formData.allowed_lessons}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowed_lessons: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Authorization Number</Label>
              <Input
                value={formData.authorization_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    authorization_number: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="billed">Billed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit POS Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Coordinator</Label>
              <Select
                value={formData.coordinator_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, coordinator_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select coordinator (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {coordinators.map((coord) => (
                    <SelectItem key={coord.id} value={coord.id}>
                      {coord.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Allowed Lessons *</Label>
              <Input
                type="number"
                value={formData.allowed_lessons}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allowed_lessons: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Authorization Number</Label>
              <Input
                value={formData.authorization_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    authorization_number: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Open</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="billed">Billed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Comments - {selectedPOS?.swimmers?.first_name}{" "}
              {selectedPOS?.swimmers?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {comments[selectedPOS?.id || ""]?.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>{comment.profiles?.full_name}</span>
                      <span>{format(new Date(comment.created_at), "MMM d, yyyy HH:mm")}</span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </CardContent>
                </Card>
              ))}
              {(!comments[selectedPOS?.id || ""] ||
                comments[selectedPOS?.id || ""].length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No comments yet
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Add Comment</Label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comment..."
                rows={3}
              />
              <Button onClick={handleAddComment} className="w-full">
                Add Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
