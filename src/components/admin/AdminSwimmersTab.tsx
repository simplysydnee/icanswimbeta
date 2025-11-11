import { useState } from "react";
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
import { Eye } from "lucide-react";
import { Swimmer } from "@/hooks/useSwimmers";

interface AdminSwimmersTabProps {
  swimmers: Swimmer[];
  onViewSwimmer: (swimmerId: string) => void;
}

export const AdminSwimmersTab = ({ swimmers, onViewSwimmer }: AdminSwimmersTabProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      waitlist: "outline",
      pending_enrollment: "secondary",
      pending: "secondary",
      approved: "default",
      declined: "destructive",
      enrolled: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>;
  };

  const getClientTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "vmrc" ? "secondary" : "outline"}>
        {type === "vmrc" ? "VMRC" : "Private Pay"}
      </Badge>
    );
  };

  const filteredSwimmers = swimmers.filter(
    (s) =>
      !searchTerm ||
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Swimmers</CardTitle>
        <Input
          placeholder="Search swimmers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mt-4"
        />
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Parent</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Level</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSwimmers.map((swimmer) => (
                <TableRow key={swimmer.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{swimmer.first_name} {swimmer.last_name}</div>
                      <div className="text-xs text-muted-foreground md:hidden mt-1">
                        {swimmer.profiles?.full_name || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{swimmer.profiles?.full_name || "N/A"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{getClientTypeBadge(swimmer.payment_type)}</TableCell>
                  <TableCell>{getStatusBadge(swimmer.enrollment_status)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant="outline">
                      {swimmer.swim_levels?.display_name || "Not Set"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewSwimmer(swimmer.id)}
                      className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                    >
                      <Eye className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
