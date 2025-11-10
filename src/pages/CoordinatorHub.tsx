import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertCircle, Calendar, CheckCircle, Clock, FileText, Plus, Search, Upload, Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import logoHeader from "@/assets/logo-header.png";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Swimmer {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  current_level_id: string | null;
  is_vmrc_client: boolean;
  parent_phone: string | null;
  swim_levels?: {
    display_name: string;
  };
}

interface PurchaseOrder {
  id: string;
  swimmer_id: string;
  po_type: 'assessment' | 'lessons';
  authorization_number: string | null;
  start_date: string;
  end_date: string;
  allowed_lessons: number;
  lessons_booked: number;
  lessons_used: number;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  swimmer?: {
    first_name: string;
    last_name: string;
    parent_id: string;
  };
}

interface KPIData {
  totalClients: number;
  posPending: number;
  posInProgress: number;
  expiringIn14Days: number;
}

const CoordinatorHub = () => {
  const { toast } = useToast();
  const [kpis, setKpis] = useState<KPIData>({
    totalClients: 0,
    posPending: 0,
    posInProgress: 0,
    expiringIn14Days: 0,
  });
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [authNumber, setAuthNumber] = useState("");
  const [showReferralDrawer, setShowReferralDrawer] = useState(false);
  const [referralForm, setReferralForm] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childAge: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch swimmers created by this coordinator
      const { data: swimmersData, error: swimmersError } = await supabase
        .from("swimmers")
        .select(`
          *,
          swim_levels(display_name)
        `)
        .eq("created_by", user.id)
        .eq("is_vmrc_client", true)
        .order("first_name");

      if (swimmersError) throw swimmersError;
      setSwimmers(swimmersData || []);

      // Fetch POS for this coordinator
      const { data: posData, error: posError } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          swimmer:swimmers(first_name, last_name, parent_id)
        `)
        .eq("coordinator_id", user.id)
        .order("created_at", { ascending: false });

      if (posError) throw posError;
      setPurchaseOrders((posData || []) as PurchaseOrder[]);

      // Calculate KPIs
      const today = new Date();
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(today.getDate() + 14);

      const kpiData: KPIData = {
        totalClients: swimmersData?.length || 0,
        posPending: posData?.filter(po => po.status === 'pending').length || 0,
        posInProgress: posData?.filter(po => po.status === 'in_progress').length || 0,
        expiringIn14Days: posData?.filter(po => {
          const endDate = new Date(po.end_date);
          return endDate > today && endDate <= fourteenDaysFromNow && po.status === 'in_progress';
        }).length || 0,
      };

      setKpis(kpiData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load coordinator data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAuthNumber = async () => {
    if (!selectedPO || !authNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an authorization number",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          authorization_number: authNumber,
          status: 'in_progress',
        })
        .eq("id", selectedPO.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Authorization number updated successfully",
      });

      setSelectedPO(null);
      setAuthNumber("");
      fetchData();
    } catch (error) {
      console.error("Error updating auth number:", error);
      toast({
        title: "Error",
        description: "Failed to update authorization number",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (po: PurchaseOrder) => {
    const today = new Date();
    const endDate = new Date(po.end_date);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (po.status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (po.status === 'completed') {
      return <Badge className="bg-green-500">Completed</Badge>;
    }
    if (daysUntilExpiry <= 14 && po.status === 'in_progress') {
      return <Badge className="bg-amber-500">Expiring Soon</Badge>;
    }
    if (po.status === 'in_progress') {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const handleSubmitReferral = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", user.id)
        .single();

      const { error } = await supabase
        .from("vmrc_referral_requests")
        .insert({
          parent_name: referralForm.parentName,
          parent_email: referralForm.parentEmail,
          parent_phone: referralForm.parentPhone,
          child_name: referralForm.childName,
          child_age: parseInt(referralForm.childAge),
          referral_type: "vmrc",
          coordinator_name: profile?.full_name || "",
          coordinator_email: profile?.email || "",
          coordinator_notes: referralForm.notes,
          status: "coordinator_completed"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Referral submitted successfully",
      });

      setShowReferralDrawer(false);
      setReferralForm({
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        notes: ""
      });
      fetchData();
    } catch (error) {
      console.error("Error submitting referral:", error);
      toast({
        title: "Error",
        description: "Failed to submit referral",
        variant: "destructive",
      });
    }
  };

  const filteredSwimmers = swimmers.filter(swimmer => 
    swimmer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    swimmer.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = 
      po.swimmer?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.swimmer?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.authorization_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getLessonCount = (swimmerId: string) => {
    const activePO = purchaseOrders.find(
      po => po.swimmer_id === swimmerId && 
      po.status === 'in_progress' && 
      po.po_type === 'lessons'
    );
    
    if (!activePO) return { used: 0, total: 0, remaining: 0 };
    
    return {
      used: activePO.lessons_used,
      total: activePO.allowed_lessons,
      remaining: activePO.allowed_lessons - activePO.lessons_used
    };
  };

  if (loading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-4">
        <img 
          src={logoHeader} 
          alt="I CAN SWIM" 
          className="h-12 w-auto object-contain"
        />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">VMRC Coordinator Hub</h1>
          <p className="text-muted-foreground">Manage clients, referrals, and purchase orders</p>
        </div>
        <Button onClick={() => setShowReferralDrawer(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Referral
        </Button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.posPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">POS In Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.posInProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.expiringIn14Days}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">My Clients</TabsTrigger>
          <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
        </TabsList>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <Card>
            <CardHeader>
              <CardTitle>VMRC Clients</CardTitle>
              <CardDescription>View and manage your VMRC client roster</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Lessons Used</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSwimmers.map((swimmer) => {
                    const lessonCount = getLessonCount(swimmer.id);
                    return (
                      <TableRow key={swimmer.id}>
                        <TableCell className="font-medium">
                          {swimmer.first_name} {swimmer.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {swimmer.swim_levels?.display_name || 'Not Assigned'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {swimmer.parent_phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {swimmer.parent_phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {lessonCount.used} / {lessonCount.total}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={lessonCount.remaining <= 2 ? "destructive" : "secondary"}
                          >
                            {lessonCount.remaining}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSwimmers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No clients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Orders Tab */}
        <TabsContent value="pos">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Manage assessment and lesson authorizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by swimmer name or auth #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="in_progress">
            <TabsList>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>

            <TabsContent value="in_progress" className="space-y-4">
              {filteredPOs.filter(po => po.status === 'in_progress').map((po) => (
                <Card key={po.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {po.swimmer?.first_name} {po.swimmer?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {po.po_type === 'assessment' ? 'Assessment' : 'Lessons'} • 
                          Auth #{po.authorization_number || 'N/A'}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(po.start_date), 'MMM d')} - {format(new Date(po.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm font-medium">
                          <span>Allowed: {po.allowed_lessons}</span>
                          <span>Booked: {po.lessons_booked}</span>
                          <span>Used: {po.lessons_used}</span>
                          <span>Remaining: {po.allowed_lessons - po.lessons_used}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(po)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPOs.filter(po => po.status === 'in_progress').length === 0 && (
                <p className="text-center text-muted-foreground py-8">No purchase orders in progress</p>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {filteredPOs.filter(po => po.status === 'pending').map((po) => (
                <Card key={po.id} className="cursor-pointer hover:bg-accent" onClick={() => setSelectedPO(po)}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold">
                          {po.swimmer?.first_name} {po.swimmer?.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {po.po_type === 'assessment' ? 'Assessment' : 'Lessons'} • Awaiting Authorization
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(po.start_date), 'MMM d')} - {format(new Date(po.end_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(po)}
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPO(po);
                        }}>
                          <Upload className="h-3 w-3 mr-1" />
                          Add Auth #
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPOs.filter(po => po.status === 'pending').length === 0 && (
                <p className="text-center text-muted-foreground py-8">No pending purchase orders</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Authorization Number Drawer */}
      <Drawer open={!!selectedPO} onOpenChange={(open) => !open && setSelectedPO(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add Authorization Number</DrawerTitle>
            <DrawerDescription>
              Enter the authorization number for {selectedPO?.swimmer?.first_name} {selectedPO?.swimmer?.last_name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <Input
              placeholder="Enter authorization number..."
              value={authNumber}
              onChange={(e) => setAuthNumber(e.target.value)}
            />
          </div>
          <DrawerFooter>
            <Button onClick={handleUpdateAuthNumber}>Submit</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Referral Drawer */}
      <Drawer open={showReferralDrawer} onOpenChange={setShowReferralDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>New VMRC Referral</DrawerTitle>
            <DrawerDescription>
              Submit a new referral for VMRC services
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Parent Name *</Label>
                <Input
                  id="parentName"
                  value={referralForm.parentName}
                  onChange={(e) => setReferralForm({...referralForm, parentName: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Parent Email *</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={referralForm.parentEmail}
                  onChange={(e) => setReferralForm({...referralForm, parentEmail: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Parent Phone *</Label>
                <Input
                  id="parentPhone"
                  value={referralForm.parentPhone}
                  onChange={(e) => setReferralForm({...referralForm, parentPhone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="childAge">Child Age *</Label>
                <Input
                  id="childAge"
                  type="number"
                  value={referralForm.childAge}
                  onChange={(e) => setReferralForm({...referralForm, childAge: e.target.value})}
                  placeholder="Age"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="childName">Child Name *</Label>
              <Input
                id="childName"
                value={referralForm.childName}
                onChange={(e) => setReferralForm({...referralForm, childName: e.target.value})}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={referralForm.notes}
                onChange={(e) => setReferralForm({...referralForm, notes: e.target.value})}
                placeholder="Any additional information..."
                rows={3}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSubmitReferral}>Submit Referral</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default CoordinatorHub;
